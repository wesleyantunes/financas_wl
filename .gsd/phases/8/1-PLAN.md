---
phase: 8
plan: 1
wave: 1
---

# Plan 8.1: Identificação de Meios de Pagamento (PIX vs Cartão)

## Objective
Implementar suporte a Meio de Pagamento (Pix, Cartão Wesley, Cartão Luana, Boleto) nas despesas para que Wesley e Luana consigam diferenciar a origem do fluxo de caixa. Além disso, ajustar os cálculos de conciliação do Dashboard para direcionar o pagamento a quem realmente pagou a fatura do cartão (ex: se Luana passa uma despesa própria no cartão do Wesley, o valor pago deve ser atribuído a Wesley na reconciliação, mas a responsabilidade do gasto continua sendo dela).

## Context
- .gsd/SPEC.md
- scripts/google-apps-script.js
- src/services/api.ts
- src/components/ExpenseForm.tsx
- src/components/Dashboard.tsx
- src/components/HistoryPanel.tsx

## Tasks

<task type="auto">
  <name>Atualizar Google Apps Script e Tipos da API React</name>
  <files>
    - scripts/google-apps-script.js
    - src/services/api.ts
  </files>
  <action>
    - No `scripts/google-apps-script.js`:
      - Atualizar a ação `initialize` para incluir a oitava coluna no cabeçalho das abas de despesas: `'Meio de Pagamento'`. A linha de cabeçalho será: `['ID', 'Data', 'Descrição', 'Valor', 'Tag', 'Compartilhado', 'ID Parcelamento', 'Meio de Pagamento']`.
      - Atualizar a estilização de cabeçalho das despesas para incluir a coluna H: `sheet.getRange("A1:H1")`.
      - Substituir o número fixo `7` pelo dinâmico `sheet.getLastColumn()` nas chamadas `getRange` de `deleteInstallments` e `updateInstallments` para suportar novas colunas.
      - Na ação `updateInstallments`, verificar se `updatedFields.MeioPagamento !== undefined` ou `updatedFields['Meio de Pagamento'] !== undefined` e atualizar a coluna H (índice 7) correspondente: `values[i][7] = updatedFields.MeioPagamento || updatedFields['Meio de Pagamento'];`.
    - No `src/services/api.ts`:
      - Atualizar a interface `RawExpense` para incluir `['Meio de Pagamento']?: string` e `meioPagamento?: string`.
      - Na assinatura de `updateInstallments`, adicionar `MeioPagamento?: string` nas chaves tipadas de `updatedFields`.
  </action>
  <verify>
    Executar o TypeScript compiler localmente para garantir conformidade de tipos:
    `npm run build`
  </verify>
  <done>
    A planilha e o React Client suportam 8 colunas de despesa, incluindo o meio de pagamento nas chamadas em lote e edições.
  </done>
</task>

<task type="auto">
  <name>Integrar Meio de Pagamento no Formulário de Despesas (ExpenseForm)</name>
  <files>
    - src/components/ExpenseForm.tsx
  </files>
  <action>
    - No `src/components/ExpenseForm.tsx`:
      - Adicionar um estado para o meio de pagamento selecionado: `const [paymentMethod, setPaymentMethod] = useState('Pix');`.
      - Adicionar no JSX um seletor dropdown (select) de **Meio de Pagamento** para despesas com as opções: `Pix`, `Cartão Wesley`, `Cartão Luana`, `Boleto`.
      - Exibir o seletor apenas quando o alternador estiver selecionando despesas (`entryType === 'expense'`). Para recebimentos, ocultá-lo.
      - Ajustar a montagem do array bidimensional de lançamentos no submit. Se for despesa comum ou parcelada, adicionar o meio de pagamento na oitava posição (`paymentMethod`).
  </action>
  <verify>
    Rodar o linter do projeto e atestar conformidade:
    `npm run lint`
  </verify>
  <done>
    O usuário consegue selecionar o meio de pagamento ao lançar despesas, que são salvas na oitava coluna da respectiva aba.
  </done>
</task>

<task type="auto">
  <name>Integrar Atribuição Financeira no Dashboard e Listagem no Histórico</name>
  <files>
    - src/components/Dashboard.tsx
    - src/components/HistoryPanel.tsx
  </files>
  <action>
    - No `src/components/Dashboard.tsx`:
      - Desenvolver lógica para resolver quem fisicamente realizou o pagamento. Se o meio de pagamento for `Cartão Wesley`, o pagador físico é `Wesley`. Se for `Cartão Luana`, é `Luana`. Caso contrário (Pix, Boleto, etc.), o pagador coincide com o dono da aba de origem (Wesley na aba do Wesley, Luana na aba da Luana).
      - Ajustar a somatória de `wesleyPaid` e `luanaPaid` no Dashboard usando essa nova lógica. O total do casal e gastos justos continuam baseados na responsabilidade individual/compartilhada normal.
    - No `src/components/HistoryPanel.tsx`:
      - Atualizar a interface `NormalizedExpense` e a rotina `parseList` para ler a oitava coluna do Sheets e armazenar no campo `paymentMethod`.
      - Exibir o meio de pagamento como uma nova coluna ("Pagamento") na tabela de histórico de despesas com badges discretos Sicredi Dark. Ocultar a coluna quando visualizando recebimentos.
      - Adicionar o seletor de meio de pagamento no modal de edição, atualizando individualmente a linha com 8 colunas ou enviando o campo alterado para a rotina de parcelas futuras.
  </action>
  <verify>
    Compilar e rodar o linter de verificação final:
    `npm run lint` e `npm run build`
  </verify>
  <done>
    A conciliação do Dashboard ajusta automaticamente faturas de cartões intercruzados e o histórico exibe e gerencia de forma completa os meios de pagamento.
  </done>
</task>

## Success Criteria
- [ ] O script e o cliente React comportam 8 colunas para despesas incluindo `Meio de Pagamento`.
- [ ] Lançamentos no formulário de despesa salvam o meio de pagamento escolhido.
- [ ] O Dashboard recalcula `wesleyPaid` / `luanaPaid` associando as faturas a quem possui o respectivo cartão de crédito.
- [ ] O Histórico lista, edita e exclui despesas gerenciando corretamente a coluna de Meio de Pagamento.
