---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Autenticação via Hash e Polimento Visual

## Objective
Melhorar a experiência de autenticação em múltiplos dispositivos através de carregamento de credenciais via hash na URL, otimizar a lógica de conciliação de contas recorrentes para garantir exibição de valores reais sem duplicidades, e personalizar a identidade visual da aba do navegador (título e favicon).

## Context
- .gsd/SPEC.md
- src/App.tsx
- src/components/RecurringPanel.tsx
- index.html
- public/favicon.svg

## Tasks

<task type="auto">
  <name>Autenticação via Hash e Link de Acesso Rápido</name>
  <files>
    - src/App.tsx
  </files>
  <action>
    - Na inicialização das credenciais em `src/App.tsx`, implementar a leitura dos parâmetros `url` e `token` diretamente a partir do hash da URL (`#url=...&token=...`).
    - Persistir as credenciais detectadas no `localStorage`, definindo a sessão como autenticada.
    - Limpar o hash da URL utilizando `window.history.replaceState` para evitar vazamento de credenciais ao compartilhar o link.
    - Adicionar um botão "Link de Acesso" no cabeçalho (Header) com o ícone `Link` da lucide-react para copiar a URL formatada com o hash de credenciais para a área de transferência.
  </action>
  <verify>
    Confirmar a compilação do arquivo `src/App.tsx` sem erros de tipagem.
  </verify>
  <done>
    O aplicativo suporta login automático por meio de hash na URL e permite copiar o link de acesso rápido configurado no cabeçalho.
  </done>
</task>

<task type="auto">
  <name>Corrigir Lógica de Conciliação de Contas Recorrentes</name>
  <files>
    - src/components/RecurringPanel.tsx
  </files>
  <action>
    - No `RecurringPanel.tsx`, alterar a lógica de cruzamento de regras com gastos para ignorar regras com descrições em branco.
    - Implementar um mecanismo de controle de IDs únicos (`matchedExpenseIds` do tipo `Set`) para assegurar que uma transação da planilha seja vinculada a apenas uma única conta recorrente.
    - Otimizar a leitura da propriedade de valor das despesas de forma robusta e tolerante a falhas (considerando chaves `Valor` e `valor`).
  </action>
  <verify>
    Confirmar o build correto do componente React e passagem sem erros no ESLint.
  </verify>
  <done>
    O painel de contas recorrentes agrupa e concilia as despesas sem duplicar valores e sem falsos positivos.
  </done>
</task>

<task type="auto">
  <name>Personalizar Favicon e Título da Aba do Navegador</name>
  <files>
    - index.html
    - public/favicon.svg
  </files>
  <action>
    - Atualizar o título do projeto em `index.html` para "Finanças WL".
    - Substituir o arquivo SVG `public/favicon.svg` por um ícone estilizado de carteira nas cores da paleta Sicredi Dark Mode (fundo `#0b120c` e contornos `#00db75`).
  </action>
  <verify>
    Verificar que o arquivo index.html e favicon.svg foram alterados.
  </verify>
  <done>
    A aba do navegador apresenta o título "Finanças WL" e o ícone de carteira em Sicredi Green.
  </done>
</task>

## Success Criteria
- [x] Login via URL hash com limpeza de endereço implementado.
* [x] Botão de link de acesso rápido presente no Header.
- [x] Lógica de conciliação do RecurringPanel sem falsos positivos e sem duplicidades.
- [x] Ícone de favicon e título da aba customizados.
