/**
 * SCRIPT DO GOOGLE APPS SCRIPT PARA GESTÃO FINANCEIRA COMPARTILHADA
 * 
 * Cole este código no editor de Apps Script da sua planilha (Extensões -> Apps Script).
 * Lembre-se de definir a sua senha de segurança na variável SECRET_TOKEN abaixo.
 * 
 * Após colar, clique em:
 * 1. Salvar (ícone de disquete)
 * 2. Implantar -> Nova Implantação
 * 3. Selecione o tipo: "App da Web"
 * 4. Executar como: "Eu" (seu-email@gmail.com)
 * 5. Quem tem acesso: "Qualquer pessoa" (necessário para o app web acessá-lo diretamente)
 * 6. Clique em Implantar, autorize as permissões e copie a URL gerada do App da Web.
 */

// DEFINA A SUA SENHA DE SEGURANÇA AQUI
const SECRET_TOKEN = "sicredi_finance_123";

/**
 * Função para tratar requisições POST (Cadastro e inicialização de dados)
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'Corpo da requisição vazio' }, 400);
    }
    
    // Parse do payload enviado
    const requestData = JSON.parse(e.postData.contents);
    const token = requestData.token;
    const action = requestData.action;
    
    // Validação do token de segurança
    if (token !== SECRET_TOKEN) {
      return createJsonResponse({ success: false, error: 'Não autorizado. Senha/Token inválido.' }, 401);
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ação: Testar Conexão (Ping)
    if (action === 'ping') {
      return createJsonResponse({ 
        success: true, 
        message: 'Conectado com sucesso!',
        spreadsheetName: spreadsheet.getName()
      });
    }
    
    // Ação: Inicializar Abas da Planilha
    if (action === 'initialize') {
      const activeTabs = ['Despesas [Wesley]', 'Despesas [Luana]', 'Recorrentes', 'Recebimentos [Wesley]', 'Recebimentos [Luana]', 'Recorrentes Recebimentos', 'Orcamentos'];
      const results = {};

      activeTabs.forEach(tabName => {
        const sheetExists = !!spreadsheet.getSheetByName(tabName);
        const sheet = getOrCreateSheet(spreadsheet, tabName);

        if (!sheetExists) {
          // Exemplos específicos pós criação
          if (tabName === 'Recorrentes') {
            sheet.appendRow(['rec_ex1', 'Netflix', 55.90, 10, 'Fixo', 'Compartilhado', true]);
            sheet.appendRow(['rec_ex2', 'Energia Elétrica', 200.00, 15, 'Variável', 'Compartilhado', true]);
            sheet.appendRow(['rec_ex3', 'Água', 80.00, 20, 'Variável', 'Compartilhado', true]);
          } else if (tabName === 'Recorrentes Recebimentos') {
            sheet.appendRow(['recrec_ex1', 'Salário Wesley', 5000.00, 5, 'Wesley', true]);
            sheet.appendRow(['recrec_ex2', 'Pró-labore Luana', 4000.00, 10, 'Luana', true]);
          } else if (tabName === 'Orcamentos') {
            sheet.appendRow(['orc_ex1', 'Lazer', 300.00, 'Compartilhado', true]);
          }
          results[tabName] = 'Criada';
        } else {
          // Se a aba já existe, garantir que os cabeçalhos das despesas tenham Meio de Pagamento
          if (tabName.startsWith('Despesas')) {
            const range = sheet.getRange("A1:H1");
            const values = range.getValues()[0];
            if (values[7] !== 'Meio de Pagamento') {
              sheet.getRange("H1").setValue('Meio de Pagamento');
              sheet.getRange("A1:H1").setFontWeight("bold")
                                      .setBackground("#00a859")
                                      .setFontColor("#ffffff")
                                      .setHorizontalAlignment("center");
            }
          }
          results[tabName] = 'Já existe';
        }
      });
      
      // Remove a aba padrão "Página 1" se as novas foram criadas com sucesso
      let sheet1 = spreadsheet.getSheetByName("Página 1") || spreadsheet.getSheetByName("Sheet1");
      if (sheet1 && spreadsheet.getSheets().length > 3) {
        spreadsheet.deleteSheet(sheet1);
      }
      
      return createJsonResponse({ success: true, results });
    }
    
    // Ação: Adicionar Despesas em Lote
    if (action === 'addExpenses') {
      const tabName = requestData.tabName;
      const expenses = requestData.expenses; // Array bidimensional [[col1, col2, ...], ...]
      
      if (!tabName || !expenses || !expenses.length) {
        return createJsonResponse({ success: false, error: 'Aba ou transações não especificadas' }, 400);
      }
      
      const sheet = getOrCreateSheet(spreadsheet, tabName);
      
      const startRow = sheet.getLastRow() + 1;
      const numRows = expenses.length;
      const numCols = expenses[0].length;
      
      const range = sheet.getRange(startRow, 1, numRows, numCols);
      range.setValues(expenses);
      
      return createJsonResponse({ success: true, count: numRows });
    }

    // Ação: Adicionar Regra Recorrente
    if (action === 'addRecurringRule') {
      const rule = requestData.rule; // Array de valores: [id, descricao, valorEstimado, diaVencimento, tipo, dono, ativo] ou similar
      const tabName = requestData.tabName || 'Recorrentes';
      
      if (!rule || !rule.length) {
        return createJsonResponse({ success: false, error: 'Dados da regra não especificados' }, 400);
      }
      
      const sheet = getOrCreateSheet(spreadsheet, tabName);
      
      sheet.appendRow(rule);
      return createJsonResponse({ success: true });
    }

    // Ação: Obter Orçamentos Ativos
    if (action === 'getBudgets') {
      const sheet = spreadsheet.getSheetByName('Orcamentos');
      const budgets = getRowsAsObjects(sheet, function(row) {
        return row.Ativo === true || row.Ativo === 'TRUE' || row.Ativo === 1;
      });
      return createJsonResponse({ success: true, budgets: budgets });
    }

    // Ação: Adicionar Orçamento
    if (action === 'addBudget') {
      const budget = requestData.budget; // Array: [id, tag, valorLimite, dono, ativo]

      if (!budget || !budget.length) {
        return createJsonResponse({ success: false, error: 'Dados do orçamento não especificados' }, 400);
      }

      const sheet = getOrCreateSheet(spreadsheet, 'Orcamentos');
      sheet.appendRow(budget);
      return createJsonResponse({ success: true });
    }

    // Ação: Atualizar Orçamento por ID
    if (action === 'updateBudget') {
      const id = requestData.id;
      const budget = requestData.budget; // Array de novos valores

      if (!id || !budget || !budget.length) {
        return createJsonResponse({ success: false, error: 'ID ou dados do orçamento não especificados' }, 400);
      }

      const sheet = spreadsheet.getSheetByName('Orcamentos');
      if (!sheet) {
        return createJsonResponse({ success: false, error: 'Aba "Orcamentos" não encontrada' }, 404);
      }

      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return createJsonResponse({ success: false, error: 'Tabela vazia' }, 400);
      }

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let updated = false;

      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(id)) {
          sheet.getRange(i + 2, 1, 1, budget.length).setValues([budget]);
          updated = true;
          break;
        }
      }

      return createJsonResponse({ success: true, updated: updated });
    }

    // Ação: Excluir Orçamento por ID
    if (action === 'deleteBudget') {
      const id = requestData.id;

      if (!id) {
        return createJsonResponse({ success: false, error: 'ID não especificado' }, 400);
      }

      const sheet = spreadsheet.getSheetByName('Orcamentos');
      if (!sheet) {
        return createJsonResponse({ success: false, error: 'Aba "Orcamentos" não encontrada' }, 404);
      }

      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return createJsonResponse({ success: false, error: 'Tabela vazia' }, 400);
      }

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let deleted = false;

      for (let i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]) === String(id)) {
          sheet.deleteRow(i + 2);
          deleted = true;
        }
      }

      return createJsonResponse({ success: true, deleted: deleted });
    }

    // Ação: Obter Dados do Mês e Regras Recorrentes
    if (action === 'getMonthData') {
      const month = requestData.month; // Formato AAAA-MM
      if (!month) {
        return createJsonResponse({ success: false, error: 'Mês não especificado' }, 400);
      }
      
      const recurringSheet = spreadsheet.getSheetByName('Recorrentes');
      const recurringReceivablesSheet = spreadsheet.getSheetByName('Recorrentes Recebimentos');
      const wesleySheet = spreadsheet.getSheetByName('Despesas [Wesley]');
      const luanaSheet = spreadsheet.getSheetByName('Despesas [Luana]');
      const wesleyIncomeSheet = spreadsheet.getSheetByName('Recebimentos [Wesley]');
      const luanaIncomeSheet = spreadsheet.getSheetByName('Recebimentos [Luana]');
      
      // Filtrar regras recorrentes ativas
      const recurring = getRowsAsObjects(recurringSheet, function(row) {
        return row.Ativo === true || row.Ativo === 'TRUE' || row.Ativo === 1;
      });
      
      // Filtrar regras recorrentes de recebimentos ativas
      const recurringReceivables = getRowsAsObjects(recurringReceivablesSheet, function(row) {
        return row.Ativo === true || row.Ativo === 'TRUE' || row.Ativo === 1;
      });
      
      // Filtro para despesas/recebimentos do mês selecionado
      const filterMonthFn = function(row) {
        if (!row.Data) return false;
        let dateStr = "";
        if (row.Data instanceof Date) {
          const y = row.Data.getFullYear();
          const m = String(row.Data.getMonth() + 1).padStart(2, '0');
          dateStr = y + '-' + m;
        } else {
          dateStr = String(row.Data).substring(0, 7);
        }
        return dateStr.indexOf(month) === 0;
      };
      
      const wesleyExpenses = getRowsAsObjects(wesleySheet, filterMonthFn);
      const luanaExpenses = getRowsAsObjects(luanaSheet, filterMonthFn);
      const wesleyReceivables = getRowsAsObjects(wesleyIncomeSheet, filterMonthFn);
      const luanaReceivables = getRowsAsObjects(luanaIncomeSheet, filterMonthFn);
      
      return createJsonResponse({
        success: true,
        recurring: recurring,
        recurringReceivables: recurringReceivables,
        wesleyExpenses: wesleyExpenses,
        luanaExpenses: luanaExpenses,
        wesleyReceivables: wesleyReceivables,
        luanaReceivables: luanaReceivables
      });
    }

    // Ação: Excluir Despesa por ID
    if (action === 'deleteExpense') {
      const tabName = requestData.tabName;
      const id = requestData.id;
      
      if (!tabName || !id) {
        return createJsonResponse({ success: false, error: 'Aba ou ID não especificados' }, 400);
      }
      
      const sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        return createJsonResponse({ success: false, error: 'Aba "' + tabName + '" não encontrada' }, 404);
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return createJsonResponse({ success: false, error: 'Tabela vazia' }, 400);
      }
      
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let deleted = false;
      
      // Percorre de baixo para cima para evitar problemas de deslocamento de linha
      for (let i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]) === String(id)) {
          sheet.deleteRow(i + 2);
          deleted = true;
        }
      }
      
      return createJsonResponse({ success: true, deleted: deleted });
    }

    // Ação: Editar/Atualizar Despesa por ID
    if (action === 'updateExpense') {
      const tabName = requestData.tabName;
      const id = requestData.id;
      const expense = requestData.expense; // Array de novos valores
      
      if (!tabName || !id || !expense || !expense.length) {
        return createJsonResponse({ success: false, error: 'Aba, ID ou dados da despesa não especificados' }, 400);
      }
      
      const sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        return createJsonResponse({ success: false, error: 'Aba "' + tabName + '" não encontrada' }, 404);
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return createJsonResponse({ success: false, error: 'Tabela vazia' }, 400);
      }
      
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let updated = false;
      
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(id)) {
          sheet.getRange(i + 2, 1, 1, expense.length).setValues([expense]);
          updated = true;
          break;
        }
      }
      
      return createJsonResponse({ success: true, updated: updated });
    }

    // Ação: Excluir Parcelas Futuras em Lote
    if (action === 'deleteInstallments') {
      const tabName = requestData.tabName;
      const installmentGroupId = requestData.installmentGroupId;
      const baseDateStr = requestData.baseDate; // YYYY-MM-DD
      
      if (!tabName || !installmentGroupId || !baseDateStr) {
        return createJsonResponse({ success: false, error: 'Aba, ID de parcelamento ou data base não especificados' }, 400);
      }
      
      const sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        return createJsonResponse({ success: false, error: 'Aba "' + tabName + '" não encontrada' }, 404);
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return createJsonResponse({ success: true, deletedCount: 0 });
      }
      
      const lastCol = sheet.getLastColumn();
      const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      let deletedCount = 0;
      
      // Parse data localmente ignorando fuso horário
      const baseParts = baseDateStr.split('-');
      const baseYear = parseInt(baseParts[0], 10);
      const baseMonth = parseInt(baseParts[1], 10) - 1;
      const baseDay = parseInt(baseParts[2], 10);
      const baseDate = new Date(baseYear, baseMonth, baseDay);
      
      for (let i = dataRange.length - 1; i >= 0; i--) {
        const rowIdParcelamento = String(dataRange[i][6]);
        if (rowIdParcelamento === String(installmentGroupId)) {
          const rowDateStr = String(dataRange[i][1]);
          // Se for objeto data ou string
          let rowDate;
          if (rowDateStr.indexOf('T') !== -1) {
            const parts = rowDateStr.split('T')[0].split('-');
            rowDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          } else {
            const parts = rowDateStr.split('-');
            rowDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          }
          
          if (!isNaN(rowDate.getTime()) && rowDate.getTime() >= baseDate.getTime()) {
            sheet.deleteRow(i + 2);
            deletedCount++;
          }
        }
      }
      
      return createJsonResponse({ success: true, deletedCount: deletedCount });
    }

    // Ação: Editar/Atualizar Parcelas Futuras em Lote
    if (action === 'updateInstallments') {
      const tabName = requestData.tabName;
      const installmentGroupId = requestData.installmentGroupId;
      const baseDateStr = requestData.baseDate; // YYYY-MM-DD
      const updatedFields = requestData.updatedFields; // Objeto com campos editados: { Descrição, Valor, Tag, Compartilhado }
      
      if (!tabName || !installmentGroupId || !baseDateStr || !updatedFields) {
        return createJsonResponse({ success: false, error: 'Aba, ID de parcelamento, data base ou campos a atualizar não especificados' }, 400);
      }
      
      const sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        return createJsonResponse({ success: false, error: 'Aba "' + tabName + '" não encontrada' }, 404);
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return createJsonResponse({ success: true, updatedCount: 0 });
      }
      
      const lastCol = sheet.getLastColumn();
      const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
      const values = range.getValues();
      let updatedCount = 0;
      
      const baseParts = baseDateStr.split('-');
      const baseYear = parseInt(baseParts[0], 10);
      const baseMonth = parseInt(baseParts[1], 10) - 1;
      const baseDay = parseInt(baseParts[2], 10);
      const baseDate = new Date(baseYear, baseMonth, baseDay);
      
      for (let i = 0; i < values.length; i++) {
        const rowIdParcelamento = String(values[i][6]);
        if (rowIdParcelamento === String(installmentGroupId)) {
          const rowDateStr = String(values[i][1]);
          let rowDate;
          if (rowDateStr.indexOf('T') !== -1) {
            const parts = rowDateStr.split('T')[0].split('-');
            rowDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          } else {
            const parts = rowDateStr.split('-');
            rowDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          }
          
          if (!isNaN(rowDate.getTime()) && rowDate.getTime() >= baseDate.getTime()) {
            if (updatedFields.Descrição !== undefined) {
              const oldDesc = String(values[i][2]);
              const match = oldDesc.match(/\((\d{2}\/\d{2})\)$/);
              if (match) {
                values[i][2] = updatedFields.Descrição + ' (' + match[1] + ')';
              } else {
                values[i][2] = updatedFields.Descrição;
              }
            }
            if (updatedFields.Valor !== undefined) {
              values[i][3] = Number(updatedFields.Valor);
            }
            if (updatedFields.Tag !== undefined) {
              values[i][4] = updatedFields.Tag;
            }
            if (updatedFields.Compartilhado !== undefined) {
              values[i][5] = updatedFields.Compartilhado;
            }
            if (values[i].length > 7) {
              if (updatedFields['Meio de Pagamento'] !== undefined) {
                values[i][7] = updatedFields['Meio de Pagamento'];
              } else if (updatedFields.meioPagamento !== undefined) {
                values[i][7] = updatedFields.meioPagamento;
              }
            }
            updatedCount++;
          }
        }
      }
      
      if (updatedCount > 0) {
        range.setValues(values);
      }
      
      return createJsonResponse({ success: true, updatedCount: updatedCount });
    }

    // Fallback para ações não suportadas ainda nesta fase
    return createJsonResponse({ success: false, error: 'Ação "' + action + '" desconhecida ou não implementada.' }, 400);
    
  } catch (error) {
    return createJsonResponse({ success: false, error: 'Erro interno: ' + error.toString() }, 500);
  }
}

/**
 * Função para tratar requisições GET (Para testes rápidos de visualização no navegador)
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(
    "<h1>API Finanças Compartilhadas do Google Sheets</h1>" +
    "<p>O script está instalado com sucesso na sua planilha!</p>" +
    "<p>Configure a URL do Web App e sua senha correspondente no aplicativo React para conectar.</p>" +
    "<hr>" +
    "<p style='color: green;'>Status: Online e aguardando requisições POST.</p>"
  );
}

/**
 * Helper para formatar resposta JSON compatível com Apps Script
 */
