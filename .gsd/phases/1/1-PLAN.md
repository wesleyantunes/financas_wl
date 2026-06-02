---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Setup do Projeto e Design System (Sicredi Dark Mode)

## Objective
Instalar dependências essenciais (`lucide-react`, `recharts`), limpar a estrutura de template padrão do Vite, e configurar as variáveis globais de CSS para a identidade visual Sicredi Dark Mode, com efeitos glassmorphic e layouts base.

## Context
- [.gsd/SPEC.md](file:///d:/Develop/financial-manager/.gsd/SPEC.md)
- [.gsd/REQUIREMENTS.md](file:///d:/Develop/financial-manager/.gsd/REQUIREMENTS.md)
- [.gsd/ROADMAP.md](file:///d:/Develop/financial-manager/.gsd/ROADMAP.md)

## Tasks

<task type="auto">
  <name>Instalação de Dependências e Limpeza do Template Vite</name>
  <files>
    <file>package.json</file>
    <file>src/App.css</file>
    <file>src/main.tsx</file>
  </files>
  <action>
    1. Instalar as dependências adicionais de produção: `lucide-react` e `recharts`.
    2. Remover arquivos desnecessários do template padrão do Vite (como `src/assets/react.svg` e `src/App.css` - limpar o conteúdo de App.css ou deletá-lo).
    3. Atualizar as referências de importação no `src/main.tsx` se necessário (remover imports obsoletos).
  </action>
  <verify>npm run build</verify>
  <done>
    O comando `npm run build` deve rodar com sucesso sem erros de compilação de TypeScript ou arquivos em falta.
  </done>
</task>

<task type="auto">
  <name>Implementação do Design System Sicredi Dark Mode</name>
  <files>
    <file>src/index.css</file>
  </files>
  <action>
    1. Substituir o conteúdo de `src/index.css` com o design system do Sicredi Dark Mode.
    2. Definir variáveis `:root` utilizando o sistema de cores HSL:
       - `--bg-primary`: Grafite ultra-escuro com leve matiz verde (ex: `hsl(140, 10%, 6%)`)
       - `--bg-secondary`: Grafite médio (ex: `hsl(140, 8%, 10%)`)
       - `--bg-glass`: Base translúcida com opacidade (ex: `hsla(140, 8%, 12%, 0.6)`)
       - `--border-glass`: Borda sutil verde-escuro translúcido (ex: `hsla(142, 60%, 40%, 0.15)`)
       - `--color-primary`: Verde Sicredi vibrante (ex: `hsl(152, 100%, 43%)`)
       - `--color-primary-hover`: Verde Sicredi levemente mais brilhante (ex: `hsl(152, 100%, 48%)`)
       - `--text-main`: Branco acinzentado de alta legibilidade (ex: `hsl(0, 0%, 95%)`)
       - `--text-muted`: Cinza para legendas (ex: `hsl(140, 5%, 65%)`)
    3. Adicionar classes de utilidades globais:
       - `.glass-card`: Efeito glassmorphic com `backdrop-filter: blur(12px)`, bordas arredondadas e sombra suave.
       - `.shimmer`: Efeito de animação pulsante para loading/skeletons.
       - Botões padrão modernos, inputs estilizados com foco brilhante em verde.
    4. Garantir fontes limpas do sistema ou carregar Outfit/Inter via font-family fallbacks para visual premium.
  </action>
  <verify>git diff src/index.css</verify>
  <done>
    O arquivo `src/index.css` deve conter as definições de variáveis em HSL e as classes utilitárias para glassmorphism e shimmer animado.
  </done>
</task>

<task type="auto">
  <name>Configuração do Layout Base da Aplicação</name>
  <files>
    <file>src/App.tsx</file>
  </files>
  <action>
    1. Reescrever `src/App.tsx` para servir como o gerenciador de telas principal (Configuração Inicial vs Dashboard/Painel de Lançamento).
    2. Implementar estados básicos de React (`appUrl`, `secretToken`, `isAuthenticated`) para alternar a exibição entre a tela de configuração (login) e a área interna do app.
    3. Criar uma estrutura de navegação minimalista (abas ou menu inferior para celular) para alternar entre "Lançar Despesa", "Contas Fixas/Pendentes" e "Dashboard".
  </action>
  <verify>npm run build</verify>
  <done>
    A compilação deve passar com sucesso e o arquivo `src/App.tsx` deve gerenciar a alternância entre a tela de boas-vindas/configuração e o menu interno.
  </done>
</task>

## Success Criteria
- [ ] O projeto compila com sucesso usando `npm run build`.
- [ ] O arquivo `src/index.css` está configurado com as variáveis Sicredi Dark Mode e utilidades CSS globais.
- [ ] A navegação principal da aplicação está estruturada no `src/App.tsx`.
