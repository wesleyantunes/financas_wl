# Summary Plan 7.1: Lançamento e Gestão de Recebimentos

## Tasks Completed

- [x] **Atualização Google Apps Script e API React**
  - Estendido a ação `initialize` para incluir a criação automática das abas `Recebimentos [Wesley]` e `Recebimentos [Luana]`, com formatação de cabeçalho Sicredi.
  - Estendido a ação `getMonthData` para ler e filtrar transações de receita mensal das duas novas abas.
  - Atualizado os tipos e a chamada do React Client em `src/services/api.ts` para carregar `wesleyReceivables` e `luanaReceivables`.
- [x] **Formulário Unificado no ExpenseForm**
  - Implementado alternador "Despesa / Recebimento" no cabeçalho do formulário, em estilo Sicredi Neon Green.
  - Condicionalmente ocultado os toggles de compartilhamento e parcelamento se a entrada selecionada for receita.
  - Carregado a lista de tags de receitas (`['Salário', 'Freelance', 'Rendimentos', 'Outros']`) e persistido os dados no formato adequado para as novas abas.
- [x] **Dashboard e Histórico de Recebimentos**
  - Calculado o total de receitas individuais e consolidado do casal.
  - Adicionado cartões de Poupança Líquida (Wesley: Receitas - Fair Share, Luana: Receitas - Fair Share, Casal: Receitas Totais - Despesas Totais) no topo do Dashboard.
  - Adicionado controle de abas "Despesas" e "Recebimentos" no `HistoryPanel`, adaptando a listagem, contagens de soma de stats e editores/exclusão individuais para usar as tabelas corretas.

## Verification Results
- `npm run lint` validado sem erros ou alertas de formatação.
- `npm run build` gerou o build estático de produção com êxito.
