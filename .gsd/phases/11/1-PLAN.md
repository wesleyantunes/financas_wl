---
phase: 11
plan: 1
wave: 1
gap_closure: false
---

# Plan 11.1: Importação de Extrato Bancário e Fatura de Cartão (CSV/OFX)

## Objective
Permitir que Wesley e Luana importem um extrato (CSV) ou arquivo OFX exportado do banco, revisem as transações contra o que já está lançado (evitando duplicidade, inclusive com parcelas já expandidas), e confirmem em lote a gravação das novas despesas.

> Este plano cobre CSV/OFX (formatos estruturados, menor risco). A importação de PDF de fatura está no Plan 11.2, que reaproveita a infraestrutura de revisão/dedup construída aqui.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/phases/11/RESEARCH.md
- src/services/api.ts (função `addExpenses`, sem alteração de backend nesta fase)
- src/components/CardInvoicePanel.tsx (padrão de normalização de despesas)
- src/components/ExpenseForm.tsx (lista de tags e meios de pagamento)

## Tasks

<task type="auto">
  <name>Adicionar parser de CSV/OFX e lógica de deduplicação</name>
  <files>
    package.json
    src/utils/importParsers.ts
    src/utils/importDedup.ts
  </files>
  <action>
    - Adicionar dependência `papaparse` (+ `@types/papaparse`) ao `package.json`.
    - Criar `src/utils/importParsers.ts`:
      - `parseCsv(file, columnMapping)`: usa PapaParse para ler o arquivo e mapear colunas (Data/Descrição/Valor) conforme indicado pelo usuário, retornando `{ data, descricao, valor }[]`.
      - `parseOfx(fileContent)`: parser simples de texto plano para extrair blocos `<STMTTRN>` (DTPOSTED, TRNAMT, MEMO/NAME) e retornar no mesmo formato `{ data, descricao, valor }[]`.
    - Criar `src/utils/importDedup.ts`:
      - `matchExisting(imported[], existingExpenses[])`: para cada transação importada, procura despesas existentes (já normalizadas, mesmo formato de `CardInvoicePanel.tsx`) com Data dentro de ±2 dias, Valor exatamente igual, e similaridade de texto na descrição (ex: normalizar case/acentos e comparar substring). Retorna cada item marcado como `'novo' | 'possivel_duplicata'` com a referência do match encontrado.

    AVOID: decidir automaticamente o que é duplicata — a função apenas classifica, a decisão de importar ou não é sempre do usuário na tela de revisão.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    Funções de parsing e deduplicação testáveis isoladamente, sem alteração no Apps Script.
  </done>
</task>

<task type="auto">
  <name>Criar tela de Importação com revisão e gravação em lote</name>
  <files>
    src/components/ImportPanel.tsx
    src/components/App.tsx
  </files>
  <action>
    Criar `ImportPanel.tsx` já estruturado para receber um terceiro modo de importação (PDF, Plan 11.2) além de CSV/OFX — ex: um seletor de tipo de arquivo no topo, com a tabela de revisão e a lógica de dedup/gravação compartilhadas entre os modos:
    - Upload de arquivo (`.csv` ou `.ofx`), com seleção de Dono (Wesley/Luana) para onde as despesas serão lançadas.
    - Para CSV: exibir preview das primeiras linhas e permitir que o usuário indique qual coluna é Data, Descrição e Valor antes de confirmar o parsing.
    - Após parsear, rodar `matchExisting` contra as despesas do dono selecionado no período coberto pelo arquivo (usar `getMonthData` dos meses envolvidos).
    - Exibir tabela de revisão: cada linha com status "Novo" ou "Possível duplicata" (destacado visualmente), checkbox marcado por padrão apenas para "Novo".
    - Permitir atribuir Tag e Meio de Pagamento em lote (aplicar a todas as linhas selecionadas) ou individualmente.
    - Botão "Importar selecionados" monta o array no formato esperado por `addExpenses` e grava em lote na aba do dono selecionado.

    Integrar como nova aba "Importar" em `App.tsx`.
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário consegue subir um extrato CSV ou OFX, revisar duplicidade contra lançamentos existentes e confirmar a importação em lote sem duplicar transações já lançadas manualmente.
  </done>
</task>

## Must-Haves
- [ ] Suporte a upload e parsing de CSV (com mapeamento de colunas) e OFX.
- [ ] Nenhuma gravação automática sem revisão humana — usuário sempre confirma o que será importado.
- [ ] Sinalização de possíveis duplicatas (incluindo contra parcelas já expandidas) antes da gravação.
- [ ] Reaproveitamento da action `addExpenses` existente, sem alteração no Apps Script.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in tests
