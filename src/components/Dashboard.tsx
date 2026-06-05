import React, { useState, useEffect } from 'react';
import { getMonthData } from '../services/api';
import type { RawExpense, RawRecurringRule } from '../services/api';
import { 
  User, 
  Users, 
  DollarSign, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  PieChart as PieIcon,
  BarChart2,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';

interface DashboardProps {
  url: string;
  token: string;
}

const COLORS = [
  '#00db75', // Verde Sicredi
  '#00b4d8', // Azul Wesley
  '#ff007f', // Rosa Luana
  '#9d4edd', // Roxo
  '#ff7b00', // Laranja
  '#ffc300', // Amarelo
  '#06d6a0', // Verde Menta
  '#f72585'  // Pink Escuro
];

export const Dashboard: React.FC<DashboardProps> = ({ url, token }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    recurring: RawRecurringRule[];
    recurringReceivables: RawRecurringRule[];
    wesleyExpenses: RawExpense[];
    luanaExpenses: RawExpense[];
    wesleyReceivables: RawExpense[];
    luanaReceivables: RawExpense[];
  } | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      // Defer execution to make sure state sets are not synchronous on render
      await Promise.resolve();
      if (!active) return;

      setLoading(true);
      setError('');
      try {
        const res = await getMonthData(url, token, selectedMonth);
        if (active) {
          setData(res);
        }
      } catch (err) {
        if (active) {
          const errMsg = err instanceof Error ? err.message : 'Erro ao carregar dados do painel.';
          setError(errMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [selectedMonth, url, token]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${ny}-${nm}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${ny}-${nm}`);
  };

  const getMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Helper para normalizar despesas
  const parseExpenses = (rawList: RawExpense[], listOwner: 'Wesley' | 'Luana') => {
    return (rawList || []).map(exp => {
      const valRaw = exp.Valor !== undefined ? exp.Valor : exp.valor;
      const valor = typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw || 0)) || 0;
      const isShared = exp.Compartilhado === true || 
                       exp.Compartilhado === 'true' || 
                       exp.Compartilhado === 'TRUE' || 
                       String(exp.Compartilhado).toLowerCase() === 'true';
      const rawDate = exp.Data || exp.data || '';
      let day = 1;
      if (rawDate) {
        // Formatos aceitos: YYYY-MM-DD ou data do Google Sheets
        const parts = String(rawDate).split('T')[0].split('-');
        if (parts.length >= 3) {
          day = parseInt(parts[2], 10) || 1;
        } else {
          // Tenta ler caso seja retornado como data do Google / ISO completa
          const dateObj = new Date(rawDate);
          if (!isNaN(dateObj.getTime())) {
            day = dateObj.getDate();
          }
        }
      }

      // Detect payment method (Meio de Pagamento)
      const meioPagamento = exp['Meio de Pagamento'] || exp.meioPagamento || 'Pix';

      // Decide who physically paid:
      let paidBy: 'Wesley' | 'Luana' = listOwner;
      if (meioPagamento === 'Cartão Wesley') {
        paidBy = 'Wesley';
      } else if (meioPagamento === 'Cartão Luana') {
        paidBy = 'Luana';
      }

      return {
        id: exp.ID || exp.id || '',
        description: exp.Descrição || exp.desc || 'Sem descrição',
        value: valor,
        tag: exp.Tag || exp.tag || 'Outros',
        isShared,
        day,
        paymentMethod: meioPagamento,
        paidBy,
        listOwner
      };
    });
  };

  // Helper para normalizar recebimentos
  const parseReceivables = (rawList: RawExpense[]) => {
    return (rawList || []).map(rec => {
      const valRaw = rec.Valor !== undefined ? rec.Valor : rec.valor;
      const valor = typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw || 0)) || 0;
      return {
        id: rec.ID || rec.id || '',
        description: rec.Descrição || rec.desc || 'Sem descrição',
        value: valor,
        tag: rec.Tag || rec.tag || 'Outros'
      };
    });
  };

  const wesleyList = parseExpenses(data?.wesleyExpenses || [], 'Wesley');
  const luanaList = parseExpenses(data?.luanaExpenses || [], 'Luana');
  const allExpenses = [...wesleyList, ...luanaList];

  const wesleyReceivablesList = parseReceivables(data?.wesleyReceivables || []);
  const luanaReceivablesList = parseReceivables(data?.luanaReceivables || []);

  // Cálculos Financeiros
  const wesleyPaid = allExpenses.reduce((acc, curr) => acc + (curr.paidBy === 'Wesley' ? curr.value : 0), 0);
  const luanaPaid = allExpenses.reduce((acc, curr) => acc + (curr.paidBy === 'Luana' ? curr.value : 0), 0);
  const totalPaid = wesleyPaid + luanaPaid;

  const wesleyIndividual = allExpenses.reduce((acc, curr) => acc + (curr.listOwner === 'Wesley' && !curr.isShared ? curr.value : 0), 0);
  const luanaIndividual = allExpenses.reduce((acc, curr) => acc + (curr.listOwner === 'Luana' && !curr.isShared ? curr.value : 0), 0);
  
  const wesleySharedPaid = allExpenses.reduce((acc, curr) => acc + (curr.listOwner === 'Wesley' && curr.isShared ? curr.value : 0), 0);
  const luanaSharedPaid = allExpenses.reduce((acc, curr) => acc + (curr.listOwner === 'Luana' && curr.isShared ? curr.value : 0), 0);
  const totalShared = wesleySharedPaid + luanaSharedPaid;

  // Gasto justo = Gasto Individual + Metade de tudo que foi compartilhado
  const wesleyFairShare = wesleyIndividual + (totalShared / 2);
  const luanaFairShare = luanaIndividual + (totalShared / 2);

  // Reconciliação: Wesley Pago - Wesley Fair Share
  const reconciliationDiff = wesleyPaid - wesleyFairShare;

  // Cálculos de Receitas e Poupança
  const wesleyIncome = wesleyReceivablesList.reduce((acc, curr) => acc + curr.value, 0);
  const luanaIncome = luanaReceivablesList.reduce((acc, curr) => acc + curr.value, 0);
  const totalIncome = wesleyIncome + luanaIncome;

  const wesleySavings = wesleyIncome - wesleyFairShare;
  const luanaSavings = luanaIncome - luanaFairShare;
  const totalSavings = totalIncome - totalPaid;

  // --- Lógica de Projeção ---
  // 1. Despesas recorrentes pendentes
  const matchedExpenseIds = new Set<string>();
  const pendingExpensesList = (data?.recurring || []).filter(rule => {
    const ruleDesc = (rule.Descrição || rule.desc || '').toLowerCase().trim();
    if (!ruleDesc) return true;

    const matchedExpense = allExpenses.find(exp => {
      if (matchedExpenseIds.has(exp.id)) return false;
      const expDesc = exp.description.toLowerCase().trim();
      return expDesc.includes(ruleDesc);
    });

    if (matchedExpense) {
      matchedExpenseIds.add(matchedExpense.id);
      return false;
    }
    return true;
  });

  const pendingExpensesSum = pendingExpensesList.reduce((acc, rule) => {
    const valRaw = rule.ValorEstimado || rule['Valor Estimado'] || 0;
    return acc + (typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw)) || 0);
  }, 0);

  // 2. Recebimentos recorrentes pendentes
  const matchedReceivableIds = new Set<string>();
  const allReceivablesList = [...wesleyReceivablesList, ...luanaReceivablesList];
  const pendingReceivablesList = (data?.recurringReceivables || []).filter(rule => {
    const ruleDesc = (rule.Descrição || rule.desc || '').toLowerCase().trim();
    if (!ruleDesc) return true;

    const matchedReceivable = allReceivablesList.find(rec => {
      if (matchedReceivableIds.has(rec.id)) return false;
      const recDesc = rec.description.toLowerCase().trim();
      return recDesc.includes(ruleDesc);
    });

    if (matchedReceivable) {
      matchedReceivableIds.add(matchedReceivable.id);
      return false;
    }
    return true;
  });

  const pendingReceivablesSum = pendingReceivablesList.reduce((acc, rule) => {
    const valRaw = rule.ValorEstimado || rule['Valor Estimado'] || 0;
    return acc + (typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw)) || 0);
  }, 0);

  // 1. Gráfico de Pizza (Por Categoria/Tag)
  const tagGroup: Record<string, number> = {};
  allExpenses.forEach(exp => {
    const t = exp.tag;
    tagGroup[t] = (tagGroup[t] || 0) + exp.value;
  });

  const pieData = Object.entries(tagGroup).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  })).sort((a, b) => b.value - a.value);

  // 2. Gráfico de Barras (Pago por Dono)
  const barData = [
    {
      name: 'Wesley',
      'Pago Individual': parseFloat(wesleyIndividual.toFixed(2)),
      'Pago Compartilhado': parseFloat(wesleySharedPaid.toFixed(2)),
      'Gasto Real (Fair Share)': parseFloat(wesleyFairShare.toFixed(2))
    },
    {
      name: 'Luana',
      'Pago Individual': parseFloat(luanaIndividual.toFixed(2)),
      'Pago Compartilhado': parseFloat(luanaSharedPaid.toFixed(2)),
      'Gasto Real (Fair Share)': parseFloat(luanaFairShare.toFixed(2))
    }
  ];

  // 3. Evolução Diária Acumulada
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      dayStr: String(day).padStart(2, '0'),
      wesleyDaily: 0,
      luanaDaily: 0,
      totalDaily: 0
    };
  });

  // Agrega gastos por dia
  wesleyList.forEach(exp => {
    if (exp.day >= 1 && exp.day <= daysInMonth) {
      dailyData[exp.day - 1].wesleyDaily += exp.value;
      dailyData[exp.day - 1].totalDaily += exp.value;
    }
  });
  luanaList.forEach(exp => {
    if (exp.day >= 1 && exp.day <= daysInMonth) {
      dailyData[exp.day - 1].luanaDaily += exp.value;
      dailyData[exp.day - 1].totalDaily += exp.value;
    }
  });

  // Transforma em valor acumulado corrido
  let wAcc = 0;
  let lAcc = 0;
  let tAcc = 0;
  const areaData = dailyData.map(d => {
    wAcc += d.wesleyDaily;
    lAcc += d.luanaDaily;
    tAcc += d.totalDaily;
    return {
      name: d.dayStr,
      'Wesley Acumulado': parseFloat(wAcc.toFixed(2)),
      'Luana Acumulado': parseFloat(lAcc.toFixed(2)),
      'Total Acumulado': parseFloat(tAcc.toFixed(2))
    };
  });

  // Custom tooltips
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Seletor de Mês */}
      <div className="glass-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <button className="btn btn-secondary" onClick={handlePrevMonth} style={{ width: 'auto', padding: '8px 12px' }} disabled={loading}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'capitalize', margin: 0, flex: 1, textAlign: 'center' }}>
          <Calendar size={18} style={{ color: 'var(--color-primary)', marginRight: '8px', verticalAlign: 'middle' }} />
          {getMonthName(selectedMonth)}
        </h2>
        <button className="btn btn-secondary" onClick={handleNextMonth} style={{ width: 'auto', padding: '8px 12px' }} disabled={loading}>
          <ChevronRight size={18} />
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--color-danger-glow)',
          border: '1px solid var(--color-danger)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: 'var(--color-danger)',
          fontSize: '0.9rem',
          textAlign: 'left'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={`s1-${i}`} className="glass-card shimmer" style={{ height: '108px', borderRadius: '16px' }}></div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={`s2-${i}`} className="glass-card shimmer" style={{ height: '108px', borderRadius: '16px' }}></div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Seção de Projeção de Fluxo de Caixa */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '-8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
            Previsão e Fluxo de Caixa Projetado
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Saldo Final Projetado */}
            <div className="glass-card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              padding: '20px',
              border: '1px solid var(--border-active)',
              background: 'linear-gradient(135deg, rgba(0, 219, 117, 0.05) 0%, rgba(10, 10, 10, 0.2) 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>SALDO FINAL PREVISTO</span>
                <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: (totalIncome + pendingReceivablesSum - (totalPaid + pendingExpensesSum)) >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                {formatBRL(totalIncome + pendingReceivablesSum - (totalPaid + pendingExpensesSum))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Saldo final estimado (Lançado + Pendentes Recorrentes)
              </div>
            </div>

            {/* Receitas Previstas */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>RECEITA PREVISTA TOTAL</span>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '700' }}>+{formatBRL(totalIncome + pendingReceivablesSum)}</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-title)' }}>
                {formatBRL(totalIncome + pendingReceivablesSum)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Realizado: {formatBRL(totalIncome)}</span>
                <span>Pendente: {formatBRL(pendingReceivablesSum)}</span>
              </div>
            </div>

            {/* Despesas Previstas */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>DESPESA PREVISTA TOTAL</span>
                <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: '700' }}>-{formatBRL(totalPaid + pendingExpensesSum)}</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-title)' }}>
                {formatBRL(totalPaid + pendingExpensesSum)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Realizado: {formatBRL(totalPaid)}</span>
                <span>Pendente: {formatBRL(pendingExpensesSum)}</span>
              </div>
            </div>
          </div>

          {/* Seção Poupança e Recebimentos */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '-8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} style={{ color: 'var(--color-primary)' }} />
            Recebimentos e Poupança Líquida
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Poupança Casal */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>POUPANÇA LÍQUIDA CASAL</span>
                <Users size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: totalSavings >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                {formatBRL(totalSavings)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Receita total: {formatBRL(totalIncome)}</span>
                <span>Gasto total: {formatBRL(totalPaid)}</span>
              </div>
            </div>

            {/* Poupança Wesley */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>POUPANÇA WESLEY</span>
                <User size={18} style={{ color: '#00b4d8' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: wesleySavings >= 0 ? '#00b4d8' : 'var(--color-danger)' }}>
                {formatBRL(wesleySavings)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Receita: {formatBRL(wesleyIncome)}</span>
                <span>Gasto Real: {formatBRL(wesleyFairShare)}</span>
              </div>
            </div>

            {/* Poupança Luana */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>POUPANÇA LUANA</span>
                <User size={18} style={{ color: '#ff007f' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: luanaSavings >= 0 ? '#ff007f' : 'var(--color-danger)' }}>
                {formatBRL(luanaSavings)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Receita: {formatBRL(luanaIncome)}</span>
                <span>Gasto Real: {formatBRL(luanaFairShare)}</span>
              </div>
            </div>
          </div>

          {/* Seção Despesas */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '-8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} style={{ color: 'var(--color-primary)' }} />
            Despesas e Acertos do Mês
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            
            {/* Card 1: Total Geral */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>TOTAL DO MÊS</span>
                <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-title)' }}>
                {formatBRL(totalPaid)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Compartilhado: <span style={{ color: 'var(--color-primary)' }}>{formatBRL(totalShared)}</span>
              </div>
            </div>

            {/* Card 2: Wesley Pago */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>PAGO POR WESLEY</span>
                <User size={18} style={{ color: '#00b4d8' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-title)' }}>
                {formatBRL(wesleyPaid)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Gasto Real: <span style={{ color: '#00b4d8' }}>{formatBRL(wesleyFairShare)}</span>
              </div>
            </div>

            {/* Card 3: Luana Pago */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>PAGO POR LUANA</span>
                <User size={18} style={{ color: '#ff007f' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-title)' }}>
                {formatBRL(luanaPaid)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Gasto Real: <span style={{ color: '#ff007f' }}>{formatBRL(luanaFairShare)}</span>
              </div>
            </div>

            {/* Card 4: Reconciliação */}
            <div className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '20px',
              border: Math.abs(reconciliationDiff) > 0.01 ? '1px solid var(--border-active)' : '1px solid var(--border-glass)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>ACERTO DE CONTAS</span>
                <Users size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              {Math.abs(reconciliationDiff) <= 0.01 ? (
                <>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                    Equilibrado
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Nenhum acerto pendente
                  </div>
                </>
              ) : reconciliationDiff > 0 ? (
                <>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ff007f' }}>
                    Luana deve
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-title)' }}>
                    Pagar {formatBRL(reconciliationDiff)} para Wesley
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#00b4d8' }}>
                    Wesley deve
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-title)' }}>
                    Pagar {formatBRL(Math.abs(reconciliationDiff))} para Luana
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gráficos Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-card shimmer" style={{ height: '360px', borderRadius: '16px' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className="glass-card shimmer" style={{ height: '360px', borderRadius: '16px' }}></div>
            <div className="glass-card shimmer" style={{ height: '360px', borderRadius: '16px' }}></div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Gráfico 1: Evolução Temporal Acumulada */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--color-primary)' }} />
              Evolução Diária Acumulada de Gastos
            </h3>
            {allExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                Nenhum gasto lançado neste mês.
              </div>
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00db75" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#00db75" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--text-muted)" 
                      fontSize={11}
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={11}
                      tickLine={false} 
                      tickFormatter={(val) => `R$${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(10, 10, 10, 0.95)', 
                        borderColor: 'var(--border-glass)', 
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      formatter={(val: unknown) => [formatBRL(Number(val || 0)), '']}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Total Acumulado" 
                      stroke="var(--color-primary)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Wesley Acumulado" 
                      stroke="#00b4d8" 
                      strokeWidth={1.5}
                      fill="none"
                      strokeDasharray="4 4"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Luana Acumulado" 
                      stroke="#ff007f" 
                      strokeWidth={1.5}
                      fill="none"
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Gráfico 2: Divisão por Categorias */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={18} style={{ color: 'var(--color-primary)' }} />
                Gastos por Categoria
              </h3>
              {pieData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                  Sem dados de categorias.
                </div>
              ) : (
                <div style={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(10, 10, 10, 0.95)', 
                            borderColor: 'var(--border-glass)', 
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.8rem'
                          }}
                          formatter={(val: unknown) => formatBRL(Number(val || 0))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom Legend */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    marginTop: '10px',
                    fontSize: '0.75rem',
                    maxHeight: '70px',
                    overflowY: 'auto'
                  }}>
                    {pieData.slice(0, 6).map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span style={{ color: 'var(--text-muted)' }}>{entry.name} ({formatBRL(entry.value)})</span>
                      </div>
                    ))}
                    {pieData.length > 6 && (
                      <span style={{ color: 'var(--text-muted)' }}>... e mais {pieData.length - 6}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico 3: Comparação de Tipo de Gasto */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
                Comparação de Gastos
              </h3>
              {allExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                  Sem despesas para comparar.
                </div>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(10, 10, 10, 0.95)', 
                          borderColor: 'var(--border-glass)', 
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                        formatter={(val: unknown) => formatBRL(Number(val || 0))}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '0.75rem', marginTop: '10px' }}
                      />
                      <Bar dataKey="Pago Individual" fill="#00b4d8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pago Compartilhado" fill="#ff7b00" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Gasto Real (Fair Share)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
