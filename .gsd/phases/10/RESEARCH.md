---
phase: 10
researched_at: 2026-07-02
discovery_level: 2
---

# Phase 10 Research

## Objective
Definir a modelagem de dados e a arquitetura de 4 features de planejamento/análise financeira sobre a base já existente (Sheets como DB, Apps Script como API única): Orçamento por Categoria, Previsão de Saldo Futuro, Comparativo Mês a Mês/Ano a Ano e Divisão de Despesas Compartilhadas (Acerto de Contas).

## Discovery Level
**Level 2** — Levantamento do schema atual (`Despesas [Wesley/Luana]`, `Recebimentos [Wesley/Luana]`, `Recorrentes`, `Recorrentes Recebimentos`), tipos em `src/services/api.ts` e lógica de reconciliação de cartão cruzado (Phase 8) para desenhar as extensões sem quebrar compatibilidade.

## Key Decisions

### Decision 1: Onde persistir orçamentos e acertos
**Question:** Criar novas abas no Sheets ou guardar configuração em localStorage?
**Options Considered:**
1. localStorage: rápido, mas não sincroniza entre o celular de Wesley e o de Luana (quebra o modelo "fonte única de verdade" do projeto).
2. Novas abas no Sheets (`Orcamentos`, `Acertos`): consistente com o padrão de `Recorrentes`, sincroniza automaticamente entre os dois usuários.

**Decision:** Novas abas no Sheets, seguindo o mesmo padrão de inicialização de `Recorrentes` (CON-02 exige que toda modelagem caiba em tabelas planas do Sheets).
**Confidence:** High

### Decision 2: Como evitar payloads grandes no Comparativo/Previsão
**Question:** Buscar linhas cruas de N meses (múltiplos `getMonthData`) ou agregar no backend?
**Options Considered:**
1. N chamadas de `getMonthData` (uma por mês) e agregar no cliente: simples, mas caro em rede e lento em 12 meses.
2. Nova action `getMonthlySummaries(meses[])` que soma no Apps Script e retorna só totais: payload mínimo, mas requer lógica nova no `.gs`.

**Decision:** Nova action agregada no Apps Script (opção 2), respeitando CON-01 (limite de 6 min de execução do Apps Script) ao evitar reprocessar dados desnecessariamente no cliente.
**Confidence:** High

### Decision 3: Cálculo de "quem pagou de fato" no Acerto de Contas
**Question:** Como determinar o valor pago por cada pessoa em despesas compartilhadas, dado que cartões cruzados já existem (Phase 8)?
**Options Considered:**
1. Somar por aba de origem (`Despesas [Wesley]` vs `[Luana]`): ignora cartão cruzado, gera acerto incorreto.
2. Somar por `Meio de Pagamento` (mesma lógica de atribuição já usada no Dashboard para `wesleyPaid`/`luanaPaid`): reaproveita lógica validada na Phase 8.

**Decision:** Opção 2 — reaproveitar a lógica de atribuição por Meio de Pagamento já existente no `Dashboard.tsx`.
**Confidence:** High

## Findings

### Schema atual relevante
- `Despesas [Wesley/Luana]`: `ID, Data, Descrição, Valor, Tag, Compartilhado, ID Parcelamento, Meio de Pagamento`.
- `Recorrentes`: `ID, Descrição, Valor Estimado, Dia Vencimento, Tipo (Fixo/Variável), Dono, Ativo`.
- Tags são strings fixas hardcoded nos componentes (`ExpenseForm.tsx`), sem aba própria — orçamento deve casar por nome de tag, não por ID.

### Reconciliação de cartão cruzado (Phase 8)
Despesa lançada na aba de um dono pode ter `Meio de Pagamento = "Cartão <outro dono>"`. O Dashboard já redireciona esses valores na soma de "quem pagou". O Acerto de Contas deve reaproveitar essa mesma regra para não duplicar lógica.

## Patterns to Follow
- Novas abas seguem o padrão de `initialize()` do Apps Script: criação automática se não existir, cabeçalho estilizado verde Sicredi.
- Novas actions seguem o padrão `{ token, action, ...args }` do `request<T>()` em `api.ts`.
- Cálculos de projeção reaproveitam a regra "recorrente sem lançamento correspondente no mês = pendente" já usada na Previsão de Saldo da Phase 8.

## Anti-Patterns to Avoid
- Não duplicar a lógica de atribuição de Meio de Pagamento em múltiplos componentes — extrair para um helper compartilhado se o 3º painel precisar dela.
- Não buscar todas as linhas de 12 meses no cliente para o Comparativo — sempre agregar no Apps Script.

## Dependencies Identified
Nenhuma dependência de pacote nova — Recharts e lucide-react já cobrem as necessidades de gráfico/ícone dessas 4 features.

## Risks
- **Tags sem aba própria:** se um dono digitar uma tag customizada fora da lista fixa, o orçamento daquela tag nunca vai bater. Mitigação: manter orçamento restrito às tags da lista fixa por enquanto.
- **Faturas variáveis mal estimadas na Previsão:** usar média das últimas 3 confirmações em vez do `Valor Estimado` cadastrado reduz o erro.

## Recommendations for Planning
1. Cada feature vira um Plan próprio (backend + frontend juntos, como no Plan 8.1), todos na mesma wave (independentes entre si).
2. Pontos de decisão de produto (split do orçamento compartilhado, % de divisão do acerto de contas) devem ser tasks `checkpoint:decision` explícitas antes da implementação.
