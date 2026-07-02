---
phase: 11
researched_at: 2026-07-02
discovery_level: 2
---

# Phase 11 Research

## Objective
Definir a abordagem para importar extratos bancários e faturas de cartão, evitando duplicidade com lançamentos já feitos manualmente (incluindo parcelas já expandidas automaticamente pela Phase 2).

## Discovery Level
**Level 2** — Avaliação de formatos de arquivo viáveis para parsing 100% client-side (mantendo a constraint "Sem Servidor Backend" do SPEC) e de estratégia de deduplicação contra dados já existentes no Sheets.

## Key Decisions

### Decision 1: Formatos de arquivo suportados na v1
**Question:** Suportar CSV, OFX e PDF de fatura desde o início?
**Options Considered:**
1. CSV + OFX: formatos estruturados, exportáveis pela maioria dos bancos/apps brasileiros, parsing simples e confiável 100% no cliente.
2. PDF de fatura: layout varia por banco/cartão, exige extração de texto (`pdf.js`) e regras específicas por template — alto risco de quebrar silenciosamente quando o banco muda o layout.

**Decision:** v1 cobre apenas CSV e OFX. PDF de fatura fica como extensão futura (fora desta fase), documentado como Non-Goal explícito da Phase 11.
**Confidence:** High

### Decision 2: Onde processar o arquivo
**Question:** Enviar o arquivo para o Apps Script processar, ou parsear no navegador?
**Options Considered:**
1. Enviar para o Apps Script: reaproveita paridade com o resto do backend, mas arquivos maiores esbarram em limites de payload do Apps Script Web App e no limite de execução (CON-01).
2. Parsear 100% no navegador (client-side) com uma lib leve (ex: PapaParse para CSV; parser OFX simples, já que o formato é texto plano estruturado) e só enviar as linhas já confirmadas via `addExpenses` (action que já existe).

**Decision:** Opção 2 — mantém a constraint "Sem Servidor Backend / dados nunca saem do ecossistema do usuário" do SPEC, e reaproveita a action `addExpenses` já existente sem mudança no Apps Script.
**Confidence:** High

### Decision 3: Estratégia de deduplicação
**Question:** Como evitar importar de novo uma transação já lançada manualmente (ex: uma parcela que já foi criada automaticamente na Phase 2)?
**Options Considered:**
1. Match exato por data+valor: simples, mas falha quando a descrição do banco difere ligeiramente da descrição usada no lançamento manual (mesma transação, datas podem variar ±1-2 dias entre lançamento e compensação bancária).
2. Match difuso (fuzzy) por Data (±2 dias) + Valor exato + similaridade de texto na Descrição, com o resultado apresentado ao usuário para confirmação manual antes de gravar.

**Decision:** Opção 2, mas SEMPRE com revisão humana antes de gravar — o app nunca decide sozinho o que é duplicata, apenas sinaliza "Possível duplicata" para o usuário decidir.
**Confidence:** High

## Findings

### Escopo do SPEC.md (Non-Goals)
O SPEC.md lista como Non-Goal "Sincronização automática com contas bancárias (Open Finance/Open Banking)". A importação manual de arquivo (usuário exporta do app do banco e faz upload) **não** é sincronização automática — não há credenciais bancárias envolvidas nem conexão a APIs de terceiros. Ainda assim, este limite deve ficar explícito para não expandir o escopo silenciosamente em direção a Open Finance.

### Reaproveitamento de infraestrutura existente
`addExpenses(tabName, expenses[][])` já aceita inserção em lote — a importação só precisa montar o array no formato esperado, sem exigir nova action no Apps Script.

## Patterns to Follow
- Reaproveitar `addExpenses` para a gravação final, mantendo o Apps Script sem alterações nesta fase.
- Seguir o padrão de normalização de despesas já usado em `CardInvoicePanel.tsx` para comparar transações importadas com as existentes.

## Anti-Patterns to Avoid
- Não importar automaticamente sem revisão humana — mesmo com alta confiança de match, duplicidade financeira é um erro caro.
- Não tentar suportar todos os bancos do Brasil no parser CSV — assumir um formato genérico configurável (mapeamento de colunas) em vez de templates por banco.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| papaparse | ^5.x | Parsing de CSV genérico no navegador |
| @types/papaparse | ^5.x | Tipos TypeScript |

Parser de OFX: implementação própria simples (formato é texto plano com tags `<STMTTRN>`), sem necessidade de dependência externa.

## Risks
- **Formato de CSV varia por banco:** mitigar com uma tela de mapeamento de colunas (usuário indica qual coluna é Data/Descrição/Valor) em vez de assumir um layout fixo.
- **Falsos negativos na deduplicação:** preferir sinalizar demais (mais "possíveis duplicatas") a sinalizar de menos, já que a decisão final é sempre do usuário.

## Recommendations for Planning
1. Escopo da v1: CSV + OFX apenas, com mapeamento manual de colunas para CSV.
2. Revisão humana obrigatória antes de qualquer gravação em lote.
3. PDF de fatura documentado como fora de escopo desta fase (não um Non-Goal permanente do projeto, apenas desta fase).
