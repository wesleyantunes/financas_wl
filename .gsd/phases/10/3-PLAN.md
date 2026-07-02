---
phase: 10
plan: 3
wave: 1
gap_closure: false
---

# Plan 10.3: Comparativo Mês a Mês / Ano a Ano

## Objective
Permitir comparar o total e a distribuição por tag dos gastos entre meses (últimos 12 meses) e entre o mesmo mês em anos diferentes, sem sobrecarregar o cliente com dados brutos de múltiplos meses.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/phases/10/RESEARCH.md
- src/components/Dashboard.tsx (gráficos e paleta de cores já usados)
- src/services/api.ts
- scripts/google-apps-script.js

## Tasks

<task type="auto">
  <name>Implementar action agregada getMonthlySummaries</name>
  <files>
    scripts/google-apps-script.js
    src/services/api.ts
  </files>
  <action>
    No `scripts/google-apps-script.js`, criar a action `getMonthlySummaries(meses: string[])` que, para cada mês (`YYYY-MM`) da lista recebida, agrega no próprio Apps Script (sem devolver linhas cruas) e retorna:
    `{ mes, totalDespesas, totalRecebimentos, porTag: { [tag]: valor }, porDono: { Wesley: valor, Luana: valor } }`.

    No `src/services/api.ts`, adicionar `getMonthlySummaries(meses: string[])` com o tipo de retorno correspondente.

    AVOID: reaproveitar `getMonthData` em loop no cliente — o objetivo desta action é evitar N requests e N payloads de linhas cruas (CON-01).
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    Uma única chamada retorna os totais agregados de até 12 meses de uma vez, com payload pequeno.
  </done>
</task>

<task type="auto">
  <name>Criar painel de Comparativo</name>
  <files>
    src/components/ComparisonPanel.tsx
    src/components/App.tsx
  </files>
  <action>
    Criar `ComparisonPanel.tsx` com duas visões:
    1. **Últimos 12 meses:** gráfico de barras (Recharts `BarChart`) do total de despesas por mês, com opção de segmentar por dono.
    2. **Comparação pontual:** dois seletores de competência (mês/ano) lado a lado — ex: Jun/2026 vs Jun/2025, ou Jun/2026 vs Mai/2026 — exibindo tabela com total por tag em cada competência e a variação percentual.

    Integrar como nova aba "Comparativo" em `App.tsx`. Reaproveitar a paleta de 8 cores já definida em `Dashboard.tsx` para as tags.
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário visualiza a evolução de gastos dos últimos 12 meses e compara duas competências específicas por tag.
  </done>
</task>

## Must-Haves
- [ ] Gráfico de evolução dos últimos 12 meses.
- [ ] Comparação lado a lado de duas competências (mês vs mês, ou mesmo mês em anos diferentes) com variação percentual por tag.
- [ ] Nenhuma busca de linhas cruas de múltiplos meses no cliente (dados sempre agregados no backend).

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in tests
