# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Uma ferramenta web minimalista e moderna para a gestão financeira pessoal compartilhada de Wesley e Luana, utilizando o Google Sheets como banco de dados através de autenticação Google OAuth 2.0. O sistema proporcionará controle rápido de despesas diárias, acompanhamento de compras parceladas, planejamento de despesas fixas/variáveis e visualização de gráficos dinâmicos sem necessidade de um servidor de banco de dados personalizado.

## Goals
1. **Autenticação Segura e Direta (OAuth):** Permitir login com a Conta Google e verificar acesso diretamente pelas permissões de compartilhamento da planilha no Google Drive.
2. **Cadastro Rápido e Inteligente de Despesas:** Facilitar o lançamento de gastos individuais ou compartilhados, com categorização por tags.
3. **Mecanismo de Parcelamentos (Linhas Expandidas):** Dividir automaticamente compras parceladas em lançamentos futuros na planilha para manter a consistência financeira mensal.
4. **Controle de Despesas Recorrentes (Estimativa vs. Real):** Painel de planejamento de despesas fixas e fixas-variáveis (ex: água e energia), permitindo provisionamento e posterior confirmação dos valores exatos.
5. **Dashboard Minimalista com Gráficos Dinâmicos:** Apresentar gráficos consolidados de despesas por categorias/tags, gastos individuais e despesas compartilhadas do casal.

## Non-Goals (Out of Scope)
- Criação de banco de dados proprietário ou APIs de terceiros para guardar informações das transações.
- Sincronização automática com contas bancárias (Open Finance/Open Banking).
- Suporte a múltiplas moedas (o foco principal será Real - BRL / R$).
- Sistema próprio de envio de convites ou e-mails (o compartilhamento do acesso é feito nativamente pelo botão "Compartilhar" da planilha no Google Sheets).

## Users
- **Wesley e Luana:** Usuários principais que acessam o app de seus respectivos celulares/computadores, utilizando uma mesma planilha do Google Drive que foi compartilhada entre ambos.

## Constraints
- **Hospedagem:** Vercel (Gratuito).
- **Frontend & Integração:** React (Vite) de alta performance, executado inteiramente no cliente (Client-Side), conectando-se diretamente às APIs do Google Drive e Google Sheets.
- **Estilo:** CSS Puro (Vanilla CSS) com design moderno (glassmorphic, dark mode, transições suaves).
- **Sem Backend:** Sem banco de dados intermediário, garantindo privacidade máxima (os dados financeiros nunca saem do ecossistema do Google do próprio usuário).

## Success Criteria
- [ ] Usuário consegue fazer login com OAuth do Google e localizar ou criar automaticamente a planilha "Finanças Compartilhadas".
- [ ] Lançamentos individuais e compartilhados são salvos em tempo real nas respectivas abas: `Despesas [Wesley]` ou `Despesas [Luana]`.
- [ ] Lançamento de parcelamentos cria o número exato de linhas futuras na planilha contendo o ID do parcelamento.
- [ ] É possível provisionar despesas recorrentes e confirmar/ajustar os valores reais quando as faturas chegam.
- [ ] O painel principal exibe gráficos interativos (por tag, por dono, e evolução mensal) que refletem os dados da planilha de forma dinâmica.
