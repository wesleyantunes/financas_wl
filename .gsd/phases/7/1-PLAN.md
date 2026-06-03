---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: Lançamento e Gestão de Recebimentos

## Objective
Implementar o fluxo completo de receitas (recebimentos) de Wesley e Luana no projeto. Isso inclui a criação das tabelas correspondentes na planilha via Google Apps Script, a extensão da API React, a unificação do formulário de lançamento com alternador Despesa/Recebimento, novos cartões de poupança líquida no Dashboard, e listagem independente no Histórico.

## Context
- .gsd/SPEC.md
- scripts/google-apps-script.js
- src/services/api.ts
- src/components/ExpenseForm.tsx
- src/components/Dashboard.tsx
- src/components/HistoryPanel.tsx

## Tasks

<task type="auto">
  <name>Atualizar Google Apps Script e Serviço React com Suporte a Recebimentos</name>
  <files>
    - scripts/google-apps-script.js
    - src/services/api.ts
  </files>
  <action>
    - No `scripts/google-apps-script.js`:
      - Atualizar a ação `initialize` para incluir a criação de duas novas abas: `Recebimentos [Wesley]` e `Recebimentos [Luana]`.
      - Definir o cabeçalho dessas abas como `['ID', 'Data', 'Descrição', 'Valor', 'Tag']` com fundo verde e congelamento da primeira linha.
      - Atualizar a ação `getMonthData` para ler e filtrar os lançamentos mensais dessas duas novas abas (aplicando o mesmo filtro de período AAAA-MM) e retornar no objeto de resposta como `wesleyReceivables` e `luanaReceivables`.
    - No `src/services/api.ts`:
      - Atualizar o tipo de retorno da função `getMonthData` para incluir `wesleyReceivables: RawExpense[]` e `luanaReceivables: RawExpense[]`.
  </action>
  <verify>
    Rodar a compilação do TypeScript para certificar que o arquivo de API compila sem erros:
    `npm run build`
  </verify>
  <done>
    A planilha cria as abas de receitas se não existirem e o serviço React expõe os dados de recebimentos mensais recuperados do Apps Script.
  </done>
</task>

<task type="auto">
  <name>Implementar Formulário de Recebimentos no ExpenseForm</name>
  <files>
    - src/components/ExpenseForm.tsx
  </files>
  <action>
    - Adicionar um seletor no topo do formulário (`src/components/ExpenseForm.tsx`) para escolher o tipo de lançamento: **Despesa** ou **Recebimento**.
    - Ao selecionar **Recebimento**:
      - Ocultar os campos irrelevantes: "Compartilhado", "Parcelamento/Parcelas".
      - Definir as categorias de receitas padrão: `['Salário', 'Freelance', 'Rendimentos', 'Outros']`.
      - Ajustar a rotina de envio no submit para gravar na aba `Recebimentos [Wesley]` ou `Recebimentos [Luana]` de acordo com o usuário selecionado no Header.
      - Enviar a linha com formato de 5 colunas: `[id, data, descrição, valor, tag]`. (A API `addExpenses` adiciona os dados normalmente).
  </action>
  <verify>
    Validar que o componente do formulário compila sem erros e o linter está limpo:
    `npm run lint`
  </verify>
  <done>
    O usuário pode alternar entre lançar despesa e recebimento na mesma interface de forma fluida.
  </done>
</task>

<task type="auto">
  <name>Atualizar Dashboard e Histórico com Dados de Recebimentos</name>
  <files>
    - src/components/Dashboard.tsx
    - src/components/HistoryPanel.tsx
  </files>
  <action>
    - No `src/components/Dashboard.tsx`:
      - Calcular os totais de receitas de Wesley, Luana e consolidados.
      - Adicionar novos cartões no topo detalhando a Poupança Líquida do mês (Wesley: Receitas - Fair Share, Luana: Receitas - Fair Share, Casal: Receitas Totais - Gastos Totais).
    - No `src/components/HistoryPanel.tsx`:
      - Implementar abas secundárias de visualização na barra de filtros: **Despesas** (padrão) e **Recebimentos**.
      - Ao selecionar **Recebimentos**, carregar os dados de recebimentos acumulados e exibir na tabela com as colunas adequadas (Data, Dono, Descrição, Categoria, Valor, Ações).
      - Integrar a edição e exclusão de recebimentos direcionando o nome da aba para a tabela de recebimentos correspondente.
  </action>
  <verify>
    Compilar o projeto em lote e garantir 100% de conformidade com o linter:
    `npm run lint` e `npm run build`
  </verify>
  <done>
    O Dashboard calcula os saldos reais de poupança mensal e a tela de histórico permite gerenciar de forma completa os recebimentos do casal.
  </done>
</task>

## Success Criteria
- [ ] Apps Script e React Client suportam tabelas de `Recebimentos`.
- [ ] O formulário de lançamentos permite alternar e salvar despesas ou receitas.
- [ ] O Dashboard exibe métricas de poupança mensal individuais e conjuntas.
- [ ] A tela de histórico permite buscar, filtrar, editar e excluir receitas.
