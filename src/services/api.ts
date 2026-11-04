import { supabase } from './supabase';

export interface RawExpense {
  ID?: string;
  id?: string;
  Data?: string | Date;
  data?: string | Date;
  Descrição?: string;
  desc?: string;
  Valor?: string | number;
  valor?: string | number;
  Tag?: string;
  tag?: string;
  Compartilhado?: boolean | string;
  ['ID Parcelamento']?: string;
  ['Meio de Pagamento']?: string;
  meioPagamento?: string;
  ['Divisão Wesley (%)']?: string | number;
  divisaoWesley?: string | number;
}

export interface RawRecurringRule {
  ID?: string;
  id?: string;
  Descrição?: string;
  desc?: string;
  ValorEstimado?: string | number;
  ['Valor Estimado']?: string | number;
  ['valor estimado']?: string | number;
  DiaVencimento?: string | number;
  ['Dia Vencimento']?: string | number;
  ['dia vencimento']?: string | number;
  DiaRecebimento?: string | number;
  ['Dia Recebimento']?: string | number;
  ['dia recebimento']?: string | number;
  Tipo?: string;
  tipo?: string;
  Dono?: string;
  dono?: string;
  Ativo?: boolean | string | number;
  ativo?: boolean | string | number;
}

interface DbExpense {
  id: string;
  user_owner: string;
  date: string;
  description: string;
  value: number;
  tag: string;
  is_shared: boolean;
  installment_group_id: string | null;
  payment_method: string;
  created_at?: string;
}

interface DbIncome {
  id: string;
  user_owner: string;
  date: string;
  description: string;
  value: number;
  tag: string;
  created_at?: string;
}

interface DbRecurringRule {
  id: string;
  rule_type: string;
  description: string;
  estimated_value: number;
  due_day: number;
  owner: string;
  category_type?: string;
  active: boolean;
  created_at?: string;
}

export interface RawBudget {
  ID?: string;
  id?: string;
  Tag?: string;
  tag?: string;
  ['Valor Limite']?: string | number;
  valorLimite?: string | number;
  Dono?: string;
  dono?: string;
  Ativo?: boolean | string | number;
  ativo?: boolean | string | number;
}

export interface RawAcerto {
  ID?: string;
  id?: string;
  ['Mes Referencia']?: string;
  mesReferencia?: string;
  ['Valor Acertado']?: string | number;
  valorAcertado?: string | number;
  De?: string;
  de?: string;
  Para?: string;
  para?: string;
  Data?: string | Date;
  data?: string | Date;
  Observacao?: string;
  observacao?: string;
}


interface ApiRequestPayload {
  token: string;
  action: string;
  [key: string]: unknown;
}

export async function request<T = unknown>(
  url: string,
  token: string,
  action: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  if (!url) {
    return { success: true } as T;
  }
  try {
    const payload: ApiRequestPayload = {
      token,
      action,
      ...args
    };
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }
    return await response.json() as T;
  } catch (error: unknown) {
    console.error(`Erro de API na ação "${action}":`, error);
    return { success: false } as T;
  }
}

/**
 * Validação de conexão simples com o Supabase
 */
export async function testConnection(url?: string, token?: string): Promise<boolean> {
  void url;
  void token;
  try {
    const { error } = await supabase.from('expenses').select('id').limit(1);
    return !error;
  } catch (err) {
    console.error('Erro ao testar conexão com Supabase:', err);
    return false;
  }
}

/**
 * Inicialização (compatibilidade mantida)
 */
export async function initializeSpreadsheet(url?: string, token?: string): Promise<unknown> {
  void url;
  void token;
  return { success: true };
}

/**
 * Adiciona transações em lote no Supabase
 */
