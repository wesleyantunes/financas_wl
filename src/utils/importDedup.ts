import { detectInstallment } from './importParsers';
import type { ParsedTransaction } from './importParsers';

export interface DedupExpenseRef {
  id: string;
  date: string; // 'YYYY-MM-DD'
  description: string;
  value: number;
}

export type ImportStatus = 'novo' | 'possivel_duplicata' | 'continuacao_parcelamento';

export interface ClassifiedTransaction extends ParsedTransaction {
  status: ImportStatus;
  matchId?: string;
  /** Data da parcela relacionada já existente (só quando status === 'continuacao_parcelamento') */
  relatedDate?: string;
}

const ACCENTED_CHARS = 'áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ';
const PLAIN_CHARS = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN';

function stripAccents(s: string): string {
  let result = s;
  for (let i = 0; i < ACCENTED_CHARS.length; i++) {
    result = result.split(ACCENTED_CHARS[i]).join(PLAIN_CHARS[i]);
  }
  return result;
}

function normalizeText(s: string): string {
  return stripAccents(s.toLowerCase())
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return Infinity;
  return Math.abs((da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Classifica cada transação importada comparando contra despesas já existentes:
 * - 'possivel_duplicata': mesmo valor (abs), data dentro de ±2 dias, e descrição com
 *   similaridade textual — provavelmente já foi lançada, desmarcada por padrão na revisão.
 * - 'continuacao_parcelamento': mesma descrição-base (sem o marcador "NN/MM"), mas parcela
 *   diferente da que já existe — sinaliza que há uma compra parcelada relacionada já lançada,
 *   SEM excluir ou desmarcar (pode haver mais de uma compra distinta com o mesmo nome de
 *   estabelecimento; a decisão de importar continua sendo do usuário).
 * - 'novo': nenhuma relação encontrada.
 * Nunca decide sozinho — apenas sinaliza para revisão humana antes de qualquer gravação.
 */
export function matchExisting(
  imported: ParsedTransaction[],
  existing: DedupExpenseRef[]
): ClassifiedTransaction[] {
  return imported.map(item => {
    const normImportedDesc = normalizeText(item.descricao);
    const importedAbsValue = Math.abs(item.valor);

    const exactMatch = existing.find(exp => {
      if (Math.abs(exp.value - importedAbsValue) > 0.01) return false;
      if (!item.data || daysBetween(exp.date, item.data) > 2) return false;
      const normExpDesc = normalizeText(exp.description);
      if (!normExpDesc || !normImportedDesc) return false;
      return normExpDesc.includes(normImportedDesc) || normImportedDesc.includes(normExpDesc);
    });

    if (exactMatch) {
      return { ...item, status: 'possivel_duplicata', matchId: exactMatch.id };
    }

    const importedInstallment = detectInstallment(item.descricao);
    const normImportedBase = normalizeText(importedInstallment ? importedInstallment.cleanDescricao : item.descricao);

    const relatedMatch = existing.find(exp => {
      const existingInstallment = detectInstallment(exp.description);
      if (!existingInstallment) return false;

      const normExpBase = normalizeText(existingInstallment.cleanDescricao);
      if (!normExpBase || !normImportedBase) return false;
      if (!normExpBase.includes(normImportedBase) && !normImportedBase.includes(normExpBase)) return false;

      // Só sinaliza se a parcela detectada for realmente diferente da já existente
      // (parcela igual + mesma descrição-base já teria caído no match exato acima).
      if (importedInstallment && existingInstallment.info.current === importedInstallment.info.current) return false;

      return true;
    });

    if (relatedMatch) {
      return { ...item, status: 'continuacao_parcelamento', matchId: relatedMatch.id, relatedDate: relatedMatch.date };
    }

    return { ...item, status: 'novo' };
  });
}
