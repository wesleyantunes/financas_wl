import type { ParsedTransaction } from './importParsers';

export interface DedupExpenseRef {
  id: string;
  date: string; // 'YYYY-MM-DD'
  description: string;
  value: number;
}

export type ImportStatus = 'novo' | 'possivel_duplicata';

export interface ClassifiedTransaction extends ParsedTransaction {
  status: ImportStatus;
  matchId?: string;
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
 * Classifica cada transação importada como 'novo' ou 'possivel_duplicata' comparando contra
 * despesas já existentes: mesmo valor (abs), data dentro de ±2 dias, e descrição com similaridade
 * textual (substring após normalizar case/acentos). Nunca decide sozinho — apenas sinaliza para
 * revisão humana antes de qualquer gravação.
 */
export function matchExisting(
  imported: ParsedTransaction[],
  existing: DedupExpenseRef[]
): ClassifiedTransaction[] {
  return imported.map(item => {
    const normImportedDesc = normalizeText(item.descricao);
    const importedAbsValue = Math.abs(item.valor);

    const match = existing.find(exp => {
      if (Math.abs(exp.value - importedAbsValue) > 0.01) return false;
      if (!item.data || daysBetween(exp.date, item.data) > 2) return false;
      const normExpDesc = normalizeText(exp.description);
      if (!normExpDesc || !normImportedDesc) return false;
      return normExpDesc.includes(normImportedDesc) || normImportedDesc.includes(normExpDesc);
    });

    return {
      ...item,
      status: match ? 'possivel_duplicata' : 'novo',
      matchId: match?.id
    };
  });
}
