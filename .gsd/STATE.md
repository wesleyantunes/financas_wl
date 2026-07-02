---
updated: 2026-07-02T00:00:00Z
---

# Project State

## Current Position

**Milestone:** v1.1
**Phase:** 10 (planned)
**Task:** Nenhuma iniciada
**Status:** Planned
**Plan:** —

## Last Action

Registradas as Fases 10 (Planejamento e Análise Financeira Avançada: Orçamento por Categoria, Previsão de Saldo Futuro Avançada, Comparativo Mês a Mês/Ano a Ano, Divisão de Despesas Compartilhadas) e 11 (Importação de Extrato Bancário/Fatura) com RESEARCH.md e PLAN.md em `.gsd/phases/10` e `.gsd/phases/11`, e os requisitos REQ-18 a REQ-22 em REQUIREMENTS.md. Fases v1.0 (1-9) seguem completas e verificadas.

## Next Steps

1. Resolver os pontos de decisão marcados como `checkpoint:decision` antes de iniciar a implementação:
   - Plan 10.1: orçamento "Compartilhado" soma as duas abas ou é sempre individual por dono?
   - Plan 10.4: divisão do acerto de contas é sempre 50/50 ou configurável por despesa/pessoa?
   - Plan 11.1: confirmar que a v1 de importação cobre apenas CSV/OFX (PDF de fatura fica para depois).
2. Após as decisões, iniciar a implementação pelo Plan 10.1 (Orçamento por Categoria) — menor escopo e maior valor imediato.

## Active Decisions

Decisions made that affect current work:

| Decision | Choice | Made | Affects |
|----------|--------|------|---------|
| Integração Sheets | Google Apps Script Web App API (com URL e Token Secreto em localStorage) | 2026-06-01 | Phase 1 |
| Estilo Visual | Sicredi Dark Mode (Fundo muito escuro, detalhes em verde vibrante #00db75, glassmorphism) | 2026-06-01 | All |
| Estrutura de Lançamentos | Método de Expansão de Linhas (N linhas na planilha para compras parceladas) | 2026-06-01 | Phase 2 |
| Divisão de Despesas | Lançamento em abas individuais por pessoa com marcação de "Compartilhado" | 2026-06-01 | Phase 2 |
| Despesas Recorrentes | Fluxo de Projeção na tela e posterior Confirmação/Ajuste do valor real | 2026-06-01 | Phase 3 |
| Previsão de Saldo | Conciliação e projeção baseada em pendências de regras recorrentes | 2026-06-05 | Phase 8 |
| Persistência de Orçamento/Acerto | Novas abas no Sheets (`Orcamentos`, `Acertos`), não localStorage, para sincronizar entre os dois usuários | 2026-07-02 | Phase 10 |
| Agregação de Comparativo/Previsão | Novas actions agregadas no Apps Script (`getMonthlySummaries`, `getForecastData`) em vez de N chamadas de `getMonthData` no cliente | 2026-07-02 | Phase 10 |
| Escopo de Importação | CSV/OFX parseados 100% no cliente, sem novo endpoint no Apps Script; PDF de fatura fora de escopo nesta fase | 2026-07-02 | Phase 11 |

## Blockers

Nenhum.

## Concerns

- Plans 10.1 e 10.4 têm tasks `checkpoint:decision` pendentes de resposta do usuário antes da implementação (ver Next Steps).
- Plan 11.1 depende de confirmação de escopo (CSV/OFX apenas) antes de iniciar.

## Session Context

- Fases 1-9 (v1.0): linter e build 100% validados, em produção.
- Fases 10-11 (v1.1): apenas planejadas, nenhum código escrito ainda.
