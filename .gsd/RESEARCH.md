---
phase: 0
researched_at: 2026-06-01
discovery_level: 2
---

# Pesquisa de Arquitetura e Integração (Google API + React)

## Objective
Pesquisar a melhor abordagem para autenticação Google OAuth 2.0 (sem backend), comunicação com a API do Google Sheets/Drive, e a definição de um esquema robusto para a planilha do Google Sheets que servirá como banco de dados.

## Discovery Level
**Level 2** — Pesquisa padrão de arquitetura e integração de bibliotecas para garantir um fluxo client-side seguro e de alta performance.

## Key Decisions

### Decision 1: Fluxo de Autenticação OAuth 2.0 (Client-Side)
**Question:** Como fazer a autenticação com as APIs do Google de forma totalmente segura rodando apenas no navegador (Client-Side)?
**Options Considered:**
1. **Google Identity Services (GIS) - Implicit Flow (Token Client):** Solicita um token de acesso diretamente no navegador. O token é de curta duração (1 hora) e é usado para fazer requisições diretas do frontend para a API do Google.
   - *Pros:* Não necessita de servidor backend. Fácil de hospedar estaticamente na Vercel de graça.
   - *Cons:* Exige que o usuário autorize novamente caso o token expire e não haja atividade, mas podemos renovar silenciosamente ou solicitar novo login de forma simples.
2. **Authorization Code Flow (com Servidor):** Envia um código de autorização para um backend, que o troca por um `access_token` e um `refresh_token`.
   - *Pros:* Permite renovar o token em segundo plano sem interação do usuário por tempo indeterminado.
   - *Cons:* Requer um servidor backend seguro com banco de dados para armazenar os segredos do cliente e os refresh tokens dos usuários, o que inviabiliza uma hospedagem 100% estática e gratuita e aumenta a complexidade de privacidade dos dados.

**Decision:** **Opção 1 (Implicit Flow com GIS Token Client)**. Usaremos a biblioteca oficial do Google Identity Services carregada via CDN e integrada no React. O token será mantido na memória da aplicação React e cacheado no `sessionStorage` para resistir a recarregamentos de página. Se expirar, o usuário clica em login novamente (um clique rápido usando a interface do Google). Isso garante máxima privacidade (nenhum dado passa por servidores de terceiros).
**Confidence:** High

---

### Decision 2: Biblioteca de Gráficos no React
**Question:** Qual biblioteca de gráficos utilizar para obter visual minimalista, responsivo e com micro-animações premium?
**Options Considered:**
1. **Recharts:** Baseada em SVG, totalmente declarativa para React. Muito fácil de estilizar usando CSS/JS e possui animações nativas excelentes.
2. **Chart.js (com react-chartjs-2):** Baseada em Canvas, muito performática para grandes volumes de dados.
3. **ApexCharts:** Muito bonita, mas um pouco mais pesada.

**Decision:** **Recharts (Opção 1)**. É a biblioteca mais alinhada com o ecossistema React para dashboards modernos e minimalistas, além de se ajustar perfeitamente a containers responsivos e permitir customização fácil de tooltips.
**Confidence:** High

---

## Findings

### 1. Fluxo de Inicialização e Descoberta da Planilha no Google Drive
Para buscar ou criar a planilha sem requerer que o usuário digite o ID manualmente:
1. **Escopos Necessários:**
   - `https://www.googleapis.com/auth/drive.file` (Para pesquisar e criar arquivos que o app gerencia)
   - `https://www.googleapis.com/auth/spreadsheets` (Para ler e editar os dados das planilhas)
2. **Descoberta:**
   - O app faz uma chamada para a API do Google Drive (`https://www.googleapis.com/drive/v3/files`) filtrando por `name = 'Finanças Compartilhadas Wesley e Luana'` e `mimeType = 'application/vnd.google-apps.spreadsheet'`.
   - Se encontrar, salva o `spreadsheetId` no `localStorage` do navegador.
   - Se não encontrar, o app cria uma nova planilha com este nome e formata as abas iniciais.

### 2. Esquema Sugerido para o Google Sheets (Banco de Dados)

