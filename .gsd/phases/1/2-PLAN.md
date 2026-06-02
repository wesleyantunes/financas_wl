---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Código do Apps Script e Tela de Login/Configuração

## Objective
Criar o código de referência do Google Apps Script (que rodará na planilha do Google) e implementar a interface do usuário para inserção da URL e da chave secreta (Token Secreto) de acesso no frontend, salvando-as no `localStorage` após validação.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Plan 1.1](file:///d:/Develop/financial-manager/.gsd/phases/1/1-PLAN.md)

## Tasks

<task type="auto">
  <name>Desenvolver Código do Google Apps Script (API da Planilha)</name>
  <files>
    <file>scripts/google-apps-script.js</file>
  </files>
  <action>
    1. Criar o arquivo `scripts/google-apps-script.js` contendo o código Javascript que o usuário colará no Google Apps Script de sua planilha.
    2. O script deve conter:
       - Configuração de `SECRET_TOKEN` (senha a ser definida pelo usuário).
       - Função `doPost(e)` e `doGet(e)` para capturar requisições HTTP do frontend.
       - Validação do token de segurança enviado no payload ou cabeçalhos. Se inválido, retornar JSON `{ success: false, error: 'Unauthorized' }`.
       - Lógica para ação `ping` que apenas retorna `{ success: true, message: 'Connected' }` para testar as credenciais.
       - Lógica para ação `initialize` que verifica a existência das abas `Despesas [Wesley]`, `Despesas [Luana]` e `Recorrentes`. Se não existirem, o script as criará com as colunas corretas pré-definidas no `SPEC.md` e preencherá as tags padrões na aba de configurações/recorrentes.
  </action>
  <verify>test-path scripts/google-apps-script.js</verify>
  <done>
    O arquivo `scripts/google-apps-script.js` deve ser criado contendo as funções doAppsScript necessárias para integração.
  </done>
</task>

<task type="auto">
  <name>Criar Tela de Login e Configuração (SetupScreen)</name>
  <files>
    <file>src/components/SetupScreen.tsx</file>
  </files>
  <action>
    1. Criar o componente `SetupScreen.tsx` em `src/components/SetupScreen.tsx`.
    2. A tela deve apresentar um formulário de login estilizado no modo Sicredi Dark:
       - Título e descrição sobre controle de finanças do casal.
       - Input para o link do Web App do Google Apps Script.
       - Input para a senha secreta (Token Secreto) com opção de ocultar/mostrar a senha.
       - Botão "Conectar Planilha" com animação de loading ao clicar.
    3. Incluir um botão expansível de "Ajuda / Passo a Passo" que exibe de forma extremamente didática como o usuário pode obter as credenciais:
       - Passo 1: Crie uma planilha vazia no Google Drive.
       - Passo 2: Clique em "Extensões" -> "Apps Script".
       - Passo 3: Apague o código padrão e cole o código contido no arquivo `scripts/google-apps-script.js`.
       - Passo 4: Altere a senha no topo do script e clique em "Implantar" -> "Nova implantação".
       - Passo 5: Escolha o tipo "App da Web", execute como "Eu" e defina acesso para "Qualquer pessoa". Copie a URL gerada e cole no app.
  </action>
  <verify>npm run build</verify>
  <done>
    O componente `SetupScreen` deve ser criado e compilar sem erros de TypeScript, contendo o formulário e as instruções visuais.
  </done>
</task>

## Success Criteria
- [ ] O arquivo `scripts/google-apps-script.js` está criado com toda a lógica de validação de token e inicialização das abas da planilha.
- [ ] O componente `SetupScreen.tsx` está pronto, permitindo inserção da URL e senha de segurança de forma intuitiva e com instruções inclusas.
- [ ] A aplicação compila corretamente via `npm run build`.
