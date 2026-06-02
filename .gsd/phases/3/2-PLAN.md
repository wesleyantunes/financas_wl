---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: API de Leitura Unificada (getMonthData)

## Objective
Desenvolver a ação `getMonthData` no Google Apps Script para ler todas as despesas mensais e regras recorrentes de uma só vez, e criar o serviço correspondente no frontend React para consumo dos dados.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Plan 3.1](file:///d:/Develop/financial-manager/.gsd/phases/3/1-PLAN.md)
- [Phase 3 Research](file:///d:/Develop/financial-manager/.gsd/phases/3/RESEARCH.md)

## Tasks

<task type="auto">
  <name>Implementar getMonthData no google-apps-script.js</name>
  <files>
    <file>scripts/google-apps-script.js</file>
  </files>
  <action>
    1. Editar `scripts/google-apps-script.js` e adicionar a ação `getMonthData` no `doPost(e)`.
    2. A ação `getMonthData` deve:
       - Receber no payload a string `month` (formato `AAAA-MM`).
       - Obter os dados da aba `Recorrentes` (todos os registros excluindo a linha de cabeçalho).
       - Obter os dados das abas `Despesas [Wesley]` e `Despesas [Luana]`.
       - Filtrar os registros de despesas mantendo apenas aqueles cuja coluna de data (coluna index 1) se inicia com a string do mês selecionado (ex: `dateStr.indexOf(month) === 0`).
       - Mapear os arrays bidimensionais lidos da planilha em arrays de objetos estruturados com chaves descritivas para simplificar a manipulação no frontend.
       - Retornar `{ success: true, recurring: [...], wesleyExpenses: [...], luanaExpenses: [...] }`.
  </action>
  <verify>test-path scripts/google-apps-script.js</verify>
  <done>
    O arquivo `google-apps-script.js` deve conter o método getMonthData implementado com leitura de dados e filtros de data adequados.
  </done>
</task>

<task type="auto">
  <name>Mapear Serviço getMonthData no Frontend React</name>
  <files>
    <file>src/services/api.ts</file>
  </files>
  <action>
    1. Editar `src/services/api.ts` e exportar a função:
       `getMonthData(url: string, token: string, month: string): Promise<any>`
    2. Esta função deve invocar o helper `request` passando as credenciais e a ação `getMonthData` com o parâmetro `month`.
    3. Garantir a tipagem correta de retorno contendo as listas unificadas de regras e despesas de ambos os parceiros.
  </action>
  <verify>npm run build</verify>
  <done>
    A compilação do Vite deve passar com sucesso e a função de leitura unificada deve estar disponível para integração nos componentes.
  </done>
</task>

## Success Criteria
- [ ] A API do Apps Script possui o suporte para consultar dados de despesas por período de mês.
- [ ] O serviço `getMonthData` em `api.ts` está mapeado e tipado.
- [ ] O projeto compila sem erros de tipagem TypeScript.
