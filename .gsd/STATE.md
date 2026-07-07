---
updated: 2026-07-04T07:00:00Z
---

# Project State

## Melhoria pós-entrega: status "Continuação de Parcela" na Importação

Pedido do usuário: ao importar a fatura do mês seguinte, se uma transação tiver o mesmo nome de uma já lançada mas parcela diferente (ex: "Drogasil 3697 02/03" este mês, já tendo "Drogasil 3697 (01/03)" do mês passado), ele quer um status/cor diferente — mas SEM excluir ou desmarcar automaticamente, já que pode haver mais de uma compra distinta com o mesmo nome de estabelecimento.

**Implementado:**
- Novo status `'continuacao_parcelamento'` em [src/utils/importDedup.ts](src/utils/importDedup.ts) (`ImportStatus`), distinto de `'novo'` e `'possivel_duplicata'`. `matchExisting` agora: (1) tenta a duplicata exata (valor+data+descrição, como antes); (2) se não achar, tenta relacionar por descrição-base (usando `detectInstallment` para remover o marcador "NN/MM" de ambos os lados) com parcela diferente da já existente.
- `INSTALLMENT_PATTERN` em [src/utils/importParsers.ts](src/utils/importParsers.ts) generalizado para aceitar tanto "NN/MM" cru (formato de fatura) quanto "(NN/MM)" entre parênteses (formato já gravado pelo lançamento manual do app) — permite comparar a descrição de uma transação importada contra uma despesa já existente no Sheets.
- [src/components/ImportPanel.tsx](src/components/ImportPanel.tsx): janela de busca de despesas existentes ampliada de "só os meses da importação atual" para "+ 11 meses anteriores" (paralelizado com `Promise.all`), já que a parcela relacionada normalmente está em um mês passado, não no mês da fatura sendo importada. Nova badge roxa "Continuação de parcela" com tooltip mostrando a data da parcela relacionada. **Seleção padrão:** `novo` e `continuacao_parcelamento` vêm marcados (são transações reais); só `possivel_duplicata` vem desmarcada.

**Validado:** simulei uma despesa "Drogasil 3697 (01/03)" já lançada em 17/06/2026 e importei via CSV "Drogasil 3697 02/03" (17/07/2026, mesmo valor). Resultado: badge "Continuação de Parcela" (não confundida com duplicata), parcela detectada "2/3", tooltip "Parcela anterior lançada em 17/06/2026", e a linha permaneceu selecionada por padrão (botão "Importar 2 Lançamento(s)" incluindo essa linha + outra transação nova). Busca de 12 meses de histórico confirmada (2025-08 a 2026-07). `npm run lint`/`npm run build` limpos.

## Melhoria pós-entrega: suporte a parcelamento na Importação

Pedido do usuário: faturas de cartão mostram apenas a parcela do mês corrente de compras parceladas (ex: "Drogasil 3697 01/03"); as parcelas restantes só apareceriam em faturas dos meses seguintes, e ele precisava de um jeito de já lançar as parcelas futuras ao importar.

**Implementado:**
- `detectInstallment(descricao)` em [src/utils/importParsers.ts](src/utils/importParsers.ts): detecta o padrão "NN/MM" ao final da descrição (heurística com faixa de sanidade: total entre 2-48, atual ≤ total), retornando a descrição limpa (sem o marcador) e a parcela detectada.
- [src/components/ImportPanel.tsx](src/components/ImportPanel.tsx): aplica a detecção em toda transação parseada (CSV/OFX/PDF), exibindo uma coluna "Parcelamento" com os campos atual/total (sempre editáveis, mesmo quando não detectados automaticamente) e um checkbox "Gerar restantes" — desmarcado por padrão (nunca decide automaticamente, mesma filosofia da DEC-007). Quando marcado, a importação gera N linhas (da parcela atual até a total) com o mesmo valor já conhecido da fatura (sem dividir), datas mensais incrementais, e o mesmo `installmentGroupId` + sufixo `(NN/MM)` usados pelo lançamento manual do app — permitindo edição/exclusão em lote depois pelo Histórico, igual a uma parcela lançada manualmente.
- Validação antes de importar: bloqueia se alguma linha marcada para gerar parcelas tiver número de parcela atual maior que o total.

