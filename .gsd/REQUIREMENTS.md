---
milestone: v1.0
updated: 2026-06-01T20:40:00-04:00
---

# Requirements

## Overview

Requirements derived from SPEC.md for traceability and coverage tracking.

---

## Functional Requirements

| ID | Requirement | Source | Phase | Status |
|----|-------------|--------|-------|--------|
| REQ-01 | Tela de Configuração Inicial / Login onde o usuário insere a URL do Google Apps Script e o Token Secreto | SPEC Goal 2 | 1 | Complete |
| REQ-02 | Verificação e inicialização automática das abas (`Despesas [Wesley]`, `Despesas [Luana]`, `Recorrentes`) via API do Apps Script | SPEC Goal 1 | 1 | Complete |
| REQ-03 | Formulário de lançamento rápido com descrição, valor, data, tags dinâmicas padrão e checkbox "Compartilhado" | SPEC Goal 3 | 2 | Complete |
| REQ-04 | Envio dos registros para a aba correta no Sheets (`Despesas [Wesley]` ou `Despesas [Luana]`) com base no usuário selecionado | SPEC Goal 3 | 2 | Complete |
| REQ-05 | Expansão automática de compras parceladas em N linhas futuras com ID de parcelamento único enviadas em lote | SPEC Goal 4 | 2 | Complete |
| REQ-06 | Lançamento e edição de despesas recorrentes (Fixas/Variáveis) salvando-as na aba `Recorrentes` da planilha | SPEC Goal 5 | 3 | Complete |
| REQ-07 | Painel de "Contas a Pagar/Pendentes" para visualizar previsões mensais e confirmar/ajustar os valores reais | SPEC Goal 5 | 3 | Complete |
| REQ-08 | Dashboard dinâmico exibindo resumo do mês, divisão por dono da despesa, e gráficos por tags usando Recharts | SPEC Goal 6 | 4 | Complete |
| REQ-09 | Visualização das despesas lançadas com possibilidade de edição e exclusão | SPEC Goal 7 | 5 | Pending |
| REQ-10 | Separação das contas recorrentes por pessoa (Wesley / Luana / Compartilhado) em tabelas independentes | SPEC Goal 7 | 5 | Pending |
| REQ-18 | Orçamento mensal por categoria/tag com indicador visual de consumo (barra de progresso) | Milestone v1.1 | 10 | Complete |
| REQ-19 | Previsão de saldo futuro com horizonte configurável (30/60/90 dias) e estimativa de contas variáveis por histórico | Milestone v1.1 | 10 | Complete |
| REQ-20 | Comparativo de gastos mês a mês (12 meses) e mesma competência ano a ano, por tag | Milestone v1.1 | 10 | Complete |
| REQ-21 | Divisão/acerto de despesas compartilhadas entre Wesley e Luana com registro de quitação por mês | Milestone v1.1 | 10 | Complete |
| REQ-22 | Importação de extrato bancário (CSV) e fatura de cartão (OFX) com deduplicação e revisão humana antes da gravação | Milestone v1.1 | 11 | Pending |

---

## Non-Functional Requirements

| ID | Requirement | Category | Phase | Status |
|----|-------------|----------|-------|--------|
| NFR-01 | Carregamento rápido (< 500ms) após configuração inicial com cache em localStorage | Performance | 1, 4 | In Progress |
| NFR-02 | Interface mobile-first totalmente responsiva focada em facilidade de inserção rápida via celular | UX | All | In Progress |
| NFR-03 | Visual Sicredi Dark Mode: tons escuros, acentos em verde Sicredi (#00db75), cartões translúcidos e animações shimmer | UX | All | In Progress |
| NFR-04 | Segurança e Privacidade: Comunicação direta HTTP HTTPS com o Google Apps Script, chaves salvas localmente | Segurança | 1 | Complete |

---

## Constraints

| ID | Constraint | Source | Impact |
|----|------------|--------|--------|
| CON-01 | Tempo de execução do Google Apps Script | Technical | Limite de 6 minutos por execução (Script limite padrão do Google). As chamadas devem ser enxutas. |
| CON-02 | Banco de dados restrito ao Google Sheets | SPEC | Toda a modelagem de dados precisa caber em formato de tabelas planas do Sheets |

---

## Traceability Matrix

| Requirement | Plans | Tests | Status |
|-------------|-------|-------|--------|
| REQ-01 | Phase 1 Setup | Input credentials, verify saving in localStorage | Complete |
| REQ-02 | Phase 1 Setup | Make GET request to test connection, check if tabs are created if they don't exist | Complete |
| REQ-03 | Phase 2 Lançamentos | Submit standard expense, verify row insertion | Complete |
| REQ-04 | Phase 2 Lançamentos | Log as Wesley or Luana, check sheet tabs routing | Complete |
| REQ-05 | Phase 2 Lançamentos | Submit 3x installment, verify 3 rows added | Complete |
| REQ-06 | Phase 3 Recorrentes | Save recurring rules in `Recorrentes` tab | Complete |
| REQ-07 | Phase 3 Recorrentes | Fetch rules, modify value of variable bill, confirm, check commit to despesas tab | Complete |
| REQ-08 | Phase 4 Dashboard | Load Recharts, verify interactive tooltip and filters | Complete |
| REQ-09 | Phase 5 Histórico | List, edit, and delete expense rows, verify updates in sheet | — |
| REQ-10 | Phase 5 Histórico | Check if recurring bills are separated by owner in the UI | — |
| REQ-18 | Plan 10.1 Orçamento | Cadastrar limite por tag, lançar despesa da tag, verificar barra de progresso atualizar | Complete (testado com mock de backend: soma "Compartilhado" nas duas abas, cores verde/amarelo/vermelho corretas, CRUD completo) |
| REQ-19 | Plan 10.2 Previsão | Selecionar horizonte de 30/60/90 dias, verificar gráfico e ausência de dupla contagem de recorrentes já confirmados | Complete (testado com mock: saldo 1000 + salário 3000 (dia 5) - Internet 100 (dia 15) - Energia 190/média (dia 20) = 3710, batendo com a tabela mês a mês) |
| REQ-20 | Plan 10.3 Comparativo | Comparar dois meses e verificar totais e variação % por tag | Complete (testado com mock: variação % por tag e total calculada corretamente; gráfico de 12 meses renderizado) |
| REQ-21 | Plan 10.4 Acerto de Contas | Lançar despesa compartilhada com cartão cruzado, verificar cálculo do saldo devedor e marcação de quitação | Complete (testado com mock: divisão configurável 60/40 e 50/50 por despesa gerou saldo correto de R$250, distinto do resultado 50/50 fixo de R$350; fluxo de quitação validado) |
| REQ-22 | Plan 11.1 Importação | Importar CSV/OFX de teste, verificar sinalização de duplicata contra parcela já existente e gravação apenas dos itens confirmados | — |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| Pending | Not yet started |
| In Progress | Being implemented |
| Complete | Implemented and verified |
| Blocked | Cannot proceed |
| Deferred | Moved to later milestone |
