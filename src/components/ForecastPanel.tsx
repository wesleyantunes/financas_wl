import React, { useState, useEffect, useCallback } from 'react';
import { getForecastData } from '../services/api';
import type { ForecastRecurringRule, RawRecurringRule, RawExpense } from '../services/api';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface ForecastPanelProps {
  url: string;
  token: string;
}

interface ForecastResult {
  success: boolean;
  horizonDays: number;
  saldoRealizado: number;
  recurring: ForecastRecurringRule[];
  recurringReceivables: RawRecurringRule[];
  futureExpenses: RawExpense[];
  futureReceivables: RawExpense[];
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const normalizeDateStr = (raw: string | Date | undefined): string => {
  if (!raw) return '';
  if (raw instanceof Date) return raw.toISOString().split('T')[0];
  return String(raw).split('T')[0];
};

const parseValue = (row: RawExpense): number => {
  const raw = row.Valor !== undefined ? row.Valor : row.valor;
  return typeof raw === 'number' ? raw : parseFloat(String(raw || 0)) || 0;
};

const buildProjection = (data: ForecastResult) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureExpensesByDate = new Map<string, number>();
  (data.futureExpenses || []).forEach(exp => {
    const d = normalizeDateStr(exp.Data || exp.data);
    futureExpensesByDate.set(d, (futureExpensesByDate.get(d) || 0) + parseValue(exp));
  });

  const futureReceivablesByDate = new Map<string, number>();
  (data.futureReceivables || []).forEach(rec => {
    const d = normalizeDateStr(rec.Data || rec.data);
    futureReceivablesByDate.set(d, (futureReceivablesByDate.get(d) || 0) + parseValue(rec));
  });

  const isAlreadyRecorded = (ruleDesc: string, monthStr: string, records: RawExpense[]): boolean => {
    const descLower = ruleDesc.toLowerCase().trim();
    if (!descLower) return false;
    return records.some(r => {
      const rDate = normalizeDateStr(r.Data || r.data);
      if (!rDate.startsWith(monthStr)) return false;
      const rDesc = String(r.Descrição || r.desc || '').toLowerCase().trim();
      return rDesc.includes(descLower);
    });
  };

  const chartData: { date: string; label: string; saldo: number }[] = [];
  const monthBreakdown = new Map<string, { receita: number; despesa: number }>();

  let runningBalance = data.saldoRealizado || 0;

  for (let i = 0; i < data.horizonDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = normalizeDateStr(d);
    const monthStr = dateStr.substring(0, 7);
    const dayOfMonth = d.getDate();

    if (!monthBreakdown.has(monthStr)) monthBreakdown.set(monthStr, { receita: 0, despesa: 0 });
    const monthEntry = monthBreakdown.get(monthStr)!;

    const existingExpense = futureExpensesByDate.get(dateStr) || 0;
    const existingReceivable = futureReceivablesByDate.get(dateStr) || 0;
    runningBalance += existingReceivable - existingExpense;
    monthEntry.despesa += existingExpense;
    monthEntry.receita += existingReceivable;

    (data.recurring || []).forEach(rule => {
      const diaVenc = Number(rule.DiaVencimento ?? rule['Dia Vencimento'] ?? 0);
      if (diaVenc !== dayOfMonth) return;
      const ruleDesc = String(rule.Descrição || rule.desc || '');
      if (isAlreadyRecorded(ruleDesc, monthStr, data.futureExpenses || [])) return;
      const isVariable = (rule.Tipo || rule.tipo) === 'Variável';
      const estimate = isVariable && rule.mediaUltimasConfirmacoes != null
        ? rule.mediaUltimasConfirmacoes
        : Number(rule.ValorEstimado ?? rule['Valor Estimado'] ?? 0);
      runningBalance -= estimate;
      monthEntry.despesa += estimate;
    });

    (data.recurringReceivables || []).forEach(rule => {
      const diaReceb = Number(rule.DiaRecebimento ?? rule['Dia Recebimento'] ?? 0);
      if (diaReceb !== dayOfMonth) return;
      const ruleDesc = String(rule.Descrição || rule.desc || '');
      if (isAlreadyRecorded(ruleDesc, monthStr, data.futureReceivables || [])) return;
      const estimate = Number(rule.ValorEstimado ?? rule['Valor Estimado'] ?? 0);
      runningBalance += estimate;
      monthEntry.receita += estimate;
    });

    chartData.push({
      date: dateStr,
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      saldo: parseFloat(runningBalance.toFixed(2))
    });
  }

