export interface RawExpense {
  ID?: string;
  id?: string;
  Data?: string | Date;
  data?: string | Date;
  Descrição?: string;
  desc?: string;
  Valor?: string | number;
  valor?: string | number;
  Tag?: string;
  tag?: string;
  Compartilhado?: boolean | string;
  ['ID Parcelamento']?: string;
}

export interface RawRecurringRule {
  ID?: string;
  id?: string;
  Descrição?: string;
  desc?: string;
  ValorEstimado?: string | number;
  ['Valor Estimado']?: string | number;
  ['valor estimado']?: string | number;
  DiaVencimento?: string | number;
  ['Dia Vencimento']?: string | number;
  ['dia vencimento']?: string | number;
  Tipo?: string;
  tipo?: string;
  Dono?: string;
  dono?: string;
  Ativo?: boolean | string | number;
  ativo?: boolean | string | number;
}

interface ApiRequestPayload {
  token: string;
  action: string;
  [key: string]: unknown;
}

/**
 * Função genérica para realizar chamadas para a API do Google Apps Script
 * Utiliza POST e envia o corpo como texto plano para evitar requisições pré-vias do CORS (preflight OPTIONS)
 */
export async function request<T = unknown>(
  url: string, 
  token: string, 
  action: string, 
  args: Record<string, unknown> = {}
): Promise<T> {
  try {
    const payload: ApiRequestPayload = {
      token,
      action,
      ...args
    };
    
    // NOTA: Não inserimos o cabeçalho 'Content-Type: application/json' de propósito.
    // Deixando o navegador omitir ou definir como texto puro, evitamos o pré-voo (preflight) OPTIONS do CORS.
    // O Apps Script recebe o corpo e consegue lê-lo normalmente.
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Erro na conexão com o Google Sheets: HTTP ${response.status}`);
    }
    
    const data = await response.json() as T;
    
    // Se o script retornou erro explicitamente
    const dataObj = data as Record<string, unknown> | null;
    if (dataObj && dataObj.success === false) {
      throw new Error(String(dataObj.error) || 'Ocorreu um erro no processamento da planilha.');
    }
    
    return data;
  } catch (error: unknown) {
    console.error(`Erro de API na ação "${action}":`, error);
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    throw new Error(err.message || 'Não foi possível estabelecer contato com a planilha.', { cause: error });
  }
}

/**
 * Realiza uma requisição simples de "ping" para validar se a URL e a senha estão corretas
 */
export async function testConnection(url: string, token: string): Promise<boolean> {
  const result = await request<{ success: boolean }>(url, token, 'ping');
  return result && result.success === true;
}

/**
 * Aciona a inicialização das abas necessárias da planilha (Wesley, Luana e Recorrentes)
 */
export async function initializeSpreadsheet(url: string, token: string): Promise<unknown> {
  return await request(url, token, 'initialize');
}

/**
 * Adiciona uma lista de transações na aba correspondente da planilha (em lote)
 */
export async function addExpenses(
  url: string, 
  token: string, 
  tabName: string, 
  expenses: unknown[][]
): Promise<unknown> {
  return await request(url, token, 'addExpenses', { tabName, expenses });
}

/**
 * Adiciona uma nova regra de despesa recorrente na aba Recorrentes da planilha
 */
export async function addRecurringRule(
  url: string, 
  token: string, 
  rule: unknown[]
): Promise<unknown> {
  return await request(url, token, 'addRecurringRule', { rule });
}

/**
 * Busca todas as despesas mensais e regras recorrentes consolidadas de um determinado mês YYYY-MM
 */
export async function getMonthData(
  url: string, 
  token: string, 
  month: string
): Promise<{
  success: boolean;
  recurring: RawRecurringRule[];
  wesleyExpenses: RawExpense[];
  luanaExpenses: RawExpense[];
}> {
  return await request<{
    success: boolean;
    recurring: RawRecurringRule[];
    wesleyExpenses: RawExpense[];
    luanaExpenses: RawExpense[];
  }>(url, token, 'getMonthData', { month });
}

/**
 * Exclui uma despesa pelo ID na aba correspondente
 */
export async function deleteExpense(
  url: string, 
  token: string, 
  tabName: string, 
  id: string
): Promise<unknown> {
  return await request(url, token, 'deleteExpense', { tabName, id });
}

/**
 * Atualiza os valores de uma despesa pelo ID na aba correspondente
 */
export async function updateExpense(
  url: string, 
  token: string, 
  tabName: string, 
  id: string,
  expense: unknown[]
): Promise<unknown> {
  return await request(url, token, 'updateExpense', { tabName, id, expense });
}

/**
 * Exclui em lote parcelas futuras vinculadas a um ID de parcelamento a partir de uma data base
 */
export async function deleteInstallments(
  url: string,
  token: string,
  tabName: string,
  installmentGroupId: string,
  baseDate: string
): Promise<unknown> {
  return await request(url, token, 'deleteInstallments', { tabName, installmentGroupId, baseDate });
}

/**
 * Atualiza em lote campos de parcelas futuras vinculadas a um ID de parcelamento a partir de uma data base
 */
export async function updateInstallments(
  url: string,
  token: string,
  tabName: string,
  installmentGroupId: string,
  baseDate: string,
  updatedFields: {
    Descrição?: string;
    Valor?: number;
    Tag?: string;
    Compartilhado?: boolean;
  }
): Promise<unknown> {
  return await request(url, token, 'updateInstallments', { tabName, installmentGroupId, baseDate, updatedFields });
}