Para implementar as decisões de negócio acordadas, a planilha criada terá a seguinte estrutura de abas:

#### Aba `Despesas [Wesley]` & Aba `Despesas [Luana]`
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `ID` | Texto | ID único da transação (ex: UUID ou timestamp + aleatório) |
| `Data` | Data (AAAA-MM-DD) | Data do vencimento/compra |
| `Descrição` | Texto | Nome da compra (ex: "Supermercado") |
| `Valor` | Decimal | Valor em R$ |
| `Tag` | Texto | Categoria principal (ex: "Alimentação", "Lazer") |
| `Compartilhado` | Booleano (TRUE/FALSE) | Se o gasto é dividido pelo casal |
| `ID Parcelamento` | Texto | Vazio se à vista; senão, ID único + indicador (ex: `compra123_01_12`) |

#### Aba `Recorrentes`
Esta aba guarda o planejamento de despesas fixas e variáveis recorrentes.
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `ID` | Texto | ID único da configuração recorrente |
| `Descrição` | Texto | Nome da conta (ex: "Netflix", "Energia") |
| `Valor Estimado` | Decimal | Valor aproximado |
| `Dia Vencimento` | Inteiro (1 a 31) | Dia do mês em que vence |
| `Tipo` | Texto | `Fixo` (não altera valor) ou `Variável` (altera valor todo mês) |
| `Dono` | Texto | `Wesley`, `Luana` ou `Compartilhado` |
| `Ativo` | Booleano | TRUE para ativo, FALSE para pausado |

---

## Patterns to Follow
- **Batch Updates:** Ao lançar compras parceladas (ex: 12 parcelas), enviar todas as linhas em uma única chamada `spreadsheets.values.append` para economizar requests de rede e evitar lentidão.
- **Loading States:** Como as chamadas de API do Google Sheets podem levar de 500ms a 2s, todas as ações de escrita/leitura devem exibir micro-animações de carregamento (shimmer effects) para uma experiência fluida.
- **Glassmorphism CSS:** Fazer uso de `backdrop-filter: blur(10px)` e cores em formato HSL com opacidade para os cartões e modais de lançamento de despesa, gerando um efeito visual moderno.

## Anti-Patterns to Avoid
- **Poller em excesso:** Evitar ler a planilha inteira a cada interação. O app deve manter os dados em cache no estado do React após a primeira carga e só atualizar a planilha quando houver gravações, atualizando o cache local simultaneamente.
- **Credenciais expostas no código:** Não embutir a `API Key` do Google se for possível usar apenas o `Client ID` com restrição de domínio da Vercel.

## Dependencies Identified
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` | `^18.3.0` | Framework principal da UI |
| `recharts` | `^2.12.0` | Visualização de dados e gráficos |
| `lucide-react` | `^0.370.0` | Ícones minimalistas para a interface |

## Risks
- **Expiração de Token de Acesso:** O token OAuth do implicit flow expira após 1 hora.
  - *Mitigação:* Monitorar respostas de erro 401 da API do Google e redirecionar suavemente para uma tela de reautenticação sem perder o progresso do formulário atual do usuário (salvando temporariamente o rascunho no `localStorage`).
- **Planilha excluída pelo usuário no Drive:** O usuário pode deletar a planilha manualmente no Google Drive.
  - *Mitigação:* Tratar erros de "File Not Found (404)" e oferecer a recriação da planilha com um clique.

## Recommendations for Planning
1. **Fase 1: Setup e Autenticação.** Focar na conexão OAuth, carregamento das APIs do Google Drive/Sheets no React e fluxo de criação/descoberta da planilha.
2. **Fase 2: Tela de Lançamentos.** Implementar formulário de despesa rápida, tags dinâmicas e o algoritmo que expande compras parceladas em múltiplas linhas.
3. **Fase 3: Gestão de Recorrentes.** Desenvolver o painel de previsibilidade e o fluxo de confirmação das despesas fixas e variáveis.
4. **Fase 4: Dashboard e Gráficos.** Criar a visualização dos dados consolidados usando Recharts e aplicar o polimento final do design.