**Ajuste de lint:** a lógica de geração de linhas precisou ficar inline dentro do handler `handleImport` (não em uma função `const` separada no corpo do componente) para satisfazer a regra `react-hooks/purity` do ESLint, que sinaliza qualquer função definida no escopo do componente que chame `Date.now()`/`Math.random()` — mesmo padrão já usado em `ExpenseForm.tsx`/`CardInvoicePanel.tsx`.

**Validado:** testado com a linha real da fatura ("Drogasil 3697 01/03", R$57,07) via CSV — detecção correta (parcela "1/3", descrição limpa), e ao marcar "Gerar restantes" a importação gerou exatamente 3 linhas (17/06, 17/07, 17/08/2026), cada uma com R$57,07, mesmo `installmentGroupId`, e descrição sufixada `(01/03)`/`(02/03)`/`(03/03)`. `npm run lint`/`npm run build` limpos.

## Current Position

**Milestone:** v1.1 (completo)
**Phase:** Nenhuma em andamento — Fases 10 e 11 completas
**Task:** —
**Status:** Verified (2ª correção pós-entrega aplicada, ver abaixo)
**Plan:** —

## Last Action (2ª correção pós-entrega — crash "Cannot read properties of undefined (reading 'trim')")

Ao corrigir a heurística de data/sinal (ver seção abaixo), reconstruí `VALUE_IN_LINE_REGEX` a partir de `VALUE_TOKEN` sem notar que o token não tinha grupo de captura — `VALUE_IN_LINE_REGEX = new RegExp(VALUE_TOKEN, 'i')` ficou sem parênteses de captura, então `line.match(VALUE_IN_LINE_REGEX)[1]` (usado para extrair o valor da linha de "Total da fatura") retornava `undefined`, e `parseValorBR(undefined)` quebrava em `raw.trim()`.

Corrigido em [src/utils/importParsers.ts](src/utils/importParsers.ts): `VALUE_IN_LINE_REGEX = new RegExp(`(${VALUE_TOKEN})`, 'i')` (grupo de captura restaurado). Também endureci a extração de itens de texto do PDF (`textContent.items`) para filtrar apenas itens do tipo `TextItem` (com `str`/`transform`), descartando `TextMarkedContent` sem crashar — proteção preventiva para PDFs com marcação de acessibilidade, mesmo sem confirmação de que esse era o caso aqui.

**Validação:** simulei o pipeline completo (mesma lógica do arquivo, incluindo o trecho que antes quebrava) contra as linhas reais da fatura do usuário — sem erro, com o total (R$ 3.427,45) e as 3 transações de teste (incluindo os 2 créditos negativos) extraídos corretamente. `npm run lint`/`npm run build` limpos.

## Last Action (correção pós-entrega, validada com fatura real)

Usuário testou a importação de PDF com uma fatura real da Sicredi (Mastercard Black) e recebeu "Nenhuma transação reconhecida". Causa raiz identificada lendo o PDF real: a heurística original assumia data numérica `DD/MM` e sinal de negativo sempre depois do "R$" — mas faturas de cartão brasileiras (ao menos a da Sicredi) usam:
1. Data com mês abreviado em português (`23/jun`, `17/mai`), não numérico.
2. Sinal de crédito/pagamento ANTES do "R$" (`-R$ 75,00`, `-R$ 2.777,93`), não depois.

Corrigido em [src/utils/importParsers.ts](src/utils/importParsers.ts):
- `normalizeDateBR` agora aceita abreviações de mês (`jan`...`dez`) via `MONTH_ABBR_MAP`, além do formato numérico já suportado.
- `parseValorBR` agora detecta o sinal de negativo em qualquer posição (antes ou depois do "R$"), não só no início da string.
- `TRANSACTION_LINE_REGEX`/`VALUE_IN_LINE_REGEX` reconstruídos a partir de `DATE_TOKEN`/`VALUE_TOKEN` compartilhados, cobrindo os dois formatos de data e as duas posições de sinal.
- Removido o `Math.abs()` forçado no retorno de `parsePdfFatura` — mantém o sinal original (consistente com `parseCsv`/`parseOfx`, que também preservam o sinal e deixam a exclusão de créditos para a revisão manual).
- [src/components/ImportPanel.tsx](src/components/ImportPanel.tsx): seleção padrão na revisão agora exige `status === 'novo' && valor > 0`, evitando pré-selecionar créditos/pagamentos (que não são despesas) nos 3 modos de importação.

