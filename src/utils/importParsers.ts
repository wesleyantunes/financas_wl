import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export interface ParsedTransaction {
  data: string; // 'YYYY-MM-DD'
  descricao: string;
  valor: number;
}

export interface CsvColumnMapping {
  date: number;
  description: number;
  value: number;
  hasHeader: boolean;
}

const MONTH_ABBR_MAP: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
};

function normalizeDateBR(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.substring(0, 10);

  // DD/MM/YYYY ou DD/MM (mês numérico)
  const fullMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (fullMatch) {
    const [, d, m, yRaw] = fullMatch;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${m}-${d}`;
  }

  const shortMatch = trimmed.match(/^(\d{2})\/(\d{2})$/);
  if (shortMatch) {
    const [, d, m] = shortMatch;
    return `${new Date().getFullYear()}-${m}-${d}`;
  }

  // DD/mon ou DD/mon/YYYY (abreviação de mês em português, comum em faturas de cartão brasileiras)
  const abbrMatch = trimmed.match(/^(\d{2})\/([a-zç]{3})(?:\/(\d{2,4}))?$/i);
  if (abbrMatch) {
    const [, d, monRaw, yRaw] = abbrMatch;
    const m = MONTH_ABBR_MAP[monRaw.toLowerCase()];
    if (!m) return '';
    const y = yRaw ? (yRaw.length === 2 ? `20${yRaw}` : yRaw) : String(new Date().getFullYear());
    return `${y}-${m}-${d}`;
  }

  return '';
}

function parseValorBR(raw: string): number {
  const trimmed = raw.trim();
  const isNegative = /-/.test(trimmed) || /^\(.*\)$/.test(trimmed);

  // Remove sinal, "R$" e parênteses independentemente da ordem em que aparecem
  // (faturas de cartão costumam escrever créditos como "-R$ 75,00", com o sinal antes do símbolo).
  let cleaned = trimmed
    .replace(/R\$/gi, '')
    .replace(/[()-]/g, '')
    .trim();

  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const val = parseFloat(cleaned);
  if (isNaN(val)) return NaN;
  return isNegative ? -val : val;
}

/**
 * Faz o parse inicial do CSV apenas para preview (primeiras linhas), sem aplicar mapeamento de colunas ainda.
 */
export function parseCsvPreview(fileContent: string, maxRows = 10): string[][] {
  const result = Papa.parse<string[]>(fileContent, { skipEmptyLines: true });
  return (result.data || []).slice(0, maxRows);
}

/**
 * Faz o parse completo do CSV aplicando o mapeamento de colunas indicado pelo usuário.
 */
export function parseCsv(fileContent: string, mapping: CsvColumnMapping): ParsedTransaction[] {
  const result = Papa.parse<string[]>(fileContent, { skipEmptyLines: true });
  const rows = result.data || [];
  const dataRows = mapping.hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row): ParsedTransaction => ({
      data: normalizeDateBR(row[mapping.date] || ''),
      descricao: (row[mapping.description] || '').trim(),
      valor: parseValorBR(row[mapping.value] || '')
    }))
    .filter(t => t.data && t.descricao && !isNaN(t.valor) && t.valor !== 0);
}

/**
 * Parser simples de OFX (texto plano): extrai blocos <STMTTRN> com DTPOSTED, TRNAMT e MEMO/NAME.
 */
export function parseOfx(fileContent: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const blocks = fileContent.split(/<STMTTRN>/i).slice(1);

  blocks.forEach(block => {
    const dtMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const amtMatch = block.match(/<TRNAMT>(-?[\d.,]+)/i);
    const memoMatch = block.match(/<MEMO>([^\r\n<]+)/i);
    const nameMatch = block.match(/<NAME>([^\r\n<]+)/i);

    if (!dtMatch || !amtMatch) return;

    const dateStr = dtMatch[1];
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);

    const valor = parseFloat(amtMatch[1].replace(',', '.'));
    const descricao = (memoMatch?.[1] || nameMatch?.[1] || 'Sem descrição').trim();

    if (!isNaN(valor)) {
      transactions.push({ data: `${y}-${m}-${d}`, descricao, valor });
    }
  });

  return transactions;
}

interface PdfTextItem {
  text: string;
  x: number;
  y: number;
}

const DATE_TOKEN = '\\d{2}\\/(?:\\d{2}|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(?:\\/\\d{2,4})?';
// Valor monetário: aceita sinal antes OU depois do "R$" (faturas de cartão costumam escrever
// créditos/pagamentos como "-R$ 75,00", com o sinal antes do símbolo, não depois).
const VALUE_TOKEN = '(?:-\\s*)?(?:R\\$\\s*)?(?:-\\s*)?[\\d.]+,\\d{2}';
const TRANSACTION_LINE_REGEX = new RegExp(`^(${DATE_TOKEN})\\s+(.+?)\\s+(${VALUE_TOKEN})$`, 'i');
const TOTAL_LINE_REGEX = /total\s*(da|desta)?\s*fatura|valor\s*total/i;
const VALUE_IN_LINE_REGEX = new RegExp(VALUE_TOKEN, 'i');

/**
 * Extrai transações candidatas de um PDF de fatura via heurística genérica de linha
 * (sem template por banco — ver DEC-007). Reconstrói linhas visuais agrupando itens de
 * texto por coordenada Y, já que pdf.js não preserva quebras de linha diretamente.
 */
export async function parsePdfFatura(file: File): Promise<{ transacoes: ParsedTransaction[]; totalDetectado: number | null }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items: PdfTextItem[] = textContent.items.map((item) => {
      const ti = item as { str: string; transform: number[] };
      return { text: ti.str, x: ti.transform[4], y: ti.transform[5] };
    });

    const linesMap = new Map<number, PdfTextItem[]>();
    items.forEach(item => {
      const roundedY = Math.round(item.y / 3) * 3;
      if (!linesMap.has(roundedY)) linesMap.set(roundedY, []);
      linesMap.get(roundedY)!.push(item);
    });

    const sortedLineYs = Array.from(linesMap.keys()).sort((a, b) => b - a);
    sortedLineYs.forEach(y => {
      const lineItems = linesMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
      if (lineText) allLines.push(lineText);
    });
  }

  const transacoes: ParsedTransaction[] = [];
  let totalDetectado: number | null = null;

  allLines.forEach(line => {
    const match = line.match(TRANSACTION_LINE_REGEX);
    if (match) {
      const [, dateRaw, descricao, valorRaw] = match;
      const data = normalizeDateBR(dateRaw);
      const valor = parseValorBR(valorRaw);
      if (data && !isNaN(valor) && valor !== 0) {
        transacoes.push({ data, descricao: descricao.trim(), valor });
      }
      return;
    }

    if (totalDetectado === null && TOTAL_LINE_REGEX.test(line)) {
      const valMatch = line.match(VALUE_IN_LINE_REGEX);
      if (valMatch) {
        const val = parseValorBR(valMatch[1]);
        if (!isNaN(val)) totalDetectado = val;
      }
    }
  });

  return { transacoes, totalDetectado };
}
