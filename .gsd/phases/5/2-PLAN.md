---
phase: 5
plan: 2
wave: 2
---

# Plan 5.2: Painel de Histórico e Validação de Fluxos

## Objective
Criar o componente de Histórico de Despesas com filtros de busca, modais de confirmação para edição e exclusão (com suporte a compras parceladas) e integrá-lo na navegação do aplicativo.

## Context
- .gsd/SPEC.md
- src/components/HistoryPanel.tsx
- src/App.tsx
- src/services/api.ts
- src/index.css

## Tasks

<task type="auto">
  <name>Criar Componente de Histórico de Despesas</name>
  <files>
    - src/components/HistoryPanel.tsx
  </files>
  <action>
    - Criar o arquivo `src/components/HistoryPanel.tsx`.
    - Implementar seletor de mês dinâmico sincronizado.
    - Buscar despesas de Wesley e Luana via `getMonthData`.
    - Renderizar uma lista contendo descrição, valor, data, tag, se é compartilhado e dono original.
    - Adicionar filtros rápidos por Dono (Wesley, Luana, Ambos).
    - Implementar botão de **Excluir** com modal de confirmação:
      - Se a despesa for parcelada (possuir `ID Parcelamento` preenchido), exibir opções adicionais: "Excluir apenas esta parcela" ou "Excluir todas as parcelas futuras deste parcelamento".
      - Fazer chamadas `deleteExpense` apropriadas.
    - Implementar botão de **Editar** com modal/formulário preenchido:
      - Se a despesa for parcelada, perguntar se deseja atualizar apenas esta parcela ou todas as parcelas futuras vinculadas.
      - Chamar `updateExpense` apropriado.
  </action>
  <verify>
    Executar a compilação do TypeScript para conferir ausência de erros:
    `npm run build`
  </verify>
  <done>
    O componente de Histórico lista todas as despesas lançadas no mês, permitindo edição e exclusão individual ou em lote de parcelados.
  </done>
</task>

<task type="auto">
  <name>Integrar Histórico na Navegação Principal</name>
  <files>
    - src/App.tsx
    - src/index.css
  </files>
  <action>
    - No `App.tsx`, adicionar a nova aba `'history'` no estado `activeTab`.
    - Adicionar o botão "Histórico" (usando o ícone `History` da `lucide-react`) na barra de navegação inferior (Mobile Navigation) e no cabeçalho se aplicável.
    - Renderizar o componente `<HistoryPanel url={appUrl} token={secretToken} currentUser={currentUser} />` no painel principal quando a aba estiver ativa.
    - Ajustar estilos CSS na barra de navegação inferior para acomodar 4 botões de maneira uniforme e responsiva.
  </action>
  <verify>
    Executar a build final para atestar que o layout não quebra em aparelhos mobile:
    `npm run build`
  </verify>
  <done>
    O menu do app exibe o botão Histórico de forma responsiva, permitindo navegar e gerenciar as despesas com transições fluidas.
  </done>
</task>

<task type="auto">
  <name>Validação e Homologação Final</name>
  <files>
    - src/components/HistoryPanel.tsx
    - src/components/Dashboard.tsx
    - src/components/RecurringPanel.tsx
  </files>
  <action>
    - Validar que o app compila 100% livre de erros TypeScript.
    - Executar o linter estático e certificar que todos os arquivos estejam em conformidade (sem uso de explicit any, sem hooks obsoletos).
  </action>
  <verify>
    Rodar a compilação e verificação de linting:
    `npm run build` e `npm run lint`
  </verify>
  <done>
    O projeto compila com sucesso em modo de produção e passa no linter sem nenhum aviso de erro, assegurando estabilidade do aplicativo.
  </done>
</task>

## Success Criteria
- [ ] O componente `HistoryPanel.tsx` exibe as despesas do mês por usuário com filtros apropriados.
- [ ] A exclusão e edição de transações normais e parceladas reflete diretamente no Google Sheets.
- [ ] A aba "Histórico" está integrada na navegação responsiva do rodapé.
- [ ] O projeto compila com sucesso via `npm run build` e passa no `npm run lint`.
