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
1. CSV + OFX apenas: formatos estruturados, exportáveis pela maioria dos bancos/apps brasileiros, parsing simples e confiável 100% no cliente.
2. CSV + OFX + PDF de fatura: layout varia por banco/cartão, exige extração de texto (`pdf.js`) e heurísticas de reconstrução de linha — risco maior de erro silencioso de parsing do que formatos estruturados.

**Decision:** (DEC-007) Incluir PDF de fatura no escopo, a pedido do usuário, mas isolado em um plano próprio (Plan 11.2) SEM template por banco — uma heurística genérica (data + descrição + valor por linha) com revisão/edição manual OBRIGATÓRIA de cada linha extraída antes do match de duplicidade, e checagem de soma total contra o valor total da fatura quando encontrado no PDF (sanity check).
**Confidence:** Medium — parsing de PDF é inerentemente menos confiável que CSV/OFX estruturado; a confiança vem da camada de revisão manual, não da extração em si.

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

### Extração de texto de PDF
`pdf.js` (`getTextContent`) retorna itens de texto com posição (x, y), não linhas prontas — é preciso agrupar itens pela coordenada Y (mesma linha visual) para reconstruir cada linha da fatura antes de aplicar o regex de transação (`data + descrição + valor`). Faturas de cartão brasileiras costumam ter uma linha de "Total desta fatura" ou similar, útil como conferência de soma após a extração.

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
| pdfjs-dist | ^4.x | Extração de texto de PDF de fatura no navegador (Plan 11.2) |

Parser de OFX: implementação própria simples (formato é texto plano com tags `<STMTTRN>`), sem necessidade de dependência externa.

## Risks
- **Formato de CSV varia por banco:** mitigar com uma tela de mapeamento de colunas (usuário indica qual coluna é Data/Descrição/Valor) em vez de assumir um layout fixo.
- **Falsos negativos na deduplicação:** preferir sinalizar demais (mais "possíveis duplicatas") a sinalizar de menos, já que a decisão final é sempre do usuário.
- **Extração de PDF pode errar silenciosamente** (linha mal reconstruída, valor cortado, layout de banco não previsto): mitigar com (a) tabela de revisão editável linha a linha antes do match de duplicidade — nunca confiar 100% no parser, e (b) conferência automática da soma extraída contra o "Total da fatura" quando esse valor for identificável no PDF, alertando o usuário em caso de divergência.

## Recommendations for Planning
1. Plan 11.1: CSV + OFX, com mapeamento manual de colunas para CSV — menor risco, entrega primeiro.
2. Plan 11.2: PDF de fatura, reaproveitando a infraestrutura de revisão/dedup do Plan 11.1, com camada extra de edição manual das linhas extraídas (não confiar apenas na extração automática) e checagem de soma total.
3. Revisão humana obrigatória antes de qualquer gravação em lote, em ambos os planos.
