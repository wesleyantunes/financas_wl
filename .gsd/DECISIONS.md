# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical decisions and their rationale.

## Decisions

### [DEC-001] Integração com Google Sheets via Google Apps Script Web App
**Date**: 2026-06-01
**Status**: Accepted

#### Context
A ferramenta necessita ler e gravar dados nas planilhas do Google Sheets. O uso de OAuth 2.0 padrão exige a criação de um projeto no Google Cloud Console, configuração de tela de consentimento, manipulação de tokens que expiram a cada 1 hora, além de expor barreiras de configuração complexas para o usuário.

#### Decision
Usar um script do **Google Apps Script** implantado como "Web App" diretamente na planilha do usuário. O frontend React fará requisições HTTP (GET/POST) diretamente para a URL do Web App gerada. O acesso é protegido por uma **senha/token secreta customizada** definida no código do script e no frontend.

#### Rationale
- **100% Gratuito:** O tráfego e a execução rodam inteiramente dentro da infraestrutura gratuita do Google Drive/Sheets.
- **Sem Cloud Console:** Dispensa a criação de projetos complexos no Google Cloud Console, obtenção de Client IDs ou API Keys.
- **Persistência Simples:** A URL do Web App e o token secreto são salvos no `localStorage` do navegador do usuário, eliminando a necessidade de logins recorrentes de 1 em 1 hora.
- **Privacidade Extrema:** O app web faz requisições diretas do navegador do usuário para o script da planilha dele, sem passar por servidores intermediários de terceiros.

#### Consequences
- Requer que o usuário copie e cole um script nas configurações da planilha dele uma única vez e implante como Web App. O app exibirá um passo a passo visual e didático na tela de configuração inicial para auxiliar o usuário.

#### Alternatives Considered
- **Google Identity Services (GIS) OAuth 2.0 Client-Side:** Descartado devido à complexidade de setup do Cloud Console para usuários leigos e expiração constante de tokens de acesso de 1 hora.
- **Servidor Backend Intermediário:** Descartado devido aos custos de hospedagem e complexidade de segurança ao manusear chaves de terceiros.

---

### [DEC-002] Estrutura da Planilha com Expansão de Parcelamentos
**Date**: 2026-06-01
**Status**: Accepted

#### Context
Como modelar compras parceladas no Google Sheets de forma a simplificar o balanço mensal sem requerer lógica de cálculo complexa no app?

#### Decision
Ao lançar uma compra em parcelas, o app irá expandi-la em N linhas independentes gravadas na aba do respectivo usuário, contendo datas de vencimento mensais sequenciais e um ID de parcelamento comum.

#### Rationale
Isso torna a planilha legível e computável por fórmulas simples nativas do Google Sheets, além de simplificar as queries mensais do app (basta filtrar as transações por data).

#### Consequences
- Grava N linhas de uma vez na planilha. Caso o usuário queira cancelar ou alterar parcelas no futuro, o app precisa buscar todas as linhas correspondentes ao ID de parcelamento para atualizá-las.

---

### [DEC-003] Identidade Visual (Estilo Sicredi Dark Mode)
**Date**: 2026-06-01
**Status**: Accepted

#### Context
Definir uma identidade visual moderna e agradável para a gestão financeira do casal.

#### Decision
Adotar o estilo do Sicredi (marcações em verde vibrante `#00db75` / `#00a859`) em uma interface Dark Mode premium, utilizando componentes glassmorphic (translúcidos) e animações shimmer de carregamento.

#### Rationale
Oferece um visual familiar e limpo, reduzindo fadiga ocular e dando um aspecto extremamente moderno e premium à ferramenta.

---

---

### [DEC-004] Importação de Extrato é Upload Manual, não Open Finance
**Date**: 2026-07-02
**Status**: Accepted (escopo de formato revisto pelo DEC-007)

#### Context
A Phase 11 introduz importação de extrato bancário e fatura de cartão. O SPEC.md lista como Non-Goal explícito a "Sincronização automática com contas bancárias (Open Finance/Open Banking)", e é preciso deixar claro que a nova feature não contradiz essa decisão original.

#### Decision
A importação é sempre por upload manual de arquivo (CSV ou OFX) exportado pelo próprio usuário do app/site do banco. Não há integração com APIs bancárias, Open Finance, nem armazenamento de credenciais de terceiros. O parsing acontece 100% no navegador; apenas as linhas revisadas e confirmadas pelo usuário são gravadas via `addExpenses`.

