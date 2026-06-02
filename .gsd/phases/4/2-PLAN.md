---
phase: 4
plan: 2
wave: 2
---

# Plan 4.2: Polimento Premium, Responsividade e Validação Final

## Objective
Implementar melhorias estéticas premium no design Sicredi Dark Mode, incluindo shimmer effects reais de carregamento, micro-animações de interatividade (hover, feedback visual de envio) e verificar a responsividade mobile e a integridade da build.

## Context
- .gsd/SPEC.md
- src/index.css
- src/components/Dashboard.tsx
- src/components/RecurringPanel.tsx
- src/components/ExpenseForm.tsx
- src/components/SetupScreen.tsx

## Tasks

<task type="auto">
  <name>Polimento Estético CSS e Shimmers de Carregamento</name>
  <files>
    - src/index.css
    - src/components/Dashboard.tsx
    - src/components/RecurringPanel.tsx
  </files>
  <action>
    - Adicionar animações CSS para esqueleto pulsante de carregamento (shimmer keyframes).
    - Criar componentes de loading esqueleto (Shimmer Cards, Shimmer Charts) no CSS para o `Dashboard.tsx` e `RecurringPanel.tsx`.
    - Substituir as mensagens genéricas de "Carregando..." ou "Buscando dados..." por contêineres que usam os esqueletos animados de shimmer para dar sensação de carregamento rápido e premium.
    - Adicionar efeitos de hover vibrantes e suaves (com transição `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`) nos botões de navegação, campos e cartões.
  </action>
  <verify>
    Confirmar a compilação limpa do arquivo CSS e React components:
    `npm run build`
  </verify>
  <done>
    Os estados de carregamento do app utilizam esqueletos com shimmer animado e todos os botões e links reagem a hovers com transições modernas e suaves.
  </done>
</task>

<task type="auto">
  <name>Ajustes de Responsividade Mobile e Validação Geral</name>
  <files>
    - src/index.css
    - src/components/Dashboard.tsx
    - src/App.tsx
  </files>
  <action>
    - Revisar o comportamento de layout em telas pequenas (mobile), garantindo que os gráficos da Recharts não estolem (overflow) e se adaptem ao tamanho da tela.
    - Garantir que o espaçamento, tamanhos de fonte e cartões glassmorphic fiquem confortáveis e não quebrem em telas de celulares (ex: iPhone SE / 375px de largura).
    - Testar o comportamento do app sem conexão ou em caso de falha de token para garantir tratativas amigáveis.
    - Rodar o comando final de build do TypeScript e empacotamento para homologar o código de produção.
  </action>
  <verify>
    Executar a compilação de produção e auditoria estática do TypeScript:
    `npm run build`
  </verify>
  <done>
    A build de produção compila 100% sem erros e avisos, pronta para hospedagem estática gratuita (Vercel). O layout está totalmente adaptável a telas mobile e desktop.
  </done>
</task>

## Success Criteria
- [ ] Os loadings do app usam animação de shimmer (esqueleto pulsante).
- [ ] Os gráficos do Dashboard redimensionam dinamicamente em telas mobile.
- [ ] O comando `npm run build` completa sem nenhum erro de compilação ou do linter.
