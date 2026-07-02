---
phase: 10
plan: 2
wave: 1
gap_closure: false
---

# Plan 10.2: Previsão de Saldo Futuro Avançada

## Objective
Evoluir a projeção de saldo já existente (Phase 8, hoje limitada ao mês corrente no Dashboard) para um painel dedicado com horizonte configurável (30/60/90 dias) e gráfico de evolução, melhorando a estimativa de contas variáveis com base no histórico.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/phases/10/RESEARCH.md
- src/components/Dashboard.tsx (lógica atual de saldo previsto, Phase 8)
- src/services/api.ts
- scripts/google-apps-script.js

## Tasks

<task type="auto">
  <name>Implementar action agregada getForecastData</name>
  <files>
    scripts/google-apps-script.js
    src/services/api.ts
  </files>
  <action>
    No `scripts/google-apps-script.js`, criar a action `getForecastData(mesesAFrente)`:
    - Retornar as regras ativas de `Recorrentes` e `Recorrentes Recebimentos`.
    - Para cada regra do tipo "Variável", calcular e incluir `mediaUltimasConfirmacoes` (média dos últimos 3 lançamentos com a mesma Descrição nas abas de despesa, mais recentes que a data atual).
    - Retornar também os lançamentos já existentes com Data futura (parcelas já expandidas) dentro do horizonte pedido, para não duplicar na projeção do cliente.

    No `src/services/api.ts`, adicionar `getForecastData(monthsAhead: number)` com os tipos de retorno correspondentes.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    Uma única chamada retorna tudo que o cliente precisa para projetar saldo, sem buscar linha a linha de cada mês futuro.
  </done>
</task>

<task type="auto">
  <name>Criar painel de Previsão com gráfico de saldo projetado</name>
  <files>
    src/components/ForecastPanel.tsx
    src/components/App.tsx
  </files>
  <action>
    Criar `ForecastPanel.tsx`:
    - Seletor de horizonte: 30 / 60 / 90 dias.
    - Calcular saldo inicial (recebimentos − despesas lançadas até hoje) e projetar dia a dia somando: (a) lançamentos futuros já existentes, (b) regras recorrentes ainda não confirmadas no mês, usando `mediaUltimasConfirmacoes` para contas variáveis e `Valor Estimado` para fixas.
    - Renderizar gráfico de área (Recharts `AreaChart`) do saldo projetado ao longo do horizonte, seguindo a paleta Sicredi Dark já usada em `Dashboard.tsx`.
    - Tabela auxiliar abaixo do gráfico com o detalhamento mês a mês (receita prevista, despesa prevista, saldo).

    Integrar como nova aba "Previsão" em `App.tsx`.

    AVOID: contar duas vezes uma regra recorrente já confirmada no mês (checar se já existe lançamento com Tag "Recorrentes" e descrição/mês correspondentes antes de projetar).
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário visualiza a evolução projetada do saldo para os próximos 30/60/90 dias, com estimativas de contas variáveis mais precisas que o valor cadastrado.
  </done>
</task>

## Must-Haves
- [ ] Horizonte de previsão configurável (30/60/90 dias).
- [ ] Estimativa de contas variáveis baseada em histórico, não apenas no `Valor Estimado` cadastrado.
- [ ] Nenhuma duplicação entre lançamentos já confirmados e projeção de recorrentes pendentes.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in tests
