---
phase: 2
plan: 3
wave: 1
---

# Plan 2.3: Feedback Visual e Integração do Formulário com API

## Objective
Conectar o `ExpenseForm` ao fluxo de dados real do `App.tsx`, implementar estados de envio, feedback de sucesso (toasts ou modais minimalistas Sicredi Green) e reset do formulário após gravação bem-sucedida.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Plan 2.2](file:///d:/Develop/financial-manager/.gsd/phases/2/2-PLAN.md)

## Tasks

<task type="auto">
  <name>Integrar ExpenseForm com Credenciais e Usuário Ativo</name>
  <files>
    <file>src/App.tsx</file>
    <file>src/components/ExpenseForm.tsx</file>
  </files>
  <action>
    1. Atualizar a assinatura do componente `ExpenseForm` para receber as seguintes props:
       - `url`: string
       - `token`: string
       - `currentUser`: 'Wesley' | 'Luana'
    2. No `App.tsx`, passar essas três props para o componente `<ExpenseForm />` montado na aba de lançamentos.
    3. No `ExpenseForm.tsx`, usar `currentUser` para determinar automaticamente o nome da aba destino ao fazer a chamada da API (ex: `const tabName = \`Despesas [\${currentUser}]\``).
  </action>
  <verify>npm run build</verify>
  <done>
    A compilação do TypeScript deve passar sem erros e as credenciais e usuário ativo devem fluir corretamente para o formulário.
  </done>
</task>

<task type="auto">
  <name>Implementar UX de Envio e Alertas de Sucesso</name>
  <files>
    <file>src/components/ExpenseForm.tsx</file>
  </files>
  <action>
    1. No `ExpenseForm.tsx`, gerenciar estados de carregamento (`submitting`) e mensagens de sucesso/erro.
    2. Durante o envio:
       - Desativar todos os inputs e botões para evitar cliques duplos.
       - Alterar o texto do botão de cadastro para "Gravando na planilha..." acompanhado de um indicador visual de carregamento.
    3. Após sucesso da chamada do Apps Script:
       - Limpar os campos do formulário (resetar valor, descrição, manter categoria no padrão ou inicial, resetar checkbox compartilhado/parcelas).
       - Exibir uma notificação flutuante temporária (toast) ou banner verde Sicredi Dark na parte superior/inferior da tela com a mensagem: "Despesa lançada com sucesso!" ou "Parcelas geradas com sucesso!".
       - Desaparecer o aviso de sucesso após 3 segundos automaticamente.
  </action>
  <verify>npm run build</verify>
  <done>
    O formulário deve fornecer feedback instantâneo de gravação, alertar o usuário do sucesso e limpar os campos preparados para a próxima entrada.
  </done>
</task>

## Success Criteria
- [ ] O componente `ExpenseForm` recebe credenciais e usuário ativo via props.
- [ ] O formulário redireciona os dados para a aba correspondente ao usuário ativo.
- [ ] Exibe indicador de progresso e mensagem temporária de sucesso ao cadastrar.
- [ ] Limpa os inputs após envio bem-sucedido.
- [ ] O projeto compila com sucesso via `npm run build`.
