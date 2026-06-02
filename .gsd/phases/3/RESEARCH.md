---
phase: 3
researched_at: 2026-06-01
discovery_level: 1
---

# Pesquisa de Consolidação de Contas e Previsões (Apps Script API)

## Objective
Definir o fluxo de leitura e sincronização das despesas mensais e regras de despesas recorrentes, garantindo que o app consiga computar localmente quais contas fixas já foram pagas (confirmadas) e quais estão pendentes no mês corrente.

## Discovery Level
**Level 1** — Planejamento de payload unificado para sincronização mensal atômica.

## Key Decisions

### Decision 1: Lógica de Identificação de Despesas Pagas (Conciliação)
**Question:** Como o aplicativo saberá se uma conta recorrente (ex: "Netflix" ou "Energia Elétrica") já foi paga e gravada no mês corrente?
**Options Considered:**
1. **Mapeamento de Nomes (Recomendado):** O app lê a lista de regras em `Recorrentes` e a lista de despesas já lançadas no mês. Se houver uma despesa lançada cujo nome contenha o nome da regra (ex: despesa "Netflix" ou "Energia Elétrica"), ela é considerada paga naquele mês.
   - *Pros:* Simplicidade absoluta. Dispensa colunas extras de relacionamento na planilha e funciona mesmo se o usuário adicionar a despesa manualmente no Sheets.
2. **Coluna de ID de Recorrência:** Adicionar uma coluna `ID Recorrência` na aba de despesas.
   - *Cons:* Polui a planilha de despesas do Sheets com mais uma coluna que o usuário comum não entenderá se abrir diretamente no Drive.

**Decision:** **Opção 1 (Mapeamento de Nomes)**. Faremos a comparação por texto simples (normalizado) diretamente no frontend. Se o usuário confirmar o pagamento de uma conta variável e mudar o nome (ex: de "Energia Elétrica" para "Energia Elétrica (Maio)"), o app fará busca por substring para identificar a conciliação.
**Confidence:** High

---

## Findings

### 1. Chamada de Sincronização Unificada: Ação `getMonthData`
Para evitar múltiplos requests lentos (um para ler despesas do Wesley, outro da Luana, outro das regras), criaremos uma ação `getMonthData` no Apps Script.
* **Parâmetros:** `{ action: "getMonthData", month: "2026-06" }`
* **Retorno:**
  ```json
  {
    "success": true,
    "recurring": [
      { "id": "rec_1", "desc": "Netflix", "value": 55.9, "day": 10, "type": "Fixo", "owner": "Compartilhado", "active": true }
    ],
    "wesleyExpenses": [
      { "id": "tx_1", "date": "2026-06-05", "desc": "Mercado", "value": 150.0, "tag": "Alimentação", "shared": true }
    ],
    "luanaExpenses": []
  }
  ```

### 2. Algoritmo de Conciliação no Frontend
No React, para cada regra ativa em `recurring`:
1. Filtrar despesas da pessoa correspondente (ou todas, se a regra for "Compartilhado") no mês selecionado.
2. Procurar se existe alguma transação cuja descrição contenha a descrição da regra (ex: `tx.desc.toLowerCase().includes(rule.desc.toLowerCase())`).
3. Se existir, o status da conta é **"Pago"** (exibindo o valor real lançado).
4. Se não existir, o status é **"Pendente"** (exibindo o valor estimado da regra e um botão "Confirmar Pagamento").

---

## Recommendations for Planning
1. **Plan 3.1: Cadastro de Regras Recorrentes.** Criar formulário visual Sicredi Dark para inserir novas regras e salvá-las na aba `Recorrentes` (ação `addRecurringRule`).
2. **Plan 3.2: API de Leitura Unificada (getMonthData).** Implementar a ação `getMonthData` no Apps Script e mapear o serviço no frontend.
3. **Plan 3.3: Painel de Contas Pendentes e Confirmação.** Desenvolver a aba de "Recorrentes" no app que exibe a lista de contas, marcando Pagas vs. Pendentes e oferecendo o modal de confirmação para ajustar o valor e lançar a despesa real com um clique.