  const monthRows = Array.from(monthBreakdown.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, vals]) => ({
      mes,
      receita: vals.receita,
      despesa: vals.despesa,
      saldo: vals.receita - vals.despesa
    }));

  return { chartData, monthRows };
};

const formatMonthLabel = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const ForecastPanel: React.FC<ForecastPanelProps> = ({ url, token }) => {
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ForecastResult | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getForecastData(url, token, horizonDays);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a previsão de saldo.');
    } finally {
      setLoading(false);
    }
  }, [url, token, horizonDays]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) fetchData();
    };
    run();
    return () => {
      active = false;
    };
  }, [fetchData]);

  const projection = data ? buildProjection(data) : { chartData: [], monthRows: [] };
  const saldoFinal = projection.chartData.length > 0
    ? projection.chartData[projection.chartData.length - 1].saldo
    : (data?.saldoRealizado || 0);
  const variacao = data ? saldoFinal - data.saldoRealizado : 0;

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Seletor de Horizonte */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '4px',
        border: '1px solid var(--border-glass)'
      }}>
        {([30, 60, 90] as const).map(h => (
          <button
            key={h}
            type="button"
            onClick={() => setHorizonDays(h)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: horizonDays === h ? 'var(--color-primary)' : 'transparent',
              color: horizonDays === h ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {h} dias
          </button>
        ))}
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
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card shimmer" style={{ height: '100px', borderRadius: '16px' }}></div>
            ))}
          </div>
          <div className="glass-card shimmer" style={{ height: '320px', borderRadius: '16px' }}></div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SALDO ATUAL</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-title)' }}>{formatBRL(data?.saldoRealizado || 0)}</strong>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SALDO PROJETADO ({horizonDays}d)</span>
              <strong style={{ fontSize: '1.5rem', color: saldoFinal >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>{formatBRL(saldoFinal)}</strong>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>VARIAÇÃO NO PERÍODO</span>
              <strong style={{ fontSize: '1.5rem', color: variacao >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                {variacao >= 0 ? '+' : ''}{formatBRL(variacao)}
              </strong>
            </div>
          </div>

          {/* Gráfico */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
              Evolução do Saldo Projetado
            </h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projection.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00db75" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00db75" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} interval={Math.ceil(horizonDays / 10)} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 10, 0.95)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                    formatter={(val: unknown) => [formatBRL(Number(val || 0)), 'Saldo']}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela Mês a Mês */}
          <div className="glass-card" style={{ padding: '20px 0' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
              Detalhamento Mês a Mês
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Mês</th>
                    <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>Receita Prevista</th>
                    <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>Despesa Prevista</th>
                    <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.monthRows.map(row => (
                    <tr key={row.mes} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '10px 20px', fontSize: '0.9rem', color: 'var(--text-title)', textTransform: 'capitalize' }}>{formatMonthLabel(row.mes)}</td>
                      <td style={{ padding: '10px 20px', fontSize: '0.9rem', textAlign: 'right', color: 'var(--color-primary)' }}>{formatBRL(row.receita)}</td>
                      <td style={{ padding: '10px 20px', fontSize: '0.9rem', textAlign: 'right', color: 'var(--color-danger)' }}>{formatBRL(row.despesa)}</td>
                      <td style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', color: row.saldo >= 0 ? 'var(--text-title)' : 'var(--color-danger)' }}>
                        {formatBRL(row.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
