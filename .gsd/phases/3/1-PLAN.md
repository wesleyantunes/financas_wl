---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Cadastro de Regras Recorrentes

## Objective
Criar o endpoint no Google Apps Script para adicionar regras recorrentes e desenvolver a interface visual para cadastrar e listar estas regras configuradas (aba `Recorrentes` da planilha).

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Phase 3 Research](file:///d:/Develop/financial-manager/.gsd/phases/3/RESEARCH.md)

## Tasks

<task type="auto">
  <name>Atualizar Apps Script com addRecurringRule</name>
  <files>
    <file>scripts/google-apps-script.js</file>
  </files>
  <action>
    1. Editar `scripts/google-apps-script.js` para incluir suporte à ação `addRecurringRule` dentro do `doPost(e)`.
    2. A ação `addRecurringRule` deve:
       - Receber no payload os dados da nova regra: `[id, descricao, valorEstimado, diaVencimento, tipo, dono, ativo]`.
       - Obter a aba `Recorrentes` da planilha.
       - Inserir a nova linha: `sheet.appendRow([id, descricao, valorEstimado, diaVencimento, tipo, dono, ativo])`.
       - Retornar `{ success: true }`.
  </action>
  <verify>test-path scripts/google-apps-script.js</verify>
  <done>
    O arquivo `google-apps-script.js` deve conter o bloco de lógica para lidar com o cadastro de regras recorrentes.
  </done>
</task>

<task type="auto">
  <name>Criar Componente de Cadastro de Regras Recorrentes</name>
  <files>
    <file>src/components/RecurringConfig.tsx</file>
    <file>src/services/api.ts</file>
  </files>
  <action>
    1. No `src/services/api.ts`, expor a função `addRecurringRule(url: string, token: string, rule: any[]): Promise<any>` para chamar o Apps Script.
    2. Criar o arquivo `src/components/RecurringConfig.tsx`.
    3. Desenvolver a interface (estilo Sicredi Dark glassmorphic) contendo:
       - Formulário simples para adicionar regras: descrição, valor estimado, dia de vencimento (1-31), tipo (dropdown: Fixo / Variável) e dono (dropdown: Wesley / Luana / Compartilhado).
       - Botão de submissão conectado à API e feedback visual de carregamento.
       - Validação client-side para evitar dias inválidos ou valores menores que zero.
  </action>
  <verify>npm run build</verify>
  <done>
    O componente `RecurringConfig.tsx` deve compilar sem erros de TypeScript e mapear o formulário de cadastro de regras.
  </done>
</task>

## Success Criteria
- [ ] O script `google-apps-script.js` suporta cadastro de regras recorrentes na aba correspondente.
- [ ] O componente `RecurringConfig.tsx` está pronto e validando as entradas do formulário.
- [ ] O projeto compila com sucesso via `npm run build`.
