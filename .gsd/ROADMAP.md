> **Current Phase:** None
> **Status:** completed

## Must-Haves (from SPEC)

- [x] Tela de Configuração inicial do Web App URL e Token Secreto do Google Apps Script.
- [x] Script Google Apps Script robusto pronto para manipulação e inicialização da planilha.
- [x] Detecção automática e criação da planilha estruturada com abas Wesley/Luana/Recorrentes/Recebimentos.
- [x] Cadastro rápido de despesas individuais e compartilhadas por tag.
- [x] Sistema inteligente de parcelamento com gravação de múltiplas linhas futuras.
- [x] Painel de controle de despesas recorrentes (água, energia, Netflix) com ajuste no valor real.
- [x] Dashboard minimalista premium com gráficos interativos em Recharts (estilo Sicredi Dark).
- [x] Listagem de despesas lançadas com funcionalidade de edição e exclusão.
- [x] Separação e visualização de pagamentos recorrentes por pessoa (Wesley / Luana / Compartilhado).
- [x] Lançamento de despesas e receitas unificado no formulário com alternador rápido.
- [x] Cartões de poupança líquida mensal (individual e do casal) no Dashboard.
- [x] Listagem, edição e exclusão de receitas independentes no painel de Histórico.
- [x] Diferenciação de Meios de Pagamento (Pix, Cartão Wesley, Cartão Luana, Boleto) com atribuição de cartões cruzados na reconciliação.
- [x] Projeção de fluxo de caixa futuro baseado em recebimentos recorrentes.

---

## Phases

### Phase 1: Setup e Autenticação (Foundation)
**Status:** ✅ Complete
**Objective:** Inicializar o projeto Vite+React+TypeScript, desenvolver o design system (Sicredi Dark Mode), programar a API do Google Apps Script e implementar a tela de configuração de credenciais no frontend com validação de conexão.
**Requirements:** REQ-01, REQ-02, NFR-03, NFR-04

**Plans:**
- [x] Plan 1.1: Inicializar estrutura do projeto React (Vite/TypeScript) e design system CSS (variáveis de cores Sicredi Dark Mode, reset, estilos base).
- [x] Plan 1.2: Desenvolver o código completo do Google Apps Script (arquivo local no repositório) e tela de configuração inicial no frontend (URL + Token Secreto) com salvamento em localStorage.
- [x] Plan 1.3: Implementar teste de conexão e inicialização/verificação automática das abas (`Despesas [Wesley]`, `Despesas [Luana]`, `Recorrentes`) na planilha do Sheets através do Apps Script.

---

### Phase 2: Lançamento de Despesas e Parcelamentos (Core Feature 1)
**Status:** ✅ Complete
**Objective:** Criar o formulário de despesas e implementar a expansão de compras parceladas in linhas futuras da planilha.
**Depends on:** Phase 1
**Requirements:** REQ-03, REQ-04, REQ-05, NFR-02

**Plans:**
- [x] Plan 2.1: Desenvolver a interface do formulário de lançamento (Mobile-First, Sicredi Dark glassmorphic UI) e lógica de tags rápidas padrões.
- [x] Plan 2.2: Implementar a lógica de gravação para a respectiva aba (`Despesas [Wesley]` ou `Despesas [Luana]`) e tratamento de marcação compartilhada.
- [x] Plan 2.3: Desenvolver algoritmo de parcelamento (geração e inserção em lote de N parcelas com IDs vinculados).

---

### Phase 3: Gestão de Despesas Recorrentes (Core Feature 2)
**Status:** ✅ Complete
**Objective:** Implementar aba de configuração `Recorrentes` e painel de provisão e conciliação de faturas mensais.
**Depends on:** Phase 2
**Requirements:** REQ-06, REQ-07

**Plans:**
- [x] Plan 3.1: Criar formulário de cadastro de despesas recorrentes (Fixas/Variáveis) salvando na aba `Recorrentes`.
- [x] Plan 3.2: Implementar a exibição de pendências de despesas recorrentes do mês corrente no app com estimativas.
- [x] Plan 3.3: Desenvolver o fluxo de confirmação rápida que permite ajustar o valor (para contas variáveis como luz/água) e commitar o gasto real na aba do usuário correspondente.

---

### Phase 4: Dashboard Dinâmico e Polimento Premium (Polish/Launch)
**Status:** ✅ Complete
**Objective:** Criar gráficos e painel consolidados com polimento estético avançado.
**Depends on:** Phase 3
**Requirements:** REQ-08, NFR-01, NFR-03

