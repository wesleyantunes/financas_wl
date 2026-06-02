---
phase: 3
plan: 3
wave: 1
---

# Plan 3.3: Painel de Contas Pendentes e Confirmação

## Objective
Criar a interface visual da aba "Recorrentes" (`RecurringPanel.tsx`) que lista as contas estimadas, realiza conciliação local com despesas pagas no mês e permite confirmar valores e lançar despesas reais na planilha com um clique.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Plan 3.2](file:///d:/Develop/financial-manager/.gsd/phases/3/2-PLAN.md)
- [Phase 3 Research](file:///d:/Develop/financial-manager/.gsd/phases/3/RESEARCH.md)

## Tasks

<task type="auto">
  <name>Criar Componente de Gerenciamento de Contas Recorrentes</name>
  <files>
    <file>src/components/RecurringPanel.tsx</file>
  </files>
  <action>
    1. Criar o arquivo `src/components/RecurringPanel.tsx` importando `getMonthData`, `addExpenses` e os ícones de Lucide-React.
    2. Desenvolver a lógica principal de carregamento e conciliação:
       - Estado para controlar o mês de consulta (padrão mês/ano atual).
       - Buscar dados com `getMonthData` ao carregar ou mudar o mês.
       - Conciliar as regras com despesas reais: para cada regra em `recurring`, verificar se há correspondência na lista de despesas reais daquele mês (com base na substring da descrição).
       - Dividir a exibição em duas listas separadas para melhor UX:
         * **Pendentes:** Contas estimadas que ainda não foram localizadas nas despesas, mostrando a data de vencimento e o valor estimado, acompanhados de um botão verde "Confirmar".
         * **Pagas:** Contas já confirmadas no mês, exibindo o valor real pago e a data da transação, sinalizadas com badge verde de sucesso.
    3. Desenvolver o Modal de Confirmação:
       - Ao clicar em "Confirmar" de uma conta pendente, abrir um modal glassmorphic.
       - Permitir ajustar o valor (pré-carregado com o estimado) e a data do pagamento.
       - Ao submeter, o app dispara o cadastro da despesa na aba do dono correspondente (Wesley, Luana ou na do usuário ativo caso seja compartilhada) e recarrega os dados locais do mês para atualizar instantaneamente o status para "Pago".
    4. Integrar o componente de cadastro de novas regras `RecurringConfig` dentro deste painel (através de um switch ou modal secundário "Gerenciar Regras").
  </action>
  <verify>npm run build</verify>
  <done>
    O arquivo `RecurringPanel.tsx` deve ser criado, implementando toda a lógica de conciliação por string e modal de confirmação de pagamento, e compilando sem erros.
  </done>
</task>

<task type="auto">
  <name>Integrar o RecurringPanel no App.tsx</name>
  <files>
    <file>src/App.tsx</file>
  </files>
  <action>
    1. Importar `RecurringPanel` no `src/App.tsx`.
    2. Substituir o stub da aba "Recorrentes" (`activeTab === 'recurring'`) pelo componente `<RecurringPanel url={appUrl} token={secretToken} currentUser={currentUser} />`.
  </action>
  <verify>npm run build</verify>
  <done>
    A compilação do Vite deve passar com sucesso e o painel de recorrentes deve ser exibido ao navegar para a aba correspondente no menu inferior.
  </done>
</task>

## Success Criteria
- [ ] O componente `RecurringPanel.tsx` está criado e exibe a lista de despesas divididas entre Pagas e Pendentes.
- [ ] A conciliação local por descrição funciona corretamente.
- [ ] O modal de confirmação permite ajustar o valor antes de commitar na planilha.
- [ ] O painel está integrado em `App.tsx`.
- [ ] O projeto compila com sucesso via `npm run build`.
