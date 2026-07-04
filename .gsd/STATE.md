---
updated: 2026-07-04T00:00:00Z
---

# Project State

## Current Position

**Milestone:** v1.1
**Phase:** 10 (in progress)
**Task:** Plan 10.1 completo
**Status:** Verified
**Plan:** 10.1

## Last Action

Implementado o Plan 10.1 (Orçamento por Categoria/Tag): nova aba `Orcamentos` e actions `getBudgets`/`addBudget`/`updateBudget`/`deleteBudget` no Apps Script ([scripts/google-apps-script.js](scripts/google-apps-script.js)); tipos e funções correspondentes em [src/services/api.ts](src/services/api.ts); novo componente [src/components/BudgetPanel.tsx](src/components/BudgetPanel.tsx) com formulário de cadastro, barras de progresso (verde/amarelo/vermelho) e edição/exclusão; nova aba de navegação "Orçamento" em [src/App.tsx](src/App.tsx). `npm run lint` e `npm run build` passaram limpos. Testado no navegador com backend mockado (fetch interceptado): soma de orçamento "Compartilhado" nas duas abas confirmada (Lazer: R$120 Wesley + R$200 Luana = R$320/300, barra vermelha), orçamento individual "Wesley" confirmado (Alimentação: R$450/500, barra amarela), fluxo de adicionar/editar/excluir validado. Não foi possível testar contra o Google Sheets real do usuário (sem credenciais).

## Next Steps

1. Validar manualmente com a planilha real (Wesley/Luana): reimplantar o Apps Script atualizado como nova versão do Web App para que a aba `Orcamentos` seja criada.
2. Seguir com Plan 10.4 (Acerto de Contas) — inclui a migração de schema da 9ª coluna (`Divisão Wesley (%)`).
3. Plans 10.2 e 10.3 (Previsão e Comparativo) podem rodar em paralelo, sem dependências entre si.
4. Fase 11: Plan 11.1 (CSV/OFX) antes do Plan 11.2 (PDF), já que o PDF reaproveita a infraestrutura de revisão/dedup construída no 11.1.

## Session Context (Plan 10.1)

- `.claude/launch.json` foi criado neste projeto para permitir preview do dev server (`npm run dev` na porta 5173).
- Lembrete importante para o usuário: o Google Apps Script publicado precisa ser **reimplantado** (Implantar → Gerenciar Implantações → Editar → Nova Versão) após colar o código atualizado de `scripts/google-apps-script.js`, senão a Web App continuará servindo a versão antiga sem as actions de orçamento.

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
| Escopo de Importação | CSV/OFX parseados 100% no cliente (Plan 11.1); PDF de fatura também no escopo (Plan 11.2), com heurística genérica + revisão manual obrigatória | 2026-07-03 | Phase 11 |
| Orçamento Compartilhado | Soma o gasto da tag nas duas abas (Wesley + Luana) quando `Dono = "Compartilhado"` | 2026-07-03 | Phase 10 (DEC-005) |
| Divisão do Acerto de Contas | Configurável por despesa (nova coluna `Divisão Wesley (%)`, padrão 50), não um split fixo global | 2026-07-03 | Phase 10 (DEC-006) |

## Blockers

Nenhum.

## Concerns

Nenhum — as 3 decisões de escopo pendentes foram resolvidas (DEC-005, DEC-006, DEC-007).

## Session Context

- Fases 1-9 (v1.0): linter e build 100% validados, em produção.
- Fases 10-11 (v1.1): planejadas e com escopo fechado, nenhum código escrito ainda.
