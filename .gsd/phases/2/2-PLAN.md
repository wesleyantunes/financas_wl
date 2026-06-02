---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Algoritmo de Parcelamento e Atualização do Apps Script

## Objective
Implementar a gravação de transações no Google Sheets por lote (batch write) na API do Google Apps Script e desenvolver a lógica no React para gerar as múltiplas parcelas futuras de uma compra parcelada.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Plan 2.1](file:///d:/Develop/financial-manager/.gsd/phases/2/1-PLAN.md)
- [Phase 2 Research](file:///d:/Develop/financial-manager/.gsd/phases/2/RESEARCH.md)

## Tasks

<task type="auto">
  <name>Atualizar Script google-apps-script.js com Ação addExpenses</name>
  <files>
    <file>scripts/google-apps-script.js</file>
  </files>
  <action>
    1. Editar `scripts/google-apps-script.js` para adicionar a funcionalidade `addExpenses` dentro da função `doPost(e)`.
    2. A ação `addExpenses` deve:
       - Receber no payload a variável `tabName` (ex: `Despesas [Wesley]`) e `expenses` (um array bidimensional de valores: `[[id, data, desc, valor, tag, compartilhado, id_parcelamento], ...]`).
       - Validar que a aba existe na planilha. Se não existir, retornar erro.
       - Determinar a última linha preenchida na aba e usar `sheet.getRange(lastRow + 1, 1, numRows, numCols).setValues(expenses)` para inserir todas as linhas atómicamente de uma vez.
       - Tratar valores decimais e datas para garantir compatibilidade de formatação de células do Sheets.
       - Retornar `{ success: true, count: expenses.length }`.
  </action>
  <verify>test-path scripts/google-apps-script.js</verify>
  <done>
    O arquivo `google-apps-script.js` deve ser atualizado contendo o suporte para a ação `addExpenses` de escrita em lote.
  </done>
</task>

<task type="auto">
  <name>Criar Serviço de Envio e Algoritmo de Geração de Parcelamento</name>
  <files>
    <file>src/services/api.ts</file>
    <file>src/components/ExpenseForm.tsx</file>
  </files>
  <action>
    1. No `src/services/api.ts`, exportar a função `addExpenses(url: string, token: string, tabName: string, expenses: any[][]): Promise<any>` que chama o helper `request` com a ação `addExpenses`.
    2. No `src/components/ExpenseForm.tsx`, desenvolver a lógica do formulário ao salvar:
       - Gerar um ID de transação único (UUID rápido ou timestamp + random).
       - Se for compra à vista: formatar o array com 1 única linha: `[id, data, descricao, valor, tag, compartilhado, ""]`.
       - Se for compra parcelada (N parcelas):
         * Gerar um `ID de Parcelamento` comum (ex: `parcela_timestamp_aleatorio`).
         * Dividir o valor total pelo número de parcelas (ou usar o valor da parcela caso decida lançar o valor por parcela. Recomendado: digitar o valor total e o app calcula, ex: `valorTotal / N`).
         * Loopar de 1 a N:
           - Aumentar a data em 1 mês para cada iteração (ex: se vence dia 10 de Junho, a parcela 2 vence dia 10 de Julho, etc.). Tratar overflow de meses (ex: Dezembro ➔ Janeiro do ano seguinte).
           - Modificar a descrição para incluir o sufixo da parcela, ex: `"Sofá (01/12)"`.
           - Montar a linha: `[id_unico, data_calculada, descricao_parcela, valor_parcela, tag, compartilhado, id_parcelamento]`.
    3. Chamar `addExpenses` passando as credenciais locais e a aba do usuário ativo.
  </action>
  <verify>npm run build</verify>
  <done>
    O algoritmo de geração de parcelamento deve calcular as datas sequenciais futuras e criar as linhas corretas, e o projeto React deve compilar com sucesso.
  </done>
</task>

## Success Criteria
- [ ] O script `google-apps-script.js` está atualizado com suporte a gravação em lote.
- [ ] A lógica de data do parcelamento calcula corretamente os incrementos mensais e anos bissextos/mudanças de ano.
- [ ] O serviço `addExpenses` em `api.ts` está mapeado.
- [ ] O compilador não acusa erros de build.
