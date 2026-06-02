---
milestone: v1.0
updated: 2026-06-01T20:30:00-04:00
---

# Requirements

## Overview

Requirements derived from SPEC.md for traceability and coverage tracking.

---

## Functional Requirements

| ID | Requirement | Source | Phase | Status |
|----|-------------|--------|-------|--------|
| REQ-01 | Tela de Login com Google OAuth 2.0 (GIS) integrando fluxo de token client-side | SPEC Goal 1 | 1 | Pending |
| REQ-02 | Busca e criação/formatação automática da planilha "Finanças Compartilhadas Wesley e Luana" no Drive | SPEC Goal 1 | 1 | Pending |
| REQ-03 | Formulário de lançamento rápido com descrição, valor, data, tags dinâmicas e checkbox "Compartilhado" | SPEC Goal 2 | 2 | Pending |
| REQ-04 | Direcionamento dos registros para as abas `Despesas [Wesley]` ou `Despesas [Luana]` conforme o usuário autenticado | SPEC Goal 2 | 2 | Pending |
| REQ-05 | Lançamento de compras parceladas divididas em N linhas futuras com ID de parcelamento único | SPEC Goal 3 | 2 | Pending |
| REQ-06 | Aba de configuração `Recorrentes` para cadastrar contas recorrentes (Fixas/Variáveis) com valor estimado | SPEC Goal 4 | 3 | Pending |
| REQ-07 | Painel de "Contas a Pagar/Pendentes" para visualizar estimativas mensais e confirmar os valores reais | SPEC Goal 4 | 3 | Pending |
| REQ-08 | Dashboard dinâmico exibindo resumo do mês, divisão por dono da despesa, e gráficos por tags usando Recharts | SPEC Goal 5 | 4 | Pending |

---

## Non-Functional Requirements

| ID | Requirement | Category | Phase | Status |
|----|-------------|----------|-------|--------|
| NFR-01 | Carregamento rápido (< 1s após login) com cache local dos dados da planilha no estado do React | Performance | 1, 4 | Pending |
| NFR-02 | Interface mobile-friendly (responsiva) facilitando lançamentos rápidos no smartphone | UX | All | Pending |
| NFR-03 | Design minimalista com estética premium, dark mode nativo, glassmorphism e micro-animações de carregamento | UX | All | Pending |
| NFR-04 | Segurança e Privacidade: Processamento 100% no navegador do usuário, sem banco de dados próprio ou backend | Segurança | 1 | Pending |

---

## Constraints

| ID | Constraint | Source | Impact |
|----|------------|--------|--------|
| CON-01 | Limitações de Cota do Google API | Technical | Requisições devem ser otimizadas e em lote (batch API updates) sempre que possível para evitar rate limiting |
| CON-02 | Banco de dados restrito ao Google Sheets | SPEC | Toda a modelagem de dados precisa caber em formato de tabelas planas do Sheets |

---

## Traceability Matrix

| Requirement | Plans | Tests | Status |
|-------------|-------|-------|--------|
| REQ-01 | Phase 1 Setup | Login, Logout verification | — |
| REQ-02 | Phase 1 Setup | Create sheet if not exists, verify tabs structure | — |
| REQ-03 | Phase 2 Lançamentos | Submit standard expense, verify row insertion | — |
| REQ-04 | Phase 2 Lançamentos | Log in as Wesley and Luana, check sheet tabs routing | — |
| REQ-05 | Phase 2 Lançamentos | Submit 3x installment, verify 3 rows added | — |
| REQ-06 | Phase 3 Recorrentes | Save recurring rules in `Recorrentes` tab | — |
| REQ-07 | Phase 3 Recorrentes | Fetch rules, modify value of variable bill, confirm, check commit to despesas tab | — |
| REQ-08 | Phase 4 Dashboard | Load Recharts, verify interactive tooltip and filters | — |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| Pending | Not yet started |
| In Progress | Being implemented |
| Complete | Implemented and verified |
| Blocked | Cannot proceed |
| Deferred | Moved to later milestone |
