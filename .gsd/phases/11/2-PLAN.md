---
phase: 11
plan: 2
wave: 2
gap_closure: false
---

# Plan 11.2: Importação de Fatura de Cartão em PDF

## Objective
Permitir que Wesley e Luana importem diretamente o PDF da fatura do cartão (baixado do banco), extraindo as transações via reconhecimento heurístico de linha (data + descrição + valor) e reaproveitando a infraestrutura de revisão/deduplicação/gravação já construída no Plan 11.1 — com uma camada extra de edição manual, já que a extração de PDF é menos confiável que CSV/OFX estruturado.

> **Decisão registrada (DEC-007):** PDF entra no escopo do projeto, sem template por banco — heurística genérica + revisão manual obrigatória de cada linha extraída antes de qualquer match de duplicidade ou gravação.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/phases/11/RESEARCH.md
- .gsd/DECISIONS.md (DEC-007)
- .gsd/phases/11/1-PLAN.md (infraestrutura de dedup/revisão reaproveitada)
- src/utils/importParsers.ts
- src/utils/importDedup.ts
- src/components/ImportPanel.tsx

## Tasks

<task type="auto">
  <name>Adicionar extração de texto de PDF e heurística de transação</name>
  <files>
    package.json
    src/utils/importParsers.ts
  </files>
  <action>
    - Adicionar dependência `pdfjs-dist` ao `package.json`.
    - Em `src/utils/importParsers.ts`, criar `parsePdfFatura(file)`:
      1. Extrair todos os itens de texto de cada página via `pdf.js` (`getTextContent`), incluindo suas coordenadas.
      2. Reconstruir linhas visuais agrupando itens por coordenada Y aproximada (mesma linha da fatura), ordenando por X dentro de cada linha.
      3. Para cada linha reconstruída, aplicar um regex genérico de transação: data no formato `DD/MM` (ou `DD/MM/YYYY`) no início, descrição no meio, valor monetário (com vírgula decimal, opcionalmente precedido de `R$`) no fim. Descartar linhas que não casarem com o padrão.
      4. Tentar localizar uma linha de "Total da fatura" (ou variações comuns como "Total desta fatura", "Valor total") para uso posterior como conferência de soma.
      5. Retornar `{ transacoes: { data, descricao, valor }[], totalDetectado: number | null }`.

    AVOID: tentar suportar layouts específicos por banco (Nubank, Itaú, etc.) nesta fase — manter a heurística genérica e deixar a correção para a revisão manual do usuário.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    Função `parsePdfFatura` extrai uma lista de transações candidatas e, quando encontrado, o total declarado da fatura, a partir de um PDF real de fatura.
  </done>
</task>

<task type="auto">
  <name>Adicionar modo PDF ao ImportPanel com revisão manual reforçada</name>
  <files>
    src/components/ImportPanel.tsx
  </files>
  <action>
    - Adicionar PDF como terceiro tipo de arquivo aceito no upload do `ImportPanel.tsx`.
    - Após `parsePdfFatura`, exibir um banner de aviso: "Extração de PDF pode conter erros — revise cada linha antes de confirmar".
    - Renderizar a lista de transações extraídas em uma tabela TOTALMENTE EDITÁVEL (data/descrição/valor editáveis inline, com opção de excluir uma linha mal extraída ou adicionar uma linha manualmente) — diferente do fluxo CSV/OFX, aqui a estrutura não é confiável por padrão.
    - Se `totalDetectado` foi encontrado, exibir a soma das transações confirmadas ao lado do total da fatura e destacar visualmente se houver divergência (ex: "Soma das transações: R$X — Total da fatura: R$Y — confira antes de importar").
    - Após a correção manual, seguir o MESMO fluxo já existente do Plan 11.1: rodar `matchExisting` contra despesas já lançadas, marcar Novo/Possível duplicata, permitir atribuição de Tag/Meio de Pagamento em lote, e gravar via `addExpenses`.
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    Usuário consegue subir o PDF da fatura, corrigir manualmente a extração quando necessário, conferir a soma contra o total da fatura, e importar apenas as transações revisadas e confirmadas.
  </done>
</task>

## Must-Haves
- [ ] Extração de transações de um PDF de fatura real via heurística de linha (data + descrição + valor), sem depender de template por banco.
- [ ] Tabela de revisão totalmente editável antes de qualquer gravação — a extração de PDF nunca é aplicada automaticamente sem revisão.
- [ ] Conferência de soma contra o total da fatura quando esse valor for identificável no PDF.
- [ ] Reaproveitamento do fluxo de deduplicação e gravação já construído no Plan 11.1 (sem duplicar lógica).

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in tests
