interface ApiRequestPayload {
  token: string;
  action: string;
  [key: string]: any;
}

/**
 * Função genérica para realizar chamadas para a API do Google Apps Script
 * Utiliza POST e envia o corpo como texto plano para evitar requisições pré-vias do CORS (preflight OPTIONS)
 */
export async function request(
  url: string, 
  token: string, 
  action: string, 
  args: Record<string, any> = {}
): Promise<any> {
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
    
    const data = await response.json();
    
    // Se o script retornou erro explicitamente
    if (data && data.success === false) {
      throw new Error(data.error || 'Ocorreu um erro no processamento da planilha.');
    }
    
    return data;
  } catch (error: any) {
    console.error(`Erro de API na ação "${action}":`, error);
    throw new Error(error.message || 'Não foi possível estabelecer contato com a planilha.');
  }
}

/**
 * Realiza uma requisição simples de "ping" para validar se a URL e a senha estão corretas
 */
export async function testConnection(url: string, token: string): Promise<boolean> {
  const result = await request(url, token, 'ping');
  return result && result.success === true;
}

/**
 * Aciona a inicialização das abas necessárias da planilha (Wesley, Luana e Recorrentes)
 */
export async function initializeSpreadsheet(url: string, token: string): Promise<any> {
  return await request(url, token, 'initialize');
}

/**
 * Adiciona uma lista de transações na aba correspondente da planilha (em lote)
 */
export async function addExpenses(
  url: string, 
  token: string, 
  tabName: string, 
  expenses: any[][]
): Promise<any> {
  return await request(url, token, 'addExpenses', { tabName, expenses });
}
