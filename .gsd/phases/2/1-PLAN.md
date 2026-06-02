---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Interface do Formulário de Lançamento

## Objective
Criar a interface visual do formulário de lançamento de despesas (`ExpenseForm.tsx`) no estilo Sicredi Dark Mode, permitindo entrada de transações comuns e fornecendo suporte dinâmico para compras parceladas.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [Phase 2 Research](file:///d:/Develop/financial-manager/.gsd/phases/2/RESEARCH.md)

## Tasks

<task type="auto">
  <name>Criar Componente ExpenseForm (React UI)</name>
  <files>
    <file>src/components/ExpenseForm.tsx</file>
  </files>
  <action>
    1. Criar o arquivo `src/components/ExpenseForm.tsx`.
    2. O componente deve conter:
       - Inputs para Descrição, Valor em R$ (com máscara ou apenas numérico decimal) e Data.
       - Seletor de Categoria/Tag contendo as tags padrões (Alimentação, Lazer, Transporte, Saúde, Moradia, Educação, Supermercado, Outros).
       - Checkbox estilizado para "Despesa Compartilhada" (se ativado, o gasto é dividido pelo casal).
       - Switch ou Checkbox "Compra Parcelada". Quando ativado, revela dinamicamente dois campos adicionais:
         * Número de Parcelas (input numérico, mínimo 2).
         * Frequência/Intervalo (geralmente mensal, então exibiremos a projeção inicial).
    3. Aplicar estilo Sicredi Dark: Cartão glassmorphic com bordas arredondadas, inputs com foco em verde Sicredi, e botões expressivos de "Limpar" e "Cadastrar".
    4. Adicionar validação de formulário client-side (impedir submissão com campos vazios ou valores negativos).
  </action>
  <verify>npm run build</verify>
  <done>
    O arquivo `src/components/ExpenseForm.tsx` deve compilar sem erros de TypeScript e conter a interface de lançamento completa com toggles de parcelamento.
  </done>
</task>

<task type="auto">
  <name>Integrar o ExpenseForm no Componente Principal App.tsx</name>
  <files>
    <file>src/App.tsx</file>
  </files>
  <action>
    1. Importar `ExpenseForm` no `src/App.tsx`.
    2. Substituir o stub da aba "Lançar" (`activeTab === 'new-expense'`) pelo componente `<ExpenseForm />` recém-criado.
    3. Passar como prop as credenciais básicas ou uma função callback para posterior processamento do envio das transações.
  </action>
  <verify>npm run build</verify>
  <done>
    A compilação do Vite deve rodar com sucesso e o formulário de despesas deve ser exibido ao navegar para a aba "Lançar".
  </done>
</task>

## Success Criteria
- [ ] O arquivo `ExpenseForm.tsx` está criado com todas as validações de formulário.
- [ ] O toggle de compra parcelada exibe dinamicamente os campos de parcelamento.
- [ ] O formulário está integrado na navegação do `src/App.tsx`.
- [ ] O projeto compila com sucesso via `npm run build`.
