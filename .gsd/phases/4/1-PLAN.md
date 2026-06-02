---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Implementação do Dashboard com Recharts

## Objective
Criar o painel visual principal (Dashboard) exibindo o resumo geral do mês, divisão justa de despesas entre o casal (com compensação de gastos compartilhados) e gráficos interativos usando a biblioteca Recharts no estilo Sicredi Dark Mode.

## Context
- .gsd/SPEC.md
- .gsd/phases/4/RESEARCH.md
- src/App.tsx
- src/services/api.ts
- src/index.css

## Tasks

<task type="auto">
  <name>Criar Componente Dashboard</name>
  <files>
    - src/components/Dashboard.tsx
  </files>
  <action>
    - Criar o arquivo `src/components/Dashboard.tsx`.
    - Implementar um seletor de mês idêntico ao do `RecurringPanel.tsx` para sincronizar os dados mensais.
    - Fazer a chamada da API `getMonthData(url, token, selectedMonth)` para carregar os dados.
    - Calcular as seguintes métricas (KPI Cards):
      - **Total Geral do Mês:** Soma de todas as despesas individuais de Wesley + Luana + Compartilhado.
      - **Wesley Total:** Gastos individuais de Wesley + metade dos compartilhados.
      - **Luana Total:** Gastos individuais de Luana + metade dos compartilhados.
      - **Acerto de Contas:** Quem deve a quem e qual o valor (ex: se Luana pagou R$ 100 de compartilhado e Wesley R$ 200, Luana deve R$ 50 a Wesley para equilibrar os compartilhados).
    - Renderizar os seguintes gráficos usando Recharts:
      - **Gráfico de Pizza (PieChart):** Distribuição de gastos agregados por Tag (Alimentação, Transporte, Lazer, etc.) usando cores vibrantes no tema dark.
      - **Gráfico de Barras (BarChart):** Comparação direta de gastos entre Wesley (Individual), Luana (Individual) e Compartilhados.
      - **Gráfico de Área (AreaChart):** Curva de evolução acumulada diária ao longo do mês, mostrando a progressão de gastos.
    - Implementar tooltips customizados para os gráficos usando fundos escuros transparentes (`rgba(10, 10, 10, 0.9)`) e borda verde Sicredi.
  </action>
  <verify>
    Executar build local do TypeScript para checar erros de tipagem no Recharts:
    `npm run build`
  </verify>
  <done>
    O componente `Dashboard.tsx` deve compilar sem erros de TypeScript e agregar corretamente as despesas por tag, dono e dia.
  </done>
</task>

<task type="auto">
  <name>Integrar Dashboard no App Principal</name>
  <files>
    - src/App.tsx
  </files>
  <action>
    - Importar o componente `Dashboard` em `src/App.tsx`.
    - Substituir o placeholder do `activeTab === 'dashboard'` pela renderização do componente `<Dashboard url={appUrl} token={secretToken} currentUser={currentUser} />`.
    - Garantir que a alternância de abas funcione perfeitamente.
  </action>
  <verify>
    Rodar o linter do projeto para confirmar que não existem erros residuais:
    `npm run lint`
  </verify>
  <done>
    O Dashboard dinâmico é exibido por padrão ao entrar no aplicativo e é atualizado quando o usuário altera o mês ou interage com os gráficos.
  </done>
</task>

## Success Criteria
- [ ] Painel do Dashboard exibe os cartões de resumo com cálculos de compensação corretos.
- [ ] Os gráficos de Pizza, Barras e Área do Recharts são renderizados na tela de forma responsiva.
- [ ] O projeto compila com sucesso via `npm run build` e passa no `npm run lint`.
