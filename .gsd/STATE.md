---
updated: 2026-07-04T02:00:00Z
---

# Project State

## Current Position

**Milestone:** v1.1
**Phase:** 10 (completed)
**Task:** Todos os 4 planos completos
**Status:** Verified
**Plan:** —

## Last Action

Fase 10 concluída (4/4 planos). Além dos Plans 10.1 (Orçamento) e 10.4 (Acerto de Contas) já registrados anteriormente, foram implementados:

**Plan 10.2 — Previsão de Saldo Futuro Avançada:**
- Nova action `getForecastData(horizonDays)` no Apps Script ([scripts/google-apps-script.js](scripts/google-apps-script.js)): retorna regras recorrentes ativas (com `mediaUltimasConfirmacoes` calculada para contas Variáveis a partir das 3 últimas confirmações passadas), lançamentos futuros já existentes dentro do horizonte, e o saldo realizado (recebimentos − despesas lançadas antes de hoje).
- Novo painel [src/components/ForecastPanel.tsx](src/components/ForecastPanel.tsx): seletor de horizonte (30/60/90 dias), simulação dia a dia (evita duplicar recorrentes já lançados no mês), gráfico de área e tabela mês a mês.

**Plan 10.3 — Comparativo Mês a Mês/Ano a Ano:**
- Nova action `getMonthlySummaries(meses[])` no Apps Script: agrega totais por mês/tag/dono no próprio servidor, sem devolver linhas cruas (evita N requests).
- Novo painel [src/components/ComparisonPanel.tsx](src/components/ComparisonPanel.tsx): gráfico de barras dos últimos 12 meses (com opção de segmentar por dono) e comparação lado a lado de duas competências com variação % por tag.

**Ajuste de navegação:** com a Fase 10 completa, o app chegou a 9 abas na navegação inferior. A barra de navegação em [src/App.tsx](src/App.tsx) foi ajustada de `justify-content: space-around` (que espremia e sobrepunha os rótulos) para uma faixa `overflow-x: auto` com botões de largura fixa — necessário para não quebrar a UI mobile-first ao adicionar as novas abas.

`npm run lint` e `npm run build` passaram limpos. Testado no navegador com backend mockado:
- Previsão: saldo 1000 + salário 3000 (dia 5) − Internet 100 (dia 15) − Energia 190 (média histórica, não os 200 estimados, dia 20) = **3710**, batendo exatamente com a tabela de detalhamento mensal.
- Comparativo: variação % por tag e total calculados corretamente entre duas competências; gráfico de 12 meses renderizado com rótulos corretos.

Não foi possível testar contra o Google Sheets real do usuário (sem credenciais).

## Next Steps

1. Validar manualmente com a planilha real (Wesley/Luana): reimplantar o Apps Script atualizado como nova versão do Web App para que a aba `Orcamentos`, a aba `Acertos` e a 9ª coluna de divisão sejam criadas/migradas, e as novas actions (`getForecastData`, `getMonthlySummaries`) fiquem disponíveis.
2. Avaliar se a navegação inferior com 9 abas precisa de um redesenho mais estrutural (ex: agrupar em um menu "Mais") — o ajuste atual (scroll horizontal) resolve a sobreposição, mas pode não ser a melhor UX de longo prazo.
3. Iniciar a Fase 11 (Importação): Plan 11.1 (CSV/OFX) antes do Plan 11.2 (PDF), já que o PDF reaproveita a infraestrutura de revisão/dedup construída no 11.1.

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
