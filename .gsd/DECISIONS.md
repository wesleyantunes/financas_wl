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

*Last updated: 2026-06-01*