export async function addExpenses(
  url: string,
  token: string,
  tabName: string,
  expenses: unknown[][]
): Promise<unknown> {
  void url;
  void token;
  try {
    const isReceivable = tabName.startsWith('Recebimentos');
    const userOwner: 'Wesley' | 'Luana' = tabName.includes('Luana') ? 'Luana' : 'Wesley';

    if (isReceivable) {
      // Recebimentos: [id, date, description, value, tag]
      const rows = expenses.map(exp => ({
        id: String(exp[0]),
        user_owner: userOwner,
        date: String(exp[1]),
        description: String(exp[2]),
        value: Number(exp[3]),
        tag: String(exp[4] || 'Outros')
      }));

      const { error } = await supabase.from('incomes').insert(rows);
      if (error) throw error;
      return { success: true, count: rows.length };
    } else {
      // Despesas: [id, date, description, value, tag, isShared, installmentGroupId, paymentMethod]
      const rows = expenses.map(exp => ({
        id: String(exp[0]),
        user_owner: userOwner,
        date: String(exp[1]),
        description: String(exp[2]),
        value: Number(exp[3]),
        tag: String(exp[4] || 'Outros'),
        is_shared: Boolean(exp[5]),
        installment_group_id: exp[6] ? String(exp[6]) : null,
        payment_method: String(exp[7] || 'Pix')
      }));

      const { error } = await supabase.from('expenses').insert(rows);
      if (error) throw error;
      return { success: true, count: rows.length };
    }
  } catch (error) {
    console.error('Erro ao adicionar despesas:', error);
    throw error;
  }
}

/**
 * Adiciona regra recorrente no Supabase
 */
export async function addRecurringRule(
  url: string,
  token: string,
  rule: unknown[],
  tabName: string = 'Recorrentes'
): Promise<unknown> {
  void url;
  void token;
  try {
    if (tabName === 'Recorrentes Recebimentos') {
      // [id, descricao, valorEstimado, diaRecebimento, dono, ativo]
      const row = {
        id: String(rule[0]),
        rule_type: 'income',
        description: String(rule[1]),
        estimated_value: Number(rule[2]),
        due_day: Number(rule[3]),
        owner: String(rule[4] || 'Wesley'),
        active: rule[5] !== false && String(rule[5]) !== 'false'
      };
      const { error } = await supabase.from('recurring_rules').insert([row]);
      if (error) throw error;
      return { success: true };
    } else {
      // [id, descricao, valorEstimado, diaVencimento, tipo, dono, ativo]
      const row = {
        id: String(rule[0]),
        rule_type: 'expense',
        description: String(rule[1]),
        estimated_value: Number(rule[2]),
        due_day: Number(rule[3]),
        category_type: String(rule[4] || 'Fixo'),
        owner: String(rule[5] || 'Compartilhado'),
        active: rule[6] !== false && String(rule[6]) !== 'false'
      };
      const { error } = await supabase.from('recurring_rules').insert([row]);
      if (error) throw error;
      return { success: true };
    }
  } catch (error) {
    console.error('Erro ao adicionar regra recorrente:', error);
    throw error;
  }
}

/**
 * Atualiza regra recorrente no Supabase
 */
