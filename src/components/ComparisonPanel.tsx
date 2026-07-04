import React, { useState, useEffect, useCallback } from 'react';
import { getMonthlySummaries } from '../services/api';
import type { MonthlySummary } from '../services/api';
import { BarChart2, TrendingUp, TrendingDown, Minus, AlertCircle, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ComparisonPanelProps {
  url: string;
  token: string;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatMonthLabel = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
};

const lastNMonths = (n: number): string[] => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
};

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ url, token }) => {
  const [loading12, setLoading12] = useState(false);
  const [error, setError] = useState('');
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const [segmentByOwner, setSegmentByOwner] = useState(false);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthStr = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const [compareA, setCompareA] = useState(currentMonthStr);
  const [compareB, setCompareB] = useState(previousMonthStr);
  const [compareData, setCompareData] = useState<{ A: MonthlySummary | null; B: MonthlySummary | null }>({ A: null, B: null });
  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading12(true);
      setError('');
      try {
        const months = lastNMonths(12);
        const res = await getMonthlySummaries(url, token, months);
        if (active) setMonthlyData(res.summaries || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Erro ao carregar o comparativo dos últimos 12 meses.');
      } finally {
        if (active) setLoading12(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [url, token]);

  const fetchCompare = useCallback(async () => {
    setLoadingCompare(true);
    try {
      const res = await getMonthlySummaries(url, token, [compareA, compareB]);
      const a = res.summaries.find(s => s.mes === compareA) || null;
      const b = res.summaries.find(s => s.mes === compareB) || null;
      setCompareData({ A: a, B: b });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a comparação de competências.');
    } finally {
      setLoadingCompare(false);
    }
  }, [url, token, compareA, compareB]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) fetchCompare();
    };
    run();
    return () => {
      active = false;
    };
  }, [fetchCompare]);

  const barChartData = monthlyData.map(s => ({
    name: formatMonthLabel(s.mes),
    Wesley: parseFloat((s.porDono?.Wesley || 0).toFixed(2)),
    Luana: parseFloat((s.porDono?.Luana || 0).toFixed(2)),
    Total: parseFloat(s.totalDespesas.toFixed(2))
  }));

  const allTags = Array.from(new Set([
    ...(compareData.A ? Object.keys(compareData.A.porTag) : []),
    ...(compareData.B ? Object.keys(compareData.B.porTag) : [])
  ])).sort();

  const tagRows = allTags.map(tag => {
    const valA = compareData.A?.porTag[tag] || 0;
    const valB = compareData.B?.porTag[tag] || 0;
    const variation = valB > 0 ? ((valA - valB) / valB) * 100 : (valA > 0 ? 100 : 0);
    return { tag, valA, valB, variation };
  });

  const totalA = compareData.A?.totalDespesas || 0;
  const totalB = compareData.B?.totalDespesas || 0;
  const totalVariation = totalB > 0 ? ((totalA - totalB) / totalB) * 100 : (totalA > 0 ? 100 : 0);

  const renderVariation = (variation: number) => {
    if (Math.abs(variation) < 0.5) {
      return <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Minus size={12} /> 0%</span>;
    }
    const isUp = variation > 0;
    return (
      <span style={{ color: isUp ? 'var(--color-danger)' : 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isUp ? '+' : ''}{variation.toFixed(1)}%
      </span>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

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

      {/* Últimos 12 Meses */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
            Evolução dos Últimos 12 Meses
          </h3>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={segmentByOwner}
              onChange={(e) => setSegmentByOwner(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <Users size={14} />
            Segmentar por dono
          </label>
        </div>

        {loading12 ? (
          <div className="shimmer" style={{ height: '300px', borderRadius: '12px' }}></div>
        ) : barChartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Sem dados suficientes para o comparativo.
          </div>
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                {segmentByOwner ? (
                  <>
                    <Bar dataKey="Wesley" fill="#00b4d8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Luana" fill="#ff007f" radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <Bar dataKey="Total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Comparação Pontual */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
          Comparar Duas Competências
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Competência A</label>
            <input
              type="month"
              className="form-control"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Competência B</label>
            <input
              type="month"
              className="form-control"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
            />
          </div>
        </div>

        {loadingCompare ? (
          <div className="shimmer" style={{ height: '200px', borderRadius: '12px' }}></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Categoria</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>{formatMonthLabel(compareA)}</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>{formatMonthLabel(compareB)}</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>Variação</th>
                </tr>
              </thead>
              <tbody>
                {tagRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma despesa lançada nessas competências.
                    </td>
                  </tr>
                ) : (
                  tagRows.map(row => (
                    <tr key={row.tag} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: 'var(--text-title)' }}>{row.tag}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.9rem', textAlign: 'right' }}>{formatBRL(row.valA)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.9rem', textAlign: 'right' }}>{formatBRL(row.valB)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right' }}>{renderVariation(row.variation)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {tagRows.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border-glass)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-title)' }}>Total</td>
                    <td style={{ padding: '12px', fontWeight: 700, textAlign: 'right', color: 'var(--text-title)' }}>{formatBRL(totalA)}</td>
                    <td style={{ padding: '12px', fontWeight: 700, textAlign: 'right', color: 'var(--text-title)' }}>{formatBRL(totalB)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{renderVariation(totalVariation)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
