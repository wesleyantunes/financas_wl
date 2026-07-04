---
phase: 10
plan: 1
wave: 1
gap_closure: false
---

# Plan 10.1: Orçamento por Categoria/Tag

## Objective
Permitir que Wesley e Luana definam um limite mensal de gasto por tag (ex: Alimentação, Lazer) e acompanhem visualmente o consumo desse limite ao longo do mês, reaproveitando as tags fixas já usadas em `ExpenseForm.tsx`.

> **Decisão registrada (DEC-005):** orçamento com `Dono = "Compartilhado"` soma as despesas da tag nas DUAS abas (`Despesas [Wesley]` + `Despesas [Luana]`).

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/phases/10/RESEARCH.md
- scripts/google-apps-script.js
- src/services/api.ts
- src/components/Dashboard.tsx
- src/components/RecurringPanel.tsx (padrão de painel CRUD simples a seguir)

## Tasks

<task type="auto">
  <name>Criar aba Orcamentos e actions de CRUD no Apps Script</name>
  <files>
    scripts/google-apps-script.js
    src/services/api.ts
  </files>
  <action>
    No `scripts/google-apps-script.js`:
    - Em `initialize()`, criar a aba `Orcamentos` caso não exista, com cabeçalho `['ID', 'Tag', 'Valor Limite', 'Dono', 'Ativo']` no mesmo estilo verde Sicredi das demais abas.
    - Implementar as actions `getBudgets` (retorna todas as linhas ativas), `addBudget`, `updateBudget` (por ID) e `deleteBudget` (por ID), seguindo o mesmo padrão de `addRecurringRule`/`deleteExpense`.

    No `src/services/api.ts`:
    - Adicionar `interface RawBudget { ID?: string; Tag?: string; ['Valor Limite']?: string | number; Dono?: string; Ativo?: boolean | string }`.
    - Adicionar funções `getBudgets()`, `addBudget(budget)`, `updateBudget(id, budget)`, `deleteBudget(id)` espelhando as funções de recorrentes já existentes.

    AVOID: reaproveitar a aba `Recorrentes` misturando orçamentos com contas a pagar — são conceitos diferentes (limite vs. obrigação).
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    Aba `Orcamentos` é criada automaticamente na inicialização e as 4 actions de CRUD funcionam via `api.ts`.
  </done>
</task>

<task type="auto">
  <name>Criar painel de Orçamento com barras de progresso</name>
  <files>
    src/components/BudgetPanel.tsx
    src/components/App.tsx
  </files>
  <action>
    Criar `BudgetPanel.tsx`:
    - Listar os orçamentos ativos (via `getBudgets`) com formulário simples de cadastro/edição (Tag via `<select>` com a lista fixa de tags de despesa, Valor Limite, Dono: `Wesley | Luana | Compartilhado`).
    - Para cada orçamento, calcular o gasto atual do mês filtrando despesas por Tag: se `Dono = "Compartilhado"`, somar as despesas da tag nas DUAS abas (`Despesas [Wesley]` + `Despesas [Luana]`); se `Dono = "Wesley"` ou `"Luana"`, somar apenas a aba correspondente (reaproveitar a mesma normalização de despesas usada em `CardInvoicePanel.tsx`).
    - Renderizar barra de progresso: verde (<80% do limite), amarelo (80–100%), vermelho (>100%).

    Em `App.tsx`, adicionar uma nova aba de navegação "Orçamento" ao lado das existentes (Dashboard, Lançar, Cartões, Recorrentes, Histórico).
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário consegue cadastrar um limite mensal por tag e ver visualmente quanto já gastou dessa tag no mês corrente.
  </done>
</task>

## Must-Haves
- [ ] Aba `Orcamentos` criada automaticamente na inicialização da planilha.
- [ ] CRUD completo de orçamentos por tag.
- [ ] Indicador visual (barra de progresso com cores) do consumo do orçamento no mês corrente.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in tests