export async function updateRecurringRule(
  url: string,
  token: string,
  ruleId: string,
  updates: {
    description?: string;
    estimated_value?: number;
    due_day?: number;
    owner?: string;
    category_type?: string;
    active?: boolean;
  }
): Promise<{ success: boolean }> {
  void url;
  void token;
  try {
    const { error } = await supabase
      .from('recurring_rules')
      .update(updates)
      .eq('id', ruleId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar regra recorrente:', error);
    throw error;
  }
}

/**
 * Exclui regra recorrente no Supabase
 */
export async function deleteRecurringRule(
  url: string,
  token: string,
  ruleId: string
): Promise<{ success: boolean }> {
  void url;
  void token;
  try {
    const { error } = await supabase
      .from('recurring_rules')
      .delete()
      .eq('id', ruleId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir regra recorrente:', error);
    throw error;
  }
}

export interface MonthlySummary {
  mes: string;
  totalDespesas: number;
  totalRecebimentos: number;
  porTag: Record<string, number>;
  porDono: { Wesley: number; Luana: number };
}

export interface ForecastRecurringRule extends RawRecurringRule {
  mediaUltimasConfirmacoes?: number | null;
}

/**
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
}

/**
 * Busca todos os orçamentos ativos por tag
 */
export async function getBudgets(
  url: string,
  token: string
): Promise<{ success: boolean; budgets: RawBudget[] }> {
  return await request<{ success: boolean; budgets: RawBudget[] }>(url, token, 'getBudgets');
}

/**
 * Adiciona um novo orçamento na aba Orcamentos da planilha
 */
export async function addBudget(
  url: string,
  token: string,
  budget: unknown[]
): Promise<unknown> {
  return await request(url, token, 'addBudget', { budget });
}

/**
 * Atualiza os valores de um orçamento pelo ID
 */
export async function updateBudget(
  url: string,
  token: string,
  id: string,
  budget: unknown[]
): Promise<unknown> {
  return await request(url, token, 'updateBudget', { id, budget });
}

/**
 * Exclui um orçamento pelo ID
 */
export async function deleteBudget(
  url: string,
  token: string,
  id: string
): Promise<unknown> {
  return await request(url, token, 'deleteBudget', { id });
}

/**
 * Busca todos os acertos de contas já registrados
 */
export async function getAcertos(
  url: string,
  token: string
): Promise<{ success: boolean; acertos: RawAcerto[] }> {
  return await request<{ success: boolean; acertos: RawAcerto[] }>(url, token, 'getAcertos');
}

/**
 * Registra um acerto de contas (marca um mês como quitado) na aba Acertos
 */
export async function addAcerto(
  url: string,
  token: string,
  acerto: unknown[]
): Promise<unknown> {
  return await request(url, token, 'addAcerto', { acerto });
}

/**
 * Busca todas as despesas mensais e regras recorrentes consolidadas de um determinado mês YYYY-MM
 */
export async function getMonthData(
  url: string,
  token: string,
  month: string
): Promise<{
  success: boolean;
  recurring: RawRecurringRule[];
  recurringReceivables: RawRecurringRule[];
  wesleyExpenses: RawExpense[];
  luanaExpenses: RawExpense[];
  wesleyReceivables: RawExpense[];
  luanaReceivables: RawExpense[];
}> {
  void url;
  void token;
  try {
    const startDate = `${month}-01`;
    const [yStr, mStr] = month.split('-');
    const year = parseInt(yStr, 10);
    const mIndex = parseInt(mStr, 10);
    const lastDay = new Date(year, mIndex, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    const [expensesRes, incomesRes, recurringRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false }),
      supabase
        .from('incomes')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false }),
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
    const allRecurring = (recurringRes.data || []) as DbRecurringRule[];

    const mapExpenseToRaw = (e: DbExpense | DbIncome): RawExpense => {
      const exp = e as DbExpense;
      return {
        ID: exp.id,
        id: exp.id,
        Data: exp.date,
        data: exp.date,
        Descrição: exp.description,
        desc: exp.description,
        Valor: Number(exp.value),
        valor: Number(exp.value),
        Tag: exp.tag,
        tag: exp.tag,
        Compartilhado: exp.is_shared,
        'ID Parcelamento': exp.installment_group_id || '',
        'Meio de Pagamento': exp.payment_method || 'Pix',
        meioPagamento: exp.payment_method || 'Pix'
      };
    };

    const wesleyExpenses = allExpenses
      .filter((e) => e.user_owner === 'Wesley')
      .map(mapExpenseToRaw);

    const luanaExpenses = allExpenses
      .filter((e) => e.user_owner === 'Luana')
      .map(mapExpenseToRaw);

    const wesleyReceivables = allIncomes
      .filter((i) => i.user_owner === 'Wesley')
      .map(mapExpenseToRaw);

    const luanaReceivables = allIncomes
      .filter((i) => i.user_owner === 'Luana')
      .map(mapExpenseToRaw);

    const recurring: RawRecurringRule[] = allRecurring
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

    const recurringReceivables: RawRecurringRule[] = allRecurring
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
      recurring,
      recurringReceivables,
      wesleyExpenses,
      luanaExpenses,
      wesleyReceivables,
      luanaReceivables
    };
  } catch (error) {
    console.error('Erro ao buscar dados do mês:', error);
    throw error;
  }
}