**Validação:** testei a regex e os parsers diretamente contra as 9 linhas de transação reais da fatura enviada pelo usuário (incluindo os 2 créditos com sinal antes do "R$") — todas reconhecidas corretamente, com valores convertidos com precisão (`-R$ 2.777,93` → `-2777.93`). A linha de total correta ("Total fatura de julho R$ 3.427,45") foi identificada e não confundida com os subtotais por cartão ("Total cartão... R$ 1.596,17"), mesmo considerando que o cabeçalho em duas colunas da fatura pode mesclar linhas adjacentes na extração por coordenada Y (o primeiro valor monetário da linha mesclada continua sendo o correto, por construção). `npm run lint`/`npm run build` limpos.

**Limitação conhecida:** não foi possível testar a extração binária completa (`pdfjs-dist` lendo o arquivo real) neste ambiente — a validação foi feita reconstruindo as linhas reais extraídas do PDF e testando a regex/parsers contra elas diretamente. Pedir ao usuário para testar novamente com o arquivo real na aplicação é o próximo passo.

## Last Action (Fase 11)

Fase 11 concluída (2/2 planos), fechando o milestone v1.1 (Fases 10 e 11, 6/6 planos no total):

**Plan 11.1 — Importação de Extrato Bancário (CSV/OFX):**
- `src/utils/importParsers.ts`: `parseCsvPreview`/`parseCsv` (com mapeamento de colunas) e `parseOfx` (blocos `<STMTTRN>`).
- `src/utils/importDedup.ts`: `matchExisting` classifica cada transação importada como `novo`/`possivel_duplicata` (valor exato, data ±2 dias, descrição normalizada sem acento).
- Novo painel [src/components/ImportPanel.tsx](src/components/ImportPanel.tsx) ("Importar"): upload → (mapeamento de colunas para CSV) → tabela de revisão com atribuição de Tag/Meio de Pagamento em lote → gravação via `addExpenses` existente (sem alteração de schema).

**Plan 11.2 — Importação de Fatura em PDF:**
- `parsePdfFatura` em `importParsers.ts` usando `pdfjs-dist`: reconstrói linhas visuais agrupando itens de texto por coordenada Y, aplica heurística genérica de transação (data + descrição + valor) e tenta detectar a linha de "Total da fatura".
- `ImportPanel.tsx` ganhou o modo PDF: banner de aviso, tabela de revisão totalmente editável (diferente do CSV/OFX, que é somente leitura), conferência da soma selecionada contra o total detectado, e botão de adicionar linha manual.
- Dependências adicionadas: `papaparse` + `@types/papaparse`, `pdfjs-dist`.

`npm run lint` e `npm run build` passaram limpos. Testado no navegador com backend mockado (ponta a ponta):
- CSV: "Supermercado ABC" (já lançado) → corretamente marcado "Possível Duplicata"; "Posto Shell" (novo) → "Novo", pré-selecionado; importação final gravou só a transação nova, no formato de 9 colunas correto.
- OFX: duas transações extraídas corretamente (datas, descrições, valores negativos de débito preservados na revisão); importação final converteu para valores positivos.
- Heurística de linha de PDF testada com casos variados (com/sem ano, com/sem "R$", descrições com caracteres especiais) — identificou transações e a linha de total corretamente, rejeitando linhas não-transacionais (vencimento, número de cartão).
- Não foi possível testar a extração de um PDF binário real (harness de teste não gera PDFs válidos) nem contra o Google Sheets real do usuário (sem credenciais) — recomendo testar com uma fatura real antes de confiar 100% na extração.

## Next Steps

