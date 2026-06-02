---
phase: 1
plan: 3
wave: 1
---

# Plan 1.3: Serviço de API e Fluxo de Autenticação Completo

## Objective
Criar o módulo de serviço para comunicação HTTP com o Google Apps Script e integrá-lo ao `SetupScreen` e `App.tsx` para completar o fluxo de verificação de conexão, inicialização da planilha e persistência local das credenciais.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Plan 1.2](file:///d:/Develop/financial-manager/.gsd/phases/1/2-PLAN.md)

## Tasks

<task type="auto">
  <name>Criar Serviço de Comunicação HTTP com o Apps Script</name>
  <files>
    <file>src/services/api.ts</file>
  </files>
  <action>
    1. Criar o arquivo `src/services/api.ts`.
    2. Desenvolver a lógica de requisição HTTP usando `fetch`:
       - Toda requisição para o Google Apps Script Web App deve ser do tipo `POST` com `Content-Type: text/plain` (para evitar preflight OPTIONS do CORS que o Apps Script não suporta nativamente).
       - O corpo da requisição deve conter o objeto convertido em string: `{ token: string, action: string, ...args }`.
    3. Implementar as seguintes funções tipadas:
       - `testConnection(url: string, token: string): Promise<boolean>`: envia a ação `ping` e verifica se retorna `{ success: true }`.
       - `initializeSpreadsheet(url: string, token: string): Promise<{ success: boolean; message?: string }>`: envia a ação `initialize` para criar as abas Wesley, Luana e Recorrentes caso não existam.
  </action>
  <verify>npm run build</verify>
  <done>
    O arquivo `src/services/api.ts` deve compilar sem erros de TypeScript e exportar as funções de integração.
  </done>
</task>

<task type="auto">
  <name>Integrar o SetupScreen e Lógica de Persistência no App.tsx</name>
  <files>
    <file>src/App.tsx</file>
    <file>src/components/SetupScreen.tsx</file>
  </files>
  <action>
    1. Atualizar o componente `SetupScreen` para aceitar a função `onConnect(url, token)` como prop, disparando o fluxo de validação da conexão e tratamento de erros (exibir feedback visual em caso de senha errada ou URL inválida).
    2. No `App.tsx`:
       - Tentar ler `finance_app_url` e `finance_secret_token` do `localStorage` na inicialização do app.
       - Se existirem, definir o estado `isAuthenticated` como `true`.
       - Implementar a função `handleConnect(url, token)` que valida a conexão usando o serviço `api.ts`, chama a inicialização da planilha, armazena os dados no `localStorage` em caso de sucesso e altera o estado para autenticado.
       - Implementar botão e função de `Logout` que limpa o `localStorage` e reseta o estado do app, voltando para a tela de Setup inicial.
  </action>
  <verify>npm run build</verify>
  <done>
    A aplicação deve compilar corretamente e a tela de setup deve conseguir armazenar as credenciais validadas no localStorage e desbloquear o acesso interno do aplicativo.
  </done>
</task>

## Success Criteria
- [ ] O arquivo `src/services/api.ts` está criado e configurado para lidar com requisições POST para o Google Apps Script Web App de forma compatível com CORS.
- [ ] A tela de configuração consegue salvar as credenciais no `localStorage` após validação bem-sucedida.
- [ ] A funcionalidade de logout limpa com sucesso as informações locais.
- [ ] O projeto compila com sucesso via `npm run build`.
