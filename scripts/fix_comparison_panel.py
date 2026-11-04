with open('src/services/api.ts', 'r', encoding='utf-8') as f:
    api_content = f.read()

target_api = """/**
 * Busca totais agregados (despesas, recebimentos, por tag, por dono) para uma lista de meses YYYY-MM
 */
export async function getMonthlySummaries(
  url: string,
  token: string,
  meses: string[]
): Promise<{ success: boolean; summaries: MonthlySummary[] }> {
  return await request<{ success: boolean; summaries: MonthlySummary[] }>(url, token, 'getMonthlySummaries', { meses });
}

/**
 * Busca os dados agregados necessários para projetar o saldo futuro dentro de um horizonte em dias
 */
export async function getForecastData(
  url: string,
  token: string,
  horizonDays: number
): Promise<{
  success: boolean;
  horizonDays: number;
  saldoRealizado: number;
  recurring: ForecastRecurringRule[];
  recurringReceivables: RawRecurringRule[];
  futureExpenses: RawExpense[];
  futureReceivables: RawExpense[];
}> {
  return await request(url, token, 'getForecastData', { horizonDays });
}"""

new_api = """/**
 * Busca totais agregados (despesas, recebimentos, por tag, por dono) para uma lista de meses YYYY-MM
 */
export async function getMonthlySummaries(
  url: string,
  token: string,
  meses: string[]
): Promise<{ success: boolean; summaries: MonthlySummary[] }> {
  void url;
  void token;
  try {
    if (!meses || meses.length === 0) {
      return { success: true, summaries: [] };
    }

    const sortedMonths = [...meses].sort();
    const minMonth = sortedMonths[0];
    const maxMonth = sortedMonths[sortedMonths.length - 1];
    const startDate = `${minMonth}-01`;

    const [maxY, maxM] = maxMonth.split('-').map(Number);
    const lastDay = new Date(maxY, maxM, 0).getDate();
    const endDate = `${maxMonth}-${String(lastDay).padStart(2, '0')}`;

    const [expensesRes, incomesRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('date, value, tag, user_owner')
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('incomes')
        .select('date, value, tag, user_owner')
        .gte('date', startDate)
        .lte('date', endDate)
    ]);

    if (expensesRes.error) throw expensesRes.error;
    if (incomesRes.error) throw incomesRes.error;

    const allExpenses = (expensesRes.data || []) as Array<{ date: string; value: number; tag: string; user_owner: string }>;
    const allIncomes = (incomesRes.data || []) as Array<{ date: string; value: number; tag: string; user_owner: string }>;

    const summaries: MonthlySummary[] = meses.map((mes) => {
      const mExpenses = allExpenses.filter((e) => e.date && e.date.startsWith(mes));
      const mIncomes = allIncomes.filter((i) => i.date && i.date.startsWith(mes));

      const totalDespesas = mExpenses.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
      const totalRecebimentos = mIncomes.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

      const porTag: Record<string, number> = {};
      const porDono: { Wesley: number; Luana: number } = { Wesley: 0, Luana: 0 };

      for (const exp of mExpenses) {
        const val = Number(exp.value) || 0;
        const tag = exp.tag || 'Outros';
        porTag[tag] = (porTag[tag] || 0) + val;

        if (exp.user_owner === 'Luana') {
          porDono.Luana += val;
        } else {
          porDono.Wesley += val;
        }
      }

      return {
        mes,
        totalDespesas,
        totalRecebimentos,
        porTag,
        porDono
      };
    });

    return { success: true, summaries };
  } catch (error) {
    console.error('Erro ao buscar resumos mensais no Supabase:', error);
    return { success: false, summaries: [] };
  }
}

/**
 * Busca os dados agregados necessários para projetar o saldo futuro dentro de um horizonte em dias
 */
export async function getForecastData(
  url: string,
  token: string,
  horizonDays: number
): Promise<{
  success: boolean;
  horizonDays: number;
  saldoRealizado: number;
  recurring: ForecastRecurringRule[];
  recurringReceivables: RawRecurringRule[];
  futureExpenses: RawExpense[];
  futureReceivables: RawExpense[];
}> {
  void url;
  void token;
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + horizonDays);
    const endDateStr = endDate.toISOString().split('T')[0];

    const curMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    const [expensesRes, incomesRes, recurringRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .gte('date', curMonthStart)
        .lte('date', endDateStr)
        .order('date', { ascending: true }),
      supabase
        .from('incomes')
        .select('*')
        .gte('date', curMonthStart)
        .lte('date', endDateStr)
        .order('date', { ascending: true }),
      supabase
        .from('recurring_rules')
        .select('*')
        .eq('active', true)
    ]);

    if (expensesRes.error) throw expensesRes.error;
    if (incomesRes.error) throw incomesRes.error;
    if (recurringRes.error) throw recurringRes.error;

    const allExpenses = (expensesRes.data || []) as DbExpense[];
    const allIncomes = (incomesRes.data || []) as DbIncome[];
    const allRules = (recurringRes.data || []) as DbRecurringRule[];

    const pastExpenses = allExpenses.filter((e) => e.date <= todayStr);
    const pastIncomes = allIncomes.filter((i) => i.date <= todayStr);
    const totalPastExp = pastExpenses.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const totalPastInc = pastIncomes.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const saldoRealizado = totalPastInc - totalPastExp;

    const futureExpenses: RawExpense[] = allExpenses
      .filter((e) => e.date >= todayStr)
      .map((e) => ({
        ID: e.id,
        id: e.id,
        Data: e.date,
        data: e.date,
        Descrição: e.description,
        desc: e.description,
        Valor: Number(e.value),
        valor: Number(e.value),
        Tag: e.tag,
        tag: e.tag
      }));

    const futureReceivables: RawExpense[] = allIncomes
      .filter((i) => i.date >= todayStr)
      .map((i) => ({
        ID: i.id,
        id: i.id,
        Data: i.date,
        data: i.date,
        Descrição: i.description,
        desc: i.description,
        Valor: Number(i.value),
        valor: Number(i.value),
        Tag: i.tag,
        tag: i.tag
      }));

    const recurring: ForecastRecurringRule[] = allRules
      .filter((r) => r.rule_type === 'expense')
      .map((r) => ({
        ID: r.id,
        id: r.id,
        Descrição: r.description,
        desc: r.description,
        ValorEstimado: Number(r.estimated_value),
        'Valor Estimado': Number(r.estimated_value),
        DiaVencimento: Number(r.due_day),
        'Dia Vencimento': Number(r.due_day),
        Tipo: r.category_type || 'Fixo',
        tipo: r.category_type || 'Fixo',
        Dono: r.owner,
        dono: r.owner,
        Ativo: r.active,
        ativo: r.active
      }));

    const recurringReceivables: RawRecurringRule[] = allRules
      .filter((r) => r.rule_type === 'income')
      .map((r) => ({
        ID: r.id,
        id: r.id,
        Descrição: r.description,
        desc: r.description,
        ValorEstimado: Number(r.estimated_value),
        'Valor Estimado': Number(r.estimated_value),
        DiaRecebimento: Number(r.due_day),
        'Dia Recebimento': Number(r.due_day),
        Dono: r.owner,
        dono: r.owner,
        Ativo: r.active,
        ativo: r.active
      }));

    return {
      success: true,
      horizonDays,
      saldoRealizado,
      recurring,
      recurringReceivables,
      futureExpenses,
      futureReceivables
    };
  } catch (error) {
    console.error('Erro ao buscar dados de previsão no Supabase:', error);
    return {
      success: false,
      horizonDays,
      saldoRealizado: 0,
      recurring: [],
      recurringReceivables: [],
      futureExpenses: [],
      futureReceivables: []
    };
  }
}"""