**Plans:**
- [x] Plan 4.1: Integrar Recharts e desenvolver gráficos interativos (Pie chart de gastos por tag, Bar chart de Wesley vs. Luana vs. Compartilhado, Line/Bar de evolução mensal).
- [x] Plan 4.2: Polimento final de micro-animações (shimmer effects de loading, hover effects, transições de aba) e deploy final na Vercel.

---

### Phase 5: Histórico de Despesas e Separação de Recorrentes (Management & Grouping)
**Status:** ✅ Complete
**Objective:** Criar aba de histórico para listagem, edição e exclusão de despesas, e organizar as contas recorrentes por pessoa (Wesley/Luana) em tabelas separadas.
**Depends on:** Phase 4
**Requirements:** REQ-09, REQ-10

**Plans:**
- [x] Plan 5.1: Extensão da API e Organização de Recorrentes (completado em 2026-06-02)
- [x] Plan 5.2: Painel de Histórico e Validação de Fluxos (completado em 2026-06-02)

---

### Phase 6: Autenticação via Hash e Polimento Visual (Polishing & Usability)
**Status:** ✅ Complete
**Objective:** Facilitar o login em dispositivos móveis por meio de autenticação via hash na URL, melhorar a precisão da conciliação de contas recorrentes e personalizar o título/favicon do projeto.
**Depends on:** Phase 5
**Requirements:** REQ-11, REQ-12

**Plans:**
- [x] Plan 6.1: Autenticação via Hash e Polimento Visual (completado em 2026-06-02)

---

### Phase 7: Lançamento e Gestão de Recebimentos (Revenues & Cash Flow)
**Status:** ✅ Complete
**Objective:** Desenvolver o suporte a recebimentos (entradas de receitas) nas planilhas e no frontend, incluindo o formulário de lançamento, listagem e edição no histórico, e visualização de saldos de poupança líquida no Dashboard.
**Depends on:** Phase 6
**Requirements:** REQ-13, REQ-14

**Plans:**
- [x] Plan 7.1: Lançamento e Gestão de Recebimentos (completado em 2026-06-03)

---

### Phase 8: Identificação de Meios de Pagamento (PIX vs Cartão)
**Status:** ✅ Complete
**Objective:** Adicionar suporte a Meio de Pagamento (Pix, Cartão Wesley, Cartão Luana, Boleto) nas despesas para que Wesley e Luana consigam diferenciar a origem do fluxo de caixa e ajustar a conciliação financeira do Dashboard para faturas intercruzadas.
**Depends on:** Phase 7
**Requirements:** REQ-15, REQ-16

**Plans:**
- [x] Plan 8.1: Meios de Pagamento e Previsão de Recebimentos/Saldo Futuro (completado em 2026-06-05)

---

### Phase 9: Gestão de Faturas de Cartão de Crédito
**Status:** ✅ Complete
**Objective:** Desenvolver um painel dedicado ("Cartões") para visualizar a fatura detalhada do Cartão Wesley e Cartão Luana para o mês selecionado, listando as despesas físicas imputadas a cada cartão e permitindo lançar despesas de forma direta com o meio de pagamento pré-selecionado.
**Depends on:** Phase 8
**Requirements:** REQ-17

**Plans:**
- [x] Plan 9.1: Criar o componente CardInvoicePanel, integrar com a barra de abas e implementar lançamentos rápidos e parcelados na fatura.

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1     | ✅      | 3/3   | 2026-06-01 |
| 2     | ✅      | 3/3   | 2026-06-01 |
| 3     | ✅      | 3/3   | 2026-06-01 |
| 4     | ✅      | 2/2   | 2026-06-01 |
| 5     | ✅      | 2/2   | 2026-06-02 |
| 6     | ✅      | 1/1   | 2026-06-02 |
| 7     | ✅      | 1/1   | 2026-06-03 |
| 8     | ✅      | 1/1   | 2026-06-05 |
| 9     | ✅      | 1/1   | 2026-06-05 |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1     | 2026-06-01 | 2026-06-01 | < 1 dia  |
| 2     | 2026-06-01 | 2026-06-01 | < 1 dia  |
| 3     | 2026-06-01 | 2026-06-01 | < 1 dia  |
| 4     | 2026-06-01 | 2026-06-01 | < 1 dia  |
| 5     | 2026-06-02 | 2026-06-02 | < 1 dia  |
| 6     | 2026-06-02 | 2026-06-02 | < 1 dia  |
| 7     | 2026-06-03 | 2026-06-03 | < 1 dia  |
| 8     | 2026-06-05 | 2026-06-05 | < 1 dia  |
| 9     | 2026-06-05 | 2026-06-05 | < 1 dia  |
