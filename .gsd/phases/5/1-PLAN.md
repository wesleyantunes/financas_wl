---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Extensão da API e Organização de Recorrentes

## Objective
Implementar as operações de exclusão e edição de transações no Google Apps Script, atualizar o cliente API frontend no React e separar a exibição de regras recorrentes por dono no painel recorrente.

## Context
- .gsd/SPEC.md
- .gsd/phases/5/RESEARCH.md
- scripts/google-apps-script.js
- src/services/api.ts
- src/components/RecurringPanel.tsx

## Tasks

<task type="auto">
  <name>Atualizar Google Apps Script com Ações de Edição e Exclusão</name>
  <files>
    - scripts/google-apps-script.js
  </files>
  <action>
    - Adicionar suporte no `doPost(e)` para duas novas ações: `deleteExpense` e `updateExpense`.
    - Implementar a rotina `deleteExpense` no script local:
      - Aceitar `tabName` e `id`.
      - Localizar a linha correspondente pelo ID na coluna A.
      - Chamar `sheet.deleteRow(rowNumber)`.
    - Implementar a rotina `updateExpense` no script local:
      - Aceitar `tabName`, `id` e `expense` (nova linha de dados).
      - Localizar a linha correspondente pelo ID na coluna A.
      - Chamar `sheet.getRange(rowNumber, 1, 1, 7).setValues([expense])`.
    - Atualizar os comentários e documentação de passos no topo do script para refletir que os usuários precisam implantar novamente.
  </action>
  <verify>
    Confirmar que o arquivo `google-apps-script.js` possui as funções implementadas.
  </verify>
  <done>
    O arquivo `google-apps-script.js` contém a lógica para encontrar transações por ID na planilha e realizar as operações de deleção/atualização.
  </done>
</task>

<task type="auto">
  <name>Implementar Métodos de Exclusão e Edição no Serviço de API React</name>
  <files>
    - src/services/api.ts
  </files>
  <action>
    - Adicionar e exportar o método `deleteExpense(url, token, tabName, id)`.
    - Adicionar e exportar o método `updateExpense(url, token, tabName, id, expense)`.
    - Garantir que ambos chamem o método genérico `request` e usem os tipos corretos.
  </action>
  <verify>
    Rodar a build local para confirmar que os tipos do TypeScript estão corretos no `api.ts`:
    `npm run build`
  </verify>
  <done>
    O arquivo `src/services/api.ts` exporta as funções de deleção e atualização para uso nos componentes React.
  </done>
</task>

<task type="auto">
  <name>Separar Contas Recorrentes por Dono no RecurringPanel</name>
  <files>
    - src/components/RecurringPanel.tsx
  </files>
  <action>
    - No `RecurringPanel.tsx`, alterar o agrupamento e exibição de despesas recorrentes pendentes/pagas.
    - Separar em seções/tabelas independentes por Dono:
      - Tabela 1: Contas de Wesley (`Dono === 'Wesley'`)
      - Tabela 2: Contas de Luana (`Dono === 'Luana'`)
      - Tabela 3: Contas Compartilhadas (`Dono === 'Compartilhado'`)
    - Exibir de forma organizada e limpa no Sicredi Dark Mode.
  </action>
  <verify>
    Verificar a compilação do componente sem erros de linting:
    `npm run lint`
  </verify>
  <done>
    As contas recorrentes são divididas visualmente por dono no painel, facilitando a visualização de responsabilidades individuais e compartilhadas.
  </done>
</task>

## Success Criteria
- [ ] O script Google Apps Script local suporta `deleteExpense` e `updateExpense`.
- [ ] O serviço `src/services/api.ts` expõe os novos métodos de escrita e exclusão.
- [ ] O componente `RecurringPanel.tsx` agrupa e exibe as contas recorrentes separadas por dono.
