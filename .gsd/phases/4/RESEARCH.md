# Phase 4 Research: Dashboard Dinâmico e Polimento Premium

## Objetivos da Pesquisa
1. Verificar o funcionamento da biblioteca **Recharts** no ambiente React 19.
2. Definir o esquema de agregação de dados para os gráficos:
   - Divisão de gastos por Tag (Pizza/Pie).
   - Divisão de gastos por Dono: Wesley vs. Luana vs. Compartilhado (Barra/Bar).
   - Evolução temporal de gastos: Acumulado diário do mês ou evolução dos últimos 3 meses (Linha/Line).
3. Estudo de design Sicredi Dark Mode aplicados a gráficos (paleta de cores, tooltips transparentes, glassmorphism nos containers dos gráficos).

---

## 1. Recharts e React 19
A versão instalada do Recharts (`^3.8.1`) é compatível com React 19. Para garantir renderizações limpas e responsivas em dispositivos móveis, utilizaremos o componente `<ResponsiveContainer>` em todos os gráficos.

Componentes do Recharts a serem utilizados:
- `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend` (para distribuição de tags)
- `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid` (para comparação Wesley vs. Luana vs. Compartilhado)
- `AreaChart`, `Area`, `XAxis`, `YAxis`, `Tooltip` (para evolução diária acumulada)

---

## 2. Paleta de Cores (Sicredi Dark Mode)
Para manter a coerência estética estipulada em `GSD-STYLE.md`, usaremos:
- **Verde Principal (Sicredi):** `#00db75` / `#00a859`
- **Tons de Acento:**
  - Wesley: `#00b4d8` (azul moderno para diferenciar)
  - Luana: `#ff007f` (rosa/magenta moderno)
  - Compartilhado / Geral: `#00db75` (verde Sicredi)
- **Fundo dos Gráficos:** Transparentes, embutidos em cartões glassmorphic com borda sutil.
- **Grades:** `#222222` ou `rgba(255,255,255,0.05)`
- **Tooltips:** Customizados com fundo preto transparente, borda verde Sicredi e letras brancas.

---

## 3. Lógica de Agregação de Dados

### A. Despesas por Categoria (Pie Chart)
Agrupar despesas de Wesley e Luana do mês selecionado por `Tag` (coluna `Tag` ou `tag`).
- Entrada: `wesleyExpenses` + `luanaExpenses`.
- Processamento: Somar o campo `Valor` por chave `Tag`.
- Output esperado: `[{ name: 'Alimentação', value: 450.00 }, { name: 'Recorrentes', value: 280.00 }, ...]`

### B. Comparativo por Dono (Bar Chart)
Comparar quem gastou mais e quanto foi compartilhado.
- Lógica de divisão de gastos:
  - Total Wesley: Soma das despesas individuais de Wesley.
  - Total Luana: Soma das despesas individuais de Luana.
  - Compartilhado: Soma das despesas marcadas como `Compartilhado === true` (ou `"TRUE"`).
- Para a divisão justa do casal (Quem deve a quem):
  - Gasto Real Wesley = Individual Wesley + (Compartilhado / 2)
  - Gasto Real Luana = Individual Luana + (Compartilhado / 2)
- Output esperado: `[{ name: 'Wesley', valor: 800.00 }, { name: 'Luana', valor: 950.00 }, { name: 'Compartilhado', valor: 600.00 }]`

### C. Evolução Diária Acumulada (Area/Line Chart)
Exibir o avanço de gastos ao longo do mês.
- Processamento:
  1. Descobrir quantos dias o mês corrente possui.
  2. Inicializar um array de tamanho N (dias do mês) com valores zerados.
  3. Preencher o gasto total de cada dia somando as despesas cuja data corresponde àquele dia.
  4. Gerar o acumulado corrido (Soma do dia anterior + dia atual) para formar uma curva de gastos crescente suave.
- Exemplo de output: `[{ dia: '01', Wesley: 50, Luana: 30, Total: 80 }, { dia: '02', Wesley: 50, Luana: 90, Total: 140 }, ...]`

---

## 4. Polimento Premium
- **Shimmer Loading:** Ao alternar o mês selecionado, exibir esqueletos carregando com efeito pulsação suave em vez de uma tela em branco ou indicador de texto estático.
- **Micro-animações:** Hover nos botões com brilho verde neon sutil, transição suave de escala nos gráficos Recharts, animação suave das abas ao alternar o painel.