function createJsonResponse(data, statusCode) {
  // Nota: HTTP Status Codes reais não são retornados pelo Apps Script (ele sempre redireciona/retorna 200),
  // por isso inserimos o status_code dentro do JSON retornado para tratamento no frontend.
  if (statusCode) {
    data.statusCode = statusCode;
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Converte as linhas de uma aba do Sheets em um array de objetos usando o cabeçalho
 */
function getRowsAsObjects(sheet, filterFn) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  
  const results = [];
  for (let i = 0; i < values.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = values[i][j];
    }
    if (!filterFn || filterFn(rowObj)) {
      results.push(rowObj);
    }
  }
  return results;
}

/**
 * Retorna uma aba existente ou cria uma nova com o layout correspondente se não existir.
 */
function getOrCreateSheet(spreadsheet, tabName) {
  let sheet = spreadsheet.getSheetByName(tabName);
  if (sheet) return sheet;

  sheet = spreadsheet.insertSheet(tabName);
  
  if (tabName.startsWith('Despesas')) {
    sheet.appendRow(['ID', 'Data', 'Descrição', 'Valor', 'Tag', 'Compartilhado', 'ID Parcelamento', 'Meio de Pagamento']);
    sheet.getRange("A1:H1").setFontWeight("bold")
                            .setBackground("#00a859")
                            .setFontColor("#ffffff")
                            .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  } else if (tabName.startsWith('Recebimentos')) {
    sheet.appendRow(['ID', 'Data', 'Descrição', 'Valor', 'Tag']);
    sheet.getRange("A1:E1").setFontWeight("bold")
                            .setBackground("#00a859")
                            .setFontColor("#ffffff")
                            .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  } else if (tabName === 'Recorrentes') {
    sheet.appendRow(['ID', 'Descrição', 'Valor Estimado', 'Dia Vencimento', 'Tipo', 'Dono', 'Ativo']);
    sheet.getRange("A1:G1").setFontWeight("bold")
                            .setBackground("#00a859")
                            .setFontColor("#ffffff")
                            .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  } else if (tabName === 'Recorrentes Recebimentos') {
    sheet.appendRow(['ID', 'Descrição', 'Valor Estimado', 'Dia Recebimento', 'Dono', 'Ativo']);
    sheet.getRange("A1:F1").setFontWeight("bold")
                            .setBackground("#00a859")
                            .setFontColor("#ffffff")
                            .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  } else if (tabName === 'Orcamentos') {
    sheet.appendRow(['ID', 'Tag', 'Valor Limite', 'Dono', 'Ativo']);
    sheet.getRange("A1:E1").setFontWeight("bold")
                            .setBackground("#00a859")
                            .setFontColor("#ffffff")
                            .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  return sheet;
}