#### Rationale
Mantém a constraint "Sem Servidor Backend / dados nunca saem do ecossistema do usuário" do SPEC.md e evita expandir silenciosamente o escopo para uma integração de credenciais bancárias, que traria requisitos de segurança e compliance muito maiores.

#### Consequences
- Formatos de CSV variam por banco: a tela de importação precisa de um passo de mapeamento manual de colunas em vez de assumir um layout fixo.
- ~~PDF de fatura fica fora do escopo da Phase 11~~ — revisto pelo DEC-007: usuário pediu explicitamente suporte a PDF, incluído com salvaguardas.

---

### [DEC-005] Orçamento Compartilhado Soma as Duas Abas
**Date**: 2026-07-03
**Status**: Accepted

#### Context
Ao desenhar o Plan 10.1 (Orçamento por Categoria/Tag), era preciso decidir se um orçamento marcado como "Compartilhado" soma o gasto da tag nas duas abas (`Despesas [Wesley]` + `Despesas [Luana]`) ou se cada dono só pode ter metas individuais.

#### Decision
Um orçamento com `Dono = "Compartilhado"` soma as despesas da tag em AMBAS as abas. Wesley e Luana podem ter metas conjuntas por tag, além de (opcionalmente) metas individuais.

#### Rationale
Pedido explícito do usuário: "vamos deixar metas para os dois".

#### Consequences
- O painel de Orçamento (`BudgetPanel.tsx`) precisa ramificar o cálculo do gasto atual conforme o `Dono` do orçamento (individual vs. soma das duas abas).

---

### [DEC-006] Divisão do Acerto de Contas é Configurável por Despesa
**Date**: 2026-07-03
**Status**: Accepted

#### Context
No Plan 10.4 (Acerto de Contas), era preciso decidir se a cota justa de cada despesa compartilhada é sempre 50/50 ou configurável.

#### Decision
Cada despesa compartilhada tem seu próprio percentual de divisão (ex: aluguel 60% Wesley / 40% Luana, mercado 50/50), armazenado numa nova coluna `Divisão Wesley (%)` (9ª coluna) nas abas `Despesas [Wesley]`/`[Luana]`, com padrão 50 quando não ajustado.

#### Rationale
Pedido explícito do usuário: "configurável por despesa" — reflete que nem toda despesa do casal é dividida igualmente (ex: contas de valor desproporcional ao uso de cada um).

#### Consequences
- Adiciona uma 9ª coluna às abas de despesas, seguindo o mesmo padrão incremental já usado para adicionar `Meio de Pagamento` na Phase 8.
- `ExpenseForm.tsx` e `HistoryPanel.tsx` precisam de um controle de ajuste percentual sempre que `Compartilhado = true`.
- O cálculo do Acerto de Contas soma a cota justa despesa a despesa (usando o percentual individual de cada uma), em vez de aplicar um split fixo sobre o total.

---

### [DEC-007] Importação de Fatura em PDF Entra no Escopo (com Salvaguardas)
**Date**: 2026-07-03
**Status**: Accepted (supersede parcialmente o DEC-004)

#### Context
O DEC-004 havia deixado PDF de fatura fora do escopo da Phase 11 por risco de parsing frágil (layout varia por banco). O usuário confirmou que quer importar diretamente o PDF da fatura.

#### Decision
Incluir importação de PDF como Plan 11.2, separado do Plan 11.1 (CSV/OFX). A extração usa uma heurística GENÉRICA de linha (data + descrição + valor, reconstruída a partir das coordenadas de texto do `pdf.js`) — sem manter templates por banco. Toda transação extraída passa por uma tabela de revisão totalmente editável antes de qualquer gravação, e a soma das transações é conferida contra o total da fatura quando esse valor é identificável no PDF.

#### Rationale
Atende ao pedido do usuário sem assumir o risco de manutenção de N templates por banco (que quebrariam silenciosamente a cada mudança de layout). A revisão manual obrigatória é a salvaguarda contra erro de extração, já que a confiança do parsing de PDF é estruturalmente menor que a de CSV/OFX.

#### Consequences
- Adiciona a dependência `pdfjs-dist` ao projeto.
- A experiência de revisão do PDF é mais pesada que a de CSV/OFX (edição linha a linha esperada com mais frequência).
- Mudanças de layout de fatura por parte do banco podem exigir ajustes futuros na heurística — não há garantia de suporte universal.

---

*Last updated: 2026-07-03*
