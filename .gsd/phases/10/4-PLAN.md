---
phase: 10
plan: 4
wave: 1
gap_closure: false
---

# Plan 10.4: Divisão de Despesas Compartilhadas (Acerto de Contas)

## Objective
Calcular, ao final do mês, quanto cada um (Wesley/Luana) efetivamente pagou de despesas marcadas como "Compartilhado" versus sua cota justa — configurável por despesa (ex: aluguel 60/40, mercado 50/50) — indicando quem deve quanto para quem, e permitir registrar quando esse valor foi quitado.

> **Decisão registrada (DEC-006):** a divisão não é fixa em 50/50 — cada despesa compartilhada tem seu próprio percentual, ajustável no momento do lançamento ou na edição (padrão 50/50 quando não ajustado).

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/phases/10/RESEARCH.md
- .gsd/DECISIONS.md (DEC-006)
- src/components/Dashboard.tsx (lógica de atribuição de Meio de Pagamento por cartão cruzado, Phase 8)
- src/components/ExpenseForm.tsx
- src/components/HistoryPanel.tsx
- src/services/api.ts
- scripts/google-apps-script.js

## Tasks

<task type="auto">
  <name>Adicionar coluna de divisão por despesa e aba Acertos no Apps Script</name>
  <files>
    scripts/google-apps-script.js
    src/services/api.ts
  </files>
  <action>
    No `scripts/google-apps-script.js`:
    - Adicionar a 9ª coluna `'Divisão Wesley (%)'` ao cabeçalho das abas `Despesas [Wesley]` e `Despesas [Luana]` (mesma abordagem usada na Phase 8 para adicionar `Meio de Pagamento` como 8ª coluna). Representa o percentual da despesa atribuído a Wesley (0–100); o restante (100 − valor) é de Luana. Só é relevante quando `Compartilhado = true`; gravar `50` como padrão ao lançar uma despesa compartilhada sem ajuste manual.
    - Confirmar que os métodos de exclusão/edição de parcelamento em lote (que já usam `sheet.getLastColumn()` dinamicamente desde a Phase 8) continuam funcionando com a nova coluna, incluindo a divisão na atualização em lote de parcelas futuras.
    - Em `initialize()`, criar a aba `Acertos` caso não exista, com cabeçalho `['ID', 'Mes Referencia', 'Valor Acertado', 'De', 'Para', 'Data', 'Observacao']`.
    - Implementar as actions `getAcertos()` e `addAcerto(acerto)`.

    No `src/services/api.ts`:
    - Atualizar `RawExpense` para incluir `['Divisão Wesley (%)']` e `divisaoWesley`.
    - Adicionar `interface RawAcerto` e as funções `getAcertos()`, `addAcerto(acerto)`.

    AVOID: assumir que a coluna sempre existe em linhas antigas — tratar ausência como 50 (padrão) na leitura.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    Nova coluna de divisão persiste por despesa compartilhada, com padrão 50/50, e a aba `Acertos` está disponível via API.
  </done>
</task>

<task type="auto">
  <name>Permitir ajustar a divisão no lançamento e na edição da despesa</name>
  <files>
    src/components/ExpenseForm.tsx
    src/components/HistoryPanel.tsx
  </files>
  <action>
    Em `ExpenseForm.tsx`: quando o checkbox "Compartilhado" estiver marcado, exibir um controle de divisão (slider ou dois campos percentuais vinculados) rotulado "Divisão: Wesley {X}% / Luana {100-X}%", com valor padrão 50. Enviar o valor de Wesley na 9ª coluna ao gravar despesas comuns ou parceladas (mesmo percentual replicado em todas as parcelas geradas).

    Em `HistoryPanel.tsx`: no modal de edição de despesa compartilhada, adicionar o mesmo controle de divisão, com suporte a alteração individual ou em lote para parcelas futuras (mesmo padrão já usado para editar Meio de Pagamento na Phase 8).
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário consegue ajustar a divisão percentual de qualquer despesa compartilhada no lançamento ou posteriormente na edição.
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
    - Calcular a cota justa de cada despesa usando seu próprio percentual (`Divisão Wesley (%)`, padrão 50 quando ausente) — somar a cota justa de Wesley e de Luana ao longo de todas as despesas compartilhadas do mês (não um split fixo global).
    - Exibir: total compartilhado do mês, quanto cada um pagou, cota justa de cada um, saldo final ("Luana deve R$X para Wesley" ou vice-versa), e a lista das transações que compõem o cálculo (com a divisão de cada uma visível, ex: "Aluguel — 60% Wesley / 40% Luana").
    - Verificar em `getAcertos()` se o mês já foi marcado como quitado; se sim, exibir como "Quitado em {data}" em vez do cálculo pendente.
    - Botão "Marcar como quitado" grava um registro via `addAcerto`.

    Integrar como nova aba "Acerto" em `App.tsx`.
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário visualiza quem deve quanto para quem no mês, respeitando a divisão configurada por despesa e a reconciliação de cartão cruzado, e consegue marcar o mês como quitado.
  </done>
</task>

## Must-Haves
- [ ] Cada despesa compartilhada tem seu próprio percentual de divisão, ajustável no lançamento e na edição (padrão 50/50).
- [ ] Cálculo correto do saldo devedor entre Wesley e Luana usando a divisão configurada por despesa (não um split fixo global).
- [ ] Reconciliação de cartão cruzado aplicada corretamente (reaproveitando a lógica da Phase 8, sem duplicar código).
- [ ] Registro de quitação por mês, evitando recalcular meses já acertados.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in tests