/**
 * Exclui uma despesa ou receita por ID
 */
export async function deleteExpense(
  url: string,
  token: string,
  tabName: string,
  id: string
): Promise<unknown> {
  void url;
  void token;
  try {
    const table = tabName.startsWith('Recebimentos') ? 'incomes' : 'expenses';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir:', error);
    throw error;
  }
}

/**
 * Atualiza os valores de uma despesa ou receita por ID
 */
export async function updateExpense(
  url: string,
  token: string,
  tabName: string,
  id: string,
  expense: unknown[]
): Promise<unknown> {
  void url;
  void token;
  try {
    const isReceivable = tabName.startsWith('Recebimentos');
    if (isReceivable) {
      // [id, date, description, value, tag]
      const { error } = await supabase.from('incomes').update({
        date: String(expense[1]),
        description: String(expense[2]),
        value: Number(expense[3]),
        tag: String(expense[4])
      }).eq('id', id);
      if (error) throw error;
    } else {
      // [id, date, description, value, tag, isShared, installmentGroupId, paymentMethod]
      const { error } = await supabase.from('expenses').update({
        date: String(expense[1]),
        description: String(expense[2]),
        value: Number(expense[3]),
        tag: String(expense[4]),
        is_shared: Boolean(expense[5]),
        installment_group_id: expense[6] ? String(expense[6]) : null,
        payment_method: String(expense[7] || 'Pix')
      }).eq('id', id);
      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    throw error;
  }
}

/**
 * Exclui em lote parcelas futuras vinculadas a um ID de parcelamento
 */
export async function deleteInstallments(
  url: string,
  token: string,
  tabName: string,
  installmentGroupId: string,
  baseDate: string
): Promise<unknown> {
  void url;
  void token;
  void tabName;
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('installment_group_id', installmentGroupId)
      .gte('date', baseDate);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir parcelas:', error);
    throw error;
  }
}

/**
 * Atualiza em lote campos de parcelas futuras vinculadas a um ID de parcelamento
 */
export async function updateInstallments(
  url: string,
  token: string,
  tabName: string,
  installmentGroupId: string,
  baseDate: string,
  updatedFields: {
    Descrição?: string;
    Valor?: number;
    Tag?: string;
    Compartilhado?: boolean;
    ['Meio de Pagamento']?: string;
    meioPagamento?: string;
    ['Divisão Wesley (%)']?: number;
    divisaoWesley?: number;
  }
): Promise<unknown> {
  void url;
  void token;
  void tabName;
  try {
    const { data: rows, error: fetchErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('installment_group_id', installmentGroupId)
      .gte('date', baseDate);

    if (fetchErr) throw fetchErr;

    const typedRows = (rows || []) as DbExpense[];
    const updates = typedRows.map(async (row) => {
      const payload: Partial<DbExpense> = {};
      if (updatedFields.Descrição !== undefined) {
        const match = String(row.description).match(/\((\d{2}\/\d{2})\)$/);
        payload.description = match
          ? `${updatedFields.Descrição} (${match[1]})`
          : updatedFields.Descrição;
      }
      if (updatedFields.Valor !== undefined) {
        payload.value = Number(updatedFields.Valor);
      }
      if (updatedFields.Tag !== undefined) {
        payload.tag = updatedFields.Tag;
      }
      if (updatedFields.Compartilhado !== undefined) {
        payload.is_shared = updatedFields.Compartilhado;
      }
      const payment = updatedFields['Meio de Pagamento'] || updatedFields.meioPagamento;
      if (payment !== undefined) {
        payload.payment_method = payment;
      }

      return supabase.from('expenses').update(payload).eq('id', row.id);
    });

    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar parcelas:', error);
    throw error;
  }
}
