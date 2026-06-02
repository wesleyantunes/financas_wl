# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical decisions and their rationale.

## Decisions

### [DEC-001] Client-Side Google API & OAuth 2.0 Flow
**Date**: 2026-06-01
**Status**: Accepted

#### Context
A ferramenta necessita se autenticar com o ecossistema do Google do usuário para ler e gravar dados nas planilhas do Google Sheets e Drive. Precisamos decidir se usaremos um servidor intermediário para o fluxo OAuth ou se faremos tudo no navegador.

#### Decision
Usar o fluxo implicit-flow (Token Client) do Google Identity Services (GIS) diretamente no frontend React. O token de acesso de 1 hora gerado é armazenado em memória (`sessionStorage`) para realizar requisições diretas de API a partir do navegador.

#### Rationale
Isso permite hospedar o aplicativo estaticamente e de graça na Vercel, além de garantir privacidade total (os dados financeiros nunca passam por um servidor intermediário).

#### Consequences
- Token expira em 1 hora, necessitando que o usuário renove a autenticação. Mitigaremos isso guardando rascunhos em progresso no `localStorage` antes de redirecionar para re-login se a chamada falhar com status 401.

#### Alternatives Considered
- **Authorization Code Flow com Servidor Backend:** Descartado devido à complexidade acrescida de hospedar e gerenciar um servidor seguro com banco de dados para guardar `refresh_tokens`.

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

*Last updated: 2026-06-01*