1. Validar manualmente com a planilha real (Wesley/Luana): reimplantar o Apps Script atualizado (Implantar → Gerenciar Implantações → Nova Versão) para habilitar todas as actions novas das Fases 10 e 11.
2. Testar a importação de PDF com uma fatura real de cartão (Nubank, Itaú, etc.) para validar a heurística de extração na prática — o layout real pode exigir ajustes na regex.
3. Avaliar se a navegação inferior com 10 abas (após "Importar") precisa de um redesenho mais estrutural (ex: menu "Mais") — segue como scroll horizontal por enquanto.
4. Milestone v1.1 está funcionalmente completo. Próximos passos dependem de novo feedback/prioridades do usuário.

## Session Context

- `.claude/launch.json` foi criado neste projeto para permitir preview do dev server (`npm run dev` na porta 5173).
- Lembrete importante para o usuário: o Google Apps Script publicado precisa ser **reimplantado** após colar o código atualizado de `scripts/google-apps-script.js`, senão a Web App continua servindo a versão antiga sem as novas actions/colunas (`Orcamentos`, `Acertos`, `Divisão Wesley (%)`, `getForecastData`, `getMonthlySummaries`).
- Despesas compartilhadas lançadas pelo `CardInvoicePanel.tsx` (painel "Cartões") ainda não têm o controle de divisão por despesa (só `ExpenseForm.tsx`/`HistoryPanel.tsx` foram tocados no Plan 10.4) — assumem 50/50 por padrão.
- A importação (CSV/OFX/PDF) sempre grava como despesa individual (`Compartilhado = false`, divisão vazia) — se uma transação importada for na verdade compartilhada, o usuário precisa editá-la depois no Histórico.

## Active Decisions

Decisions made that affect current work:

| Decision | Choice | Made | Affects |
|----------|--------|------|---------|
| Integração Sheets | Google Apps Script Web App API (com URL e Token Secreto em localStorage) | 2026-06-01 | Phase 1 |
| Estilo Visual | Sicredi Dark Mode (Fundo muito escuro, detalhes em verde vibrante #00db75, glassmorphism) | 2026-06-01 | All |
| Estrutura de Lançamentos | Método de Expansão de Linhas (N linhas na planilha para compras parceladas) | 2026-06-01 | Phase 2 |
| Divisão de Despesas | Lançamento em abas individuais por pessoa com marcação de "Compartilhado" | 2026-06-01 | Phase 2 |
| Despesas Recorrentes | Fluxo de Projeção na tela e posterior Confirmação/Ajuste do valor real | 2026-06-01 | Phase 3 |
| Previsão de Saldo | Conciliação e projeção baseada em pendências de regras recorrentes | 2026-06-05 | Phase 8 |
| Persistência de Orçamento/Acerto | Novas abas no Sheets (`Orcamentos`, `Acertos`), não localStorage, para sincronizar entre os dois usuários | 2026-07-02 | Phase 10 |
| Agregação de Comparativo/Previsão | Novas actions agregadas no Apps Script (`getMonthlySummaries`, `getForecastData`) em vez de N chamadas de `getMonthData` no cliente | 2026-07-02 | Phase 10 |
| Escopo de Importação | CSV/OFX parseados 100% no cliente (Plan 11.1); PDF de fatura também no escopo (Plan 11.2), com heurística genérica + revisão manual obrigatória | 2026-07-03 | Phase 11 |
| Orçamento Compartilhado | Soma o gasto da tag nas duas abas (Wesley + Luana) quando `Dono = "Compartilhado"` | 2026-07-03 | Phase 10 (DEC-005) |
| Divisão do Acerto de Contas | Configurável por despesa (nova coluna `Divisão Wesley (%)`, padrão 50), não um split fixo global | 2026-07-03 | Phase 10 (DEC-006) |

## Blockers

Nenhum.

## Concerns

Nenhum — as 3 decisões de escopo pendentes foram resolvidas (DEC-005, DEC-006, DEC-007).

## Session Context

- Fases 1-9 (v1.0): linter e build 100% validados, em produção.
- Fases 10-11 (v1.1): planejadas e com escopo fechado, nenhum código escrito ainda.
