---
updated: 2026-07-04T01:00:00Z
---

# Project State

## Current Position

**Milestone:** v1.1
**Phase:** 10 (in progress)
**Task:** Plans 10.1 e 10.4 completos
**Status:** Verified
**Plan:** 10.4

## Last Action

Implementado o Plan 10.4 (Divisão de Despesas Compartilhadas / Acerto de Contas), além do Plan 10.1 já concluído anteriormente:
- **Schema:** nova 9ª coluna `Divisão Wesley (%)` nas abas `Despesas [Wesley]`/`[Luana]` (com migração automática de abas antigas na action `initialize`) e nova aba `Acertos` no Apps Script ([scripts/google-apps-script.js](scripts/google-apps-script.js)), com actions `getAcertos`/`addAcerto` e suporte à divisão em `updateInstallments`.
- **API:** tipo `RawAcerto`, funções `getAcertos`/`addAcerto`, e campo de divisão em `RawExpense`/`updateInstallments` em [src/services/api.ts](src/services/api.ts).
- **UI:** slider de divisão Wesley/Luana em [src/components/ExpenseForm.tsx](src/components/ExpenseForm.tsx) e no modal de edição de [src/components/HistoryPanel.tsx](src/components/HistoryPanel.tsx) (visível apenas quando "Compartilhado" está marcado, padrão 50/50); novo painel [src/components/SettlementPanel.tsx](src/components/SettlementPanel.tsx) ("Acerto") calculando saldo devedor por despesa (não 50/50 fixo) e com botão de quitação.
- `npm run lint` e `npm run build` passaram limpos.
- Testado no navegador com backend mockado: despesa de Aluguel R$1000 (60% Wesley) + Supermercado R$300 (50% Wesley) gerou corretamente "Luana deve pagar R$250,00 para Wesley" (valor diferente do que um split fixo 50/50 daria — R$350 — confirmando que a divisão por despesa está sendo respeitada). Fluxo de "Marcar como Quitado" validado.
- Não foi possível testar contra o Google Sheets real do usuário (sem credenciais).

## Next Steps

1. Validar manualmente com a planilha real (Wesley/Luana): reimplantar o Apps Script atualizado como nova versão do Web App para que a aba `Orcamentos`, a aba `Acertos` e a 9ª coluna de divisão sejam criadas/migradas.
2. Seguir com Plans 10.2 (Previsão de Saldo Futuro Avançada) e 10.3 (Comparativo Mês a Mês/Ano a Ano) — podem rodar em paralelo, sem dependências entre si.
3. Fase 11: Plan 11.1 (CSV/OFX) antes do Plan 11.2 (PDF), já que o PDF reaproveita a infraestrutura de revisão/dedup construída no 11.1.

## Session Context (Fase 10)

- `.claude/launch.json` foi criado neste projeto para permitir preview do dev server (`npm run dev` na porta 5173).
- Lembrete importante para o usuário: o Google Apps Script publicado precisa ser **reimplantado** (Implantar → Gerenciar Implantações → Editar → Nova Versão) após colar o código atualizado de `scripts/google-apps-script.js`, senão a Web App continuará servindo a versão antiga sem as novas actions/colunas.
- Despesas compartilhadas lançadas pelo `CardInvoicePanel.tsx` (painel "Cartões") ainda não têm o controle de divisão (só `ExpenseForm.tsx` e `HistoryPanel.tsx` foram tocados, conforme escopo do Plan 10.4) — essas despesas assumem 50/50 por padrão na leitura. Se isso for um problema no uso real, vale abrir uma tarefa futura para estender o `CardInvoicePanel.tsx`.

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
