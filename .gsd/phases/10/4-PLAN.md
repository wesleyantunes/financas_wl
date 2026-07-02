---
phase: 10
plan: 4
wave: 1
gap_closure: false
---

# Plan 10.4: Divisão de Despesas Compartilhadas (Acerto de Contas)

## Objective
Calcular, ao final do mês, quanto cada um (Wesley/Luana) efetivamente pagou de despesas marcadas como "Compartilhado" versus sua cota justa, indicando quem deve quanto para quem — e permitir registrar quando esse valor foi quitado.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/phases/10/RESEARCH.md
- src/components/Dashboard.tsx (lógica de atribuição de Meio de Pagamento por cartão cruzado, Phase 8)
- src/services/api.ts
- scripts/google-apps-script.js

## Tasks

<task type="checkpoint:decision">
  <name>Definir regra de divisão do acerto</name>
  <action>
    Confirmar com o usuário: a cota justa de cada despesa compartilhada é sempre 50/50, ou deve ser configurável (globalmente, ou por despesa individual — ex: aluguel 60/40)?
  </action>
  <done>
    Decisão registrada em .gsd/DECISIONS.md antes de iniciar a implementação. Caso configurável, definir onde esse percentual é armazenado (nova coluna em Despesas ou config global em nova aba/localStorage).
  </done>
</task>

<task type="auto">
  <name>Criar aba Acertos e actions no Apps Script</name>
  <files>
    scripts/google-apps-script.js
    src/services/api.ts
  </files>
  <action>
    No `scripts/google-apps-script.js`, em `initialize()`, criar a aba `Acertos` caso não exista, com cabeçalho `['ID', 'Mes Referencia', 'Valor Acertado', 'De', 'Para', 'Data', 'Observacao']`.
    Implementar as actions `getAcertos()` e `addAcerto(acerto)`.

    No `src/services/api.ts`, adicionar `interface RawAcerto` e as funções `getAcertos()`, `addAcerto(acerto)` espelhando o padrão de `addRecurringRule`.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    Aba `Acertos` criada automaticamente e as actions de leitura/gravação funcionam via `api.ts`.
  </done>
</task>

<task type="auto">
  <name>Criar painel de Acerto de Contas</name>
  <files>
    src/components/SettlementPanel.tsx
    src/components/App.tsx
  </files>
  <action>
    Criar `SettlementPanel.tsx`:
    - Buscar todas as despesas com `Compartilhado = true` do mês selecionado (ambas as abas).
    - Calcular quanto cada dono efetivamente pagou reaproveitando a MESMA lógica de atribuição por `Meio de Pagamento` já usada em `Dashboard.tsx` (cartão cruzado atribui o pagamento ao dono do cartão, não ao dono da aba).
    - Calcular a cota justa de cada um conforme a decisão registrada na task de decisão acima.
    - Exibir: total compartilhado do mês, quanto cada um pagou, saldo final ("Luana deve R$X para Wesley" ou vice-versa), e a lista das transações que compõem o cálculo.
    - Verificar em `getAcertos()` se o mês já foi marcado como quitado; se sim, exibir como "Quitado em {data}" em vez do cálculo pendente.
    - Botão "Marcar como quitado" grava um registro via `addAcerto`.

    Integrar como nova aba "Acerto" em `App.tsx`.
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário visualiza quem deve quanto para quem no mês, considerando reconciliação de cartão cruzado, e consegue marcar o mês como quitado.
  </done>
</task>

## Must-Haves
- [ ] Cálculo correto do saldo devedor entre Wesley e Luana para despesas compartilhadas do mês.
- [ ] Reconciliação de cartão cruzado aplicada corretamente (reaproveitando a lógica da Phase 8, sem duplicar código).
- [ ] Registro de quitação por mês, evitando recalcular meses já acertados.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in tests
