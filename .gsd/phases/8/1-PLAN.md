---
phase: 8
plan: 1
wave: 1
---

# Plan 8.1: Meios de Pagamento e Previsão de Recebimentos/Saldo Futuro

## Objective
Implementar duas melhorias de planejamento e conciliação:
1. **Identificação de Meios de Pagamento (Pix, Cartão Wesley, Cartão Luana, Boleto):** Permitir categorizar a origem do desembolso e compensar compras cruzadas no Dashboard (se Luana gasta no cartão de Wesley, o pagamento físico é atribuído a Wesley, mantendo a responsabilidade com Luana).
2. **Previsão de Recebimentos e Saldo Futuro:** Cadastrar recebimentos recorrentes (ex: salários) e calcular o saldo líquido previsto para o mês corrente (lançados + pendentes recorrentes) e saldo projetado para meses futuros no Dashboard.

## Context
- .gsd/SPEC.md
- scripts/google-apps-script.js
- src/services/api.ts
- src/components/ExpenseForm.tsx
- src/components/RecurringPanel.tsx
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
      - Atualizar `initialize` para incluir a oitava coluna no cabeçalho das abas de despesas: `'Meio de Pagamento'` (estilo cabeçalho `A1:H1`).
      - Criar a nova aba `'Recorrentes Recebimentos'` caso ela não exista, com colunas `['ID', 'Descrição', 'Valor Estimado', 'Dia Recebimento', 'Dono', 'Ativo']` em cabeçalho verde Sicredi.
      - Na ação `getMonthData`, ler da nova aba `'Recorrentes Recebimentos'` filtrando as ativas, e retornar no payload de resposta como `recurringReceivables` (com tratamento de fallback caso a aba não esteja criada).
      - Na ação `addRecurringRule`, aceitar o parâmetro dinâmico `tabName` para salvar na aba correta (`Recorrentes` ou `Recorrentes Recebimentos`).
      - Substituir o número fixo `7` pelo dinâmico `sheet.getLastColumn()` nos métodos de exclusão/edição de parcelamento em lote, e suportar a alteração do meio de pagamento na coluna H.
    - No `src/services/api.ts`:
      - Atualizar `RawExpense` para incluir `['Meio de Pagamento']` e `meioPagamento`.
      - Atualizar a resposta de `getMonthData` para incluir `recurringReceivables: RawRecurringRule[]`.
      - Atualizar `addRecurringRule` para suportar o parâmetro opcional `tabName: string` (padrão `'Recorrentes'`).
  </action>
  <verify>
    Executar compilação estática com TypeScript:
    `npm run build`
  </verify>
  <done>
    Google Apps Script e React Client preparados com suporte a Meio de Pagamento e Recebimentos Recorrentes.
  </done>
</task>

<task type="auto">
  <name>Integrar Lançamento de Meio de Pagamento e Painel de Recebimentos Recorrentes</name>
  <files>
    - src/components/ExpenseForm.tsx
    - src/components/RecurringPanel.tsx
  </files>
  <action>
    - No `src/components/ExpenseForm.tsx`:
      - Adicionar seletor dropdown de **Meio de Pagamento** para despesas com as opções: `Pix` (padrão), `Cartão Wesley`, `Cartão Luana`, `Boleto`. Ocultá-lo para receitas.
      - Passar o valor selecionado na oitava coluna do array ao submeter despesas comuns ou parceladas.
    - No `src/components/RecurringPanel.tsx`:
      - Adicionar seletor de abas secundário no topo: **Despesas Recorrentes** e **Recebimentos Recorrentes**.
      - Ao selecionar **Recebimentos Recorrentes**:
        - Adaptar o formulário para exibir campos adequados (sem Tipo Fixa/Variável e sem Compartilhado). Salvar as novas regras na aba `'Recorrentes Recebimentos'`.
        - Listar os recebimentos recorrentes por Dono e disponibilizar a ação rápida de "Confirmar Recebimento", gravando a receita real na respectiva aba de recebimento com o valor e data ajustados.
  </action>
  <verify>
    Validar lints e compilação do React:
    `npm run lint`
  </verify>
  <done>
    Formulário de lançamentos e painel de recorrentes estendidos para suportar receitas recorrentes e meios de pagamento.
  </done>
</task>

<task type="auto">
  <name>Implementar Projeção de Saldo no Dashboard e Coluna no Histórico</name>
  <files>
    - src/components/Dashboard.tsx
    - src/components/HistoryPanel.tsx
  </files>
  <action>
    - No `src/components/Dashboard.tsx`:
      - Lógica de Atribuição: Ao somar os gastos efetuados, direcionar as despesas pagas com `Cartão Wesley` para `wesleyPaid` e com `Cartão Luana` para `luanaPaid`, independentemente de qual aba a despesa esteja (cartões cruzados). Pix/Boleto e outros continuam no dono da aba.
      - Lógica de Projeção: Calcular os recebimentos pendentes (regras em `recurringReceivables` que ainda não tenham correspondência por descrição/valor nas abas de recebimento do mês) e as despesas pendentes (regras em `recurring` não correspondidas nas abas de despesa).
      - Exibir no topo do Dashboard (ou em seção de destaque) o bloco de **Saldo Previsto** detalhando: Receita Prevista (Lançada + Pendente), Despesa Prevista (Lançada + Pendente) e o Saldo Final Projetado.
      - Para meses futuros (onde lançamentos reais são zero), a projeção exibirá o saldo planejado baseado puramente nas regras recorrentes.
    - No `src/components/HistoryPanel.tsx`:
      - Capturar o meio de pagamento na conversão do Sheets e exibir na nova coluna **Pagamento** da tabela de despesas.
      - Adicionar o campo no Modal de Edição (com alteração individual e em lote para parcelas futuras).
  </action>
  <verify>
    Garantir que a build e linter rodam com sucesso em lote:
    `npm run lint` e `npm run build`
  </verify>
  <done>
    Dashboard projeta o fluxo de caixa futuro e o Histórico gerencia de forma completa os meios de pagamento das despesas.
  </done>
</task>

## Success Criteria
- [ ] O banco de dados e os tipos React comportam receitas recorrentes e meios de pagamento de despesa.
- [ ] Usuários podem lançar e gerenciar receitas recorrentes no painel `Recorrentes`.
- [ ] O Dashboard projeta receitas e despesas pendentes do mês corrente e monta a simulação líquida para meses futuros.
- [ ] A compensação de compras com cartão de um cônjuge na aba do outro funciona perfeitamente no acerto de contas.
- [ ] O Histórico lista, edita e exclui despesas incluindo a coluna de Meio de Pagamento.
