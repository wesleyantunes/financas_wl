---
updated: 2026-07-04T04:00:00Z
---

# Project State

## Current Position

**Milestone:** v1.1 (completo)
**Phase:** Nenhuma em andamento — Fases 10 e 11 completas
**Task:** —
**Status:** Verified (heurística de PDF corrigida com fatura real)
**Plan:** —

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
