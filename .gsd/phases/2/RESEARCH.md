---
phase: 2
researched_at: 2026-06-01
discovery_level: 1
---

# Pesquisa de Integração de Transações (Apps Script API)

## Objective
Definir o contrato e comportamento do endpoint de escrita de despesas no Google Apps Script, garantindo que o algoritmo de parcelamento (expansão de linhas) e registros à vista funcionem de forma rápida e segura.

## Discovery Level
**Level 1** — Verificação rápida de sintaxe do Apps Script para inserção de múltiplas linhas de uma vez só (batch insert).

## Key Decisions

### Decision 1: Lógica de Inserção de Parcelamentos (Cliente vs. Servidor)
**Question:** Onde deve ocorrer a geração das N parcelas: no Frontend React ou no Apps Script?
**Options Considered:**
1. **No Frontend (Recomendado):** O React gera o array com as N linhas de despesa formatadas (datas, descrições "Sofá 1/12", etc.) e envia esse array para o Apps Script gravar em lote.
   - *Pros:* Facilita o desenvolvimento do formulário, permite validar e mostrar ao usuário a projeção exata das parcelas antes de submeter, mantendo o Apps Script extremamente simples e burro.
2. **No Apps Script:** O React envia `{ descricao: "Sofá", parcelas: 12, valorTotal: 1200 }` e o script calcula e insere as linhas.
   - *Pros:* Menor payload trafegando na rede.
   - *Cons:* Código de negócio crítico descentralizado na nuvem do Google, tornando atualizações de lógica mais difíceis (exige que o usuário atualize o Apps Script com mais frequência).

**Decision:** **Opção 1 (No Frontend)**. O React gerará a lista de parcelas completa e enviará a ação `addExpenses` contendo o array com todas as linhas de uma vez.
**Confidence:** High

---

## Findings

### 1. Inserção em Lote no Apps Script (Batch Write)
Para gravar de forma eficiente N linhas na planilha via Apps Script:
* Usar `sheet.appendRow` para lançamentos individuais é ótimo.
* Para múltiplos lançamentos (compras parceladas), fazer múltiplos `appendRow` pode ser lento devido a commits internos do Google Sheets. A forma ideal em Apps Script é:
  ```javascript
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(lastRow + 1, 1, valuesArray.length, valuesArray[0].length);
  range.setValues(valuesArray);
  ```
  Isso executa a gravação de todas as parcelas instantaneamente em uma única operação atômica de escrita.

### 2. Payload da Ação `addExpenses`
O payload enviado do frontend será estruturado como:
```json
{
  "token": "senha_secreta",
  "action": "addExpenses",
  "tabName": "Despesas [Wesley]",
  "expenses": [
    ["id_1", "2026-06-10", "Sofá (1/3)", 100.00, "Casa", true, "sofa_123"],
    ["id_2", "2026-07-10", "Sofá (2/3)", 100.00, "Casa", true, "sofa_123"],
    ["id_3", "2026-08-10", "Sofá (3/3)", 100.00, "Casa", true, "sofa_123"]
  ]
}
```

---

## Recommendations for Planning
1. **Plan 2.1: Formular Lançamentos (React UI).** Focar no formulário com inputs estilizados para valor, descrição, data, tags padrões (dropdown + badge selector) e checkbox de parcelamento que abre campos adicionais (número de parcelas).
2. **Plan 2.2: Algoritmo de Expansão de Parcelas.** Implementar a lógica no frontend que pega os dados e gera o array de despesas, e implementar a extensão do Apps Script no arquivo `scripts/google-apps-script.js` para suportar `addExpenses` (com batch insert).
3. **Plan 2.3: Fluxo de Confirmação e Integração.** Conectar o botão "Salvar despesa" à chamada de API, limpando o formulário após confirmação de sucesso com feedback visual (ex: modal ou mensagem flutuante de sucesso).
