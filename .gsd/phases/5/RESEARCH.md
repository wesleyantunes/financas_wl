# Phase 5 Research: Gestão Histórica de Despesas e Separação de Recorrentes

## Objetivos da Pesquisa
1. Definir e planejar os endpoints de **Exclusão** e **Edição** de transações no Google Apps Script.
2. Definir o design e usabilidade do painel de **Histórico de Despesas** no frontend.
3. Projetar a reestruturação da aba de **Recorrentes** para separar as regras por pessoa.

---

## 1. Endpoints do Google Apps Script para Edição e Exclusão

Para editar ou excluir uma despesa no Google Sheets, o script precisa localizar a linha correta pelo `ID` (coluna A).

### A. Exclusão de Despesa (`deleteExpense`)
- **Parâmetros:** `tabName` (ex: `Despesas [Wesley]`), `id` (ID da transação).
- **Lógica do Script:**
  1. Abre a aba `tabName`.
  2. Obtém todos os IDs da coluna A.
  3. Percorre a coluna a partir do final (para evitar desalinhamento caso queira remover múltiplas) ou faz busca simples.
  4. Ao encontrar a correspondência exata, chama `sheet.deleteRow(rowNumber)`.
  5. Retorna `{ success: true }`.

### B. Edição de Despesa (`updateExpense`)
- **Parâmetros:** `tabName` (ex: `Despesas [Wesley]`), `id` (ID da transação), `expense` (Array com os novos valores: `[id, data, descricao, valor, tag, compartilhado, idParcelamento]`).
- **Lógica do Script:**
  1. Abre a aba `tabName`.
  2. Obtém todos os IDs da coluna A.
  3. Localiza a linha correta.
  4. Chama `sheet.getRange(rowNumber, 1, 1, 7).setValues([expense])` para atualizar os valores de todas as colunas daquela despesa.
  5. Retorna `{ success: true }`.

---

## 2. Painel de Histórico no Frontend (`src/components/HistoryPanel.tsx`)

Criaremos uma nova aba chamada **Histórico** (`HistoryPanel`) no app.
- **Estrutura:**
  - Filtro por Usuário: Wesley, Luana ou Ambos.
  - Filtro por Mês (sincronizado com o mês selecionado global).
  - Tabela/Lista responsiva contendo todas as despesas (Wesley e Luana).
  - Cada despesa terá dois botões de ação:
    - **Editar:** Abre um formulário pré-preenchido para alterar descrição, valor, tag ou se é compartilhado.
    - **Excluir:** Modal de confirmação para deletar o registro.
- **Tratamento de Parcelados:** Se o usuário tentar editar ou excluir um gasto com `ID Parcelamento`, o sistema deve perguntar se ele quer alterar/excluir:
  - Apenas esta parcela.
  - Todas as parcelas futuras vinculadas a este ID de parcelamento.

---

## 3. Separação de Contas Recorrentes por Dono

Atualmente, o `RecurringPanel` exibe todas as regras em uma única lista unificada.
- **Ajuste de Interface:**
  - Criar tabelas/seções separadas por Dono no `RecurringPanel.tsx`:
    - **Wesley:** Regras onde o `Dono === 'Wesley'`.
    - **Luana:** Regras onde o `Dono === 'Luana'`.
    - **Compartilhado:** Regras onde o `Dono === 'Compartilhado'`.
  - Esta alteração é visual e organizacional, melhorando a visualização de quem é responsável pelo que e permitindo um planejamento financeiro familiar mais claro.
