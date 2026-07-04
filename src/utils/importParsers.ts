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

function normalizeDateBR(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.substring(0, 10);

  const fullMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (fullMatch) {
    const [, d, m, yRaw] = fullMatch;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${m}-${d}`;
  }

  const shortMatch = trimmed.match(/^(\d{2})\/(\d{2})$/);
  if (shortMatch) {
    const [, d, m] = shortMatch;
    const y = new Date().getFullYear();
    return `${y}-${m}-${d}`;
  }

  return '';
}

function parseValorBR(raw: string): number {
  let cleaned = raw.trim().replace(/^R\$\s*/i, '');
  const isParenNegative = /^\(.*\)$/.test(cleaned);
  const isNegative = /^-/.test(cleaned) || isParenNegative;
  cleaned = cleaned.replace(/[()]/g, '').replace(/^-/, '').trim();

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

const TRANSACTION_LINE_REGEX = /^(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+(?:R\$\s*)?(-?[\d.]+,\d{2})$/;
const TOTAL_LINE_REGEX = /total\s*(da|desta)?\s*fatura|valor\s*total/i;
const VALUE_IN_LINE_REGEX = /(-?[\d.]+,\d{2})/;

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
      if (data && !isNaN(valor)) {
        transacoes.push({ data, descricao: descricao.trim(), valor: Math.abs(valor) });
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
