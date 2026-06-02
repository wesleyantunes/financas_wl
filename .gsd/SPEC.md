# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Uma ferramenta web minimalista e moderna para a gestão financeira pessoal compartilhada de Wesley e Luana, utilizando o Google Sheets como banco de dados através de uma API personalizada no Google Apps Script. O sistema proporcionará controle rápido de despesas diárias, acompanhamento de compras parceladas, planejamento de despesas fixas/variáveis e visualização de gráficos dinâmicos com identidade visual Sicredi Dark Mode, sendo executado 100% de forma estática e sem custos de infraestrutura.

## Goals
1. **Integração com Google Sheets via Web App API:** Conectar o frontend diretamente à planilha por meio de um script Google Apps Script configurado na planilha do usuário, dispensando projetos no Google Cloud Console.
2. **Autenticação Simples com Senha Customizada:** Desenvolver uma tela de login/configuração inicial onde os usuários inserem a URL do Web App do Google e um token/senha secreta para proteger os dados.
3. **Cadastro Rápido e Inteligente de Despesas:** Facilitar o lançamento de gastos individuais ou compartilhados, com categorização por tags pré-definidas ou personalizadas.
4. **Mecanismo de Parcelamentos (Linhas Expandidas):** Dividir automaticamente compras parceladas em lançamentos futuros na planilha para manter a consistência financeira mensal.
5. **Controle de Despesas Recorrentes (Estimativa vs. Real):** Painel de planejamento de despesas fixas e fixas-variáveis (ex: água e energia), permitindo provisionamento e posterior confirmação dos valores exatos.
6. **Dashboard Minimalista com Gráficos Dinâmicos:** Apresentar gráficos consolidados de despesas por categorias/tags, gastos individuais e despesas compartilhadas do casal, no estilo Sicredi Dark Mode.

## Non-Goals (Out of Scope)
- Criação de banco de dados proprietário ou APIs em servidores próprios para guardar informações das transações.
- Sincronização automática com contas bancárias (Open Finance/Open Banking).
- Suporte a múltiplas moedas (o foco principal será Real - BRL / R$).
- Gerenciamento de login e senhas em banco de dados centralizado (a autenticação é local no dispositivo do usuário e validada pelo Google Apps Script).

## Users
- **Wesley e Luana:** Usuários principais que acessam o app de seus respectivos celulares/computadores, utilizando a mesma planilha do Google Sheets compartilhada via Google Drive.

## Constraints
- **Hospedagem:** Vercel (Gratuito).
- **Frontend & Integração:** React (Vite) com TypeScript de alta performance, executado inteiramente no cliente (Client-Side), conectando-se diretamente à URL do Google Apps Script configurada.
- **Estilo:** CSS Puro (Vanilla CSS) com design Sicredi Dark Mode (fundos escuros, acentos verde Sicredi, componentes glassmorphic e animações shimmer de carregamento).
- **Sem Servidor Backend:** Sem banco de dados intermediário, garantindo privacidade máxima (os dados financeiros nunca saem do ecossistema do Google do próprio usuário).

## Success Criteria
- [ ] Usuário consegue configurar a URL do Google Apps Script e o Token Secreto no primeiro acesso para conectar a planilha.
- [ ] O app detecta a planilha e formata as abas necessárias (`Despesas [Wesley]`, `Despesas [Luana]`, `Recorrentes`) automaticamente caso estejam em branco.
- [ ] Lançamentos individuais e compartilhados são salvos em tempo real nas respectivas abas.
- [ ] Lançamento de parcelamentos cria o número exato de linhas futuras na planilha contendo o ID do parcelamento.
- [ ] É possível provisionar despesas recorrentes e confirmar/ajustar os valores reais quando as faturas chegam.
- [ ] O painel principal exibe gráficos interativos (por tag, por dono, e evolução mensal) usando Recharts, em modo Sicredi Dark.
