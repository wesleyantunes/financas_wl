---
milestone: v1.0
version: 1.0.0
updated: 2026-06-01T20:32:00-04:00
---

# Roadmap

> **Current Phase:** Not started
> **Status:** planning

## Must-Haves (from SPEC)

- [ ] Autenticação Google OAuth 2.0 client-side integrada.
- [ ] Detecção automática e criação da planilha estruturada com abas Wesley/Luana/Recorrentes.
- [ ] Cadastro rápido de despesas individuais e compartilhadas por tag.
- [ ] Sistema inteligente de parcelamento com gravação de múltiplas linhas futuras.
- [ ] Painel de controle de despesas recorrentes (água, energia, Netflix) com ajuste no valor real.
- [ ] Dashboard minimalista premium com gráficos interativos em Recharts.

---

## Phases

### Phase 1: Setup e Autenticação (Foundation)
**Status:** ⬜ Not Started
**Objective:** Inicializar o projeto Vite+React, integrar as APIs do Google (OAuth 2.0, Drive, Sheets) e implementar a criação/descoberta automática da planilha.
**Requirements:** REQ-01, REQ-02, NFR-04

**Plans:**
- [ ] Plan 1.1: Inicializar estrutura do projeto React (Vite) e design system CSS (variáveis de cores, reset, dark mode).
- [ ] Plan 1.2: Implementar autenticação Google Identity Services (GIS) no React e fluxo de conexão de escopos de API.
- [ ] Plan 1.3: Desenvolver lógica de verificação, busca da planilha no Drive e criação automática com a estrutura de abas correta se não encontrada.

---

### Phase 2: Lançamento de Despesas e Parcelamentos (Core Feature 1)
**Status:** ⬜ Not Started
**Objective:** Criar o formulário de despesas e implementar a expansão de compras parceladas em linhas futuras da planilha.
**Depends on:** Phase 1
**Requirements:** REQ-03, REQ-04, REQ-05, NFR-02

**Plans:**
- [ ] Plan 2.1: Desenvolver a interface do formulário de lançamento (Mobile-First, glassmorphic UI) e lógica de tags rápidas.
- [ ] Plan 2.2: Implementar a lógica de gravação para a respectiva aba (`Despesas [Wesley]` ou `Despesas [Luana]`) e tratamento de marcação compartilhada.
- [ ] Plan 2.3: Desenvolver algoritmo de parcelamento (geração e inserção em lote de N parcelas com IDs vinculados).

---

### Phase 3: Gestão de Despesas Recorrentes (Core Feature 2)
**Status:** ⬜ Not Started
**Objective:** Implementar aba de configuração `Recorrentes` e painel de provisão e conciliação de faturas mensais.
**Depends on:** Phase 2
**Requirements:** REQ-06, REQ-07

**Plans:**
- [ ] Plan 3.1: Criar formulário de cadastro de despesas recorrentes (Fixas/Variáveis) salvando na aba `Recorrentes`.
- [ ] Plan 3.2: Implementar a exibição de pendências de despesas recorrentes do mês corrente no app com estimativas.
- [ ] Plan 3.3: Desenvolver o fluxo de confirmação rápida que permite ajustar o valor (para contas variáveis como luz/água) e commitar o gasto real na aba do usuário correspondente.

---

### Phase 4: Dashboard Dinâmico e Polimento Premium (Polish/Launch)
**Status:** ⬜ Not Started
**Objective:** Criar gráficos e painel consolidados com polimento estético avançado.
**Depends on:** Phase 3
**Requirements:** REQ-08, NFR-01, NFR-03

**Plans:**
- [ ] Plan 4.1: Integrar Recharts e desenvolver gráficos interativos (Pie chart de gastos por tag, Bar chart de Wesley vs. Luana vs. Compartilhado, Line/Bar de evolução mensal).
- [ ] Plan 4.2: Polimento final de micro-animações (shimmer effects de loading, hover effects, transições de aba) e deploy final na Vercel.

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1 | ⬜ | 0/3 | — |
| 2 | ⬜ | 0/3 | — |
| 3 | ⬜ | 0/3 | — |
| 4 | ⬜ | 0/2 | — |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1 | — | — | — |
| 2 | — | — | — |
| 3 | — | — | — |
| 4 | — | — | — |