api_norm = api_content.replace('\r\n', '\n')
target_api_norm = target_api.replace('\r\n', '\n')

if target_api_norm in api_norm:
    api_updated = api_norm.replace(target_api_norm, new_api)
    with open('src/services/api.ts', 'w', encoding='utf-8') as f:
        f.write(api_updated)
    print("api.ts updated successfully!")
else:
    print("target_api not found in api.ts!")

# 2. Update ComparisonPanel.tsx
with open('src/components/ComparisonPanel.tsx', 'r', encoding='utf-8') as f:
    comp_content = f.read()

comp_target = """    try {
      const res = await getMonthlySummaries(url, token, [compareA, compareB]);
      const a = res.summaries.find(s => s.mes === compareA) || null;
      const b = res.summaries.find(s => s.mes === compareB) || null;
      setCompareData({ A: a, B: b });"""

comp_new = """    try {
      const res = await getMonthlySummaries(url, token, [compareA, compareB]);
      const summaries = res?.summaries || [];
      const a = summaries.find(s => s.mes === compareA) || null;
      const b = summaries.find(s => s.mes === compareB) || null;
      setCompareData({ A: a, B: b });"""

comp_norm = comp_content.replace('\r\n', '\n')
comp_target_norm = comp_target.replace('\r\n', '\n')

if comp_target_norm in comp_norm:
    comp_updated = comp_norm.replace(comp_target_norm, comp_new)
    with open('src/components/ComparisonPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(comp_updated)
    print("ComparisonPanel.tsx updated successfully!")
else:
    print("comp_target not found in ComparisonPanel.tsx!")
