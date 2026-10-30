import React, { useState, useEffect, useCallback } from 'react';
import { getMonthData, getAcertos, addAcerto } from '../services/api';
import type { RawExpense, RawAcerto } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  AlertCircle,
  CheckCircle2,
  Scale
} from 'lucide-react';

interface SettlementPanelProps {
  url: string;
  token: string;
}

interface SharedExpense {
  id: string;
  date: string;
  description: string;
  value: number;
  tag: string;
  owner: 'Wesley' | 'Luana';
  paidBy: 'Wesley' | 'Luana';
  wesleySplit: number;
}

const parseExpenseValue = (exp: RawExpense): number => {
  const raw = exp.Valor !== undefined ? exp.Valor : exp.valor;
  return typeof raw === 'number' ? raw : parseFloat(String(raw || 0)) || 0;
};

const isExpenseShared = (exp: RawExpense): boolean =>
  exp.Compartilhado === true ||
  exp.Compartilhado === 'true' ||
  exp.Compartilhado === 'TRUE' ||
  String(exp.Compartilhado).toLowerCase() === 'true';

export const SettlementPanel: React.FC<SettlementPanelProps> = ({ url, token }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [acertos, setAcertos] = useState<RawAcerto[]>([]);
  const [settling, setSettling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [monthRes, acertosRes] = await Promise.all([
        getMonthData(url, token, selectedMonth),
        getAcertos(url, token)
      ]);

      const parseList = (list: RawExpense[], owner: 'Wesley' | 'Luana'): SharedExpense[] => {
        return (list || [])
          .filter(isExpenseShared)
          .map(exp => {
            const meioPagamento = exp['Meio de Pagamento'] || exp.meioPagamento || 'Pix';
            let paidBy: 'Wesley' | 'Luana' = owner;
            if (meioPagamento === 'Cartão Wesley') paidBy = 'Wesley';
            else if (meioPagamento === 'Cartão Luana') paidBy = 'Luana';

            const splitRaw = exp['Divisão Wesley (%)'] !== undefined ? exp['Divisão Wesley (%)'] : exp.divisaoWesley;
            const wesleySplit = splitRaw !== undefined && splitRaw !== '' ? (Number(splitRaw) || 50) : 50;

            const rawDate = exp.Data || exp.data || '';
            const dateStr = typeof rawDate === 'string' ? rawDate.split('T')[0] : (rawDate instanceof Date ? rawDate.toISOString().split('T')[0] : '');

            return {
              id: exp.ID || exp.id || '',
              date: dateStr,
              description: exp.Descrição || exp.desc || 'Sem descrição',
              value: parseExpenseValue(exp),
              tag: exp.Tag || exp.tag || 'Outros',
              owner,
              paidBy,
              wesleySplit
            };
          });
      };

      const combined = [
        ...parseList(monthRes.wesleyExpenses || [], 'Wesley'),
        ...parseList(monthRes.luanaExpenses || [], 'Luana')
      ].sort((a, b) => b.date.localeCompare(a.date));

      setSharedExpenses(combined);
      setAcertos(acertosRes.acertos || []);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao carregar dados do acerto de contas.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [url, token, selectedMonth]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        fetchData();
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [fetchData]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dateObj = new Date(y, m - 2, 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${ny}-${nm}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dateObj = new Date(y, m, 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${ny}-${nm}`);
  };

  const getMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    return dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Cálculos: total compartilhado, quanto cada um pagou (via meio de pagamento) e cota justa por despesa
  const totalShared = sharedExpenses.reduce((acc, e) => acc + e.value, 0);
  const wesleyPaid = sharedExpenses.reduce((acc, e) => acc + (e.paidBy === 'Wesley' ? e.value : 0), 0);
  const luanaPaid = sharedExpenses.reduce((acc, e) => acc + (e.paidBy === 'Luana' ? e.value : 0), 0);
  const wesleyFairShare = sharedExpenses.reduce((acc, e) => acc + e.value * (e.wesleySplit / 100), 0);
  const luanaFairShare = sharedExpenses.reduce((acc, e) => acc + e.value * ((100 - e.wesleySplit) / 100), 0);

  // Saldo: positivo = Wesley pagou a mais (Luana deve); negativo = Wesley deve
  const balance = wesleyPaid - wesleyFairShare;
  const isBalanced = Math.abs(balance) <= 0.01;

  const existingAcerto = acertos.find(a => (a['Mes Referencia'] || a.mesReferencia) === selectedMonth);

  const handleSettle = async () => {
    if (isBalanced) return;
    setSettling(true);
    try {
      const id = `acerto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const de = balance > 0 ? 'Luana' : 'Wesley';
      const para = balance > 0 ? 'Wesley' : 'Luana';
      const valor = Math.abs(balance);
      const hoje = new Date().toISOString().split('T')[0];

      await addAcerto(url, token, [id, selectedMonth, valor, de, para, hoje, '']);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao registrar o acerto de contas.');
    } finally {
      setSettling(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Seletor de Mês */}
      <div className="glass-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <button className="btn btn-secondary" onClick={handlePrevMonth} style={{ width: 'auto', padding: '8px 12px' }}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'capitalize', margin: 0, flex: 1, textAlign: 'center' }}>
          <Scale size={18} style={{ color: 'var(--color-primary)', marginRight: '8px', verticalAlign: 'middle' }} />
          {getMonthName(selectedMonth)}
        </h2>
        <button className="btn btn-secondary" onClick={handleNextMonth} style={{ width: 'auto', padding: '8px 12px' }}>
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
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card shimmer" style={{ height: '160px', borderRadius: '16px' }}></div>
          <div className="glass-card shimmer" style={{ height: '160px', borderRadius: '16px' }}></div>
        </div>
      ) : (
        <>
          {/* Resumo do Acerto */}
          <div className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px',
            border: existingAcerto ? '1px solid var(--color-primary)' : (isBalanced ? '1px solid var(--border-glass)' : '1px solid var(--border-active)')
          }}>
            {existingAcerto ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                  <CheckCircle2 size={22} />
                  <strong style={{ fontSize: '1.1rem' }}>Mês Quitado</strong>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {existingAcerto.De || existingAcerto.de} pagou {formatBRL(parseFloat(String(existingAcerto['Valor Acertado'] ?? existingAcerto.valorAcertado ?? 0)))} para {existingAcerto.Para || existingAcerto.para} em{' '}
                  {String(existingAcerto.Data || existingAcerto.data || '').split('T')[0].split('-').reverse().join('/')}.
                </p>
              </>
            ) : isBalanced ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                <CheckCircle2 size={22} />
                <strong style={{ fontSize: '1.1rem' }}>Equilibrado — nenhum acerto pendente</strong>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: balance > 0 ? '#ff007f' : '#00b4d8' }}>
                  <Scale size={22} />
                  <strong style={{ fontSize: '1.2rem' }}>
                    {balance > 0 ? 'Luana deve pagar' : 'Wesley deve pagar'} {formatBRL(Math.abs(balance))} para {balance > 0 ? 'Wesley' : 'Luana'}
                  </strong>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSettle}
                  disabled={settling}
                  style={{ width: 'auto', alignSelf: 'flex-start', padding: '10px 20px' }}
                >
                  {settling ? 'Registrando...' : 'Marcar como Quitado'}
                </button>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Compartilhado</div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-title)' }}>{formatBRL(totalShared)}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} style={{ color: '#00b4d8' }} /> Wesley Pagou
                </div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-title)' }}>{formatBRL(wesleyPaid)}</strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cota justa: {formatBRL(wesleyFairShare)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} style={{ color: '#ff007f' }} /> Luana Pagou
                </div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-title)' }}>{formatBRL(luanaPaid)}</strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cota justa: {formatBRL(luanaFairShare)}</div>
              </div>
            </div>
          </div>

          {/* Lista de Transações Compartilhadas */}
          <div className="glass-card" style={{ padding: '20px 0' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              Despesas Compartilhadas do Mês
            </h3>

            {sharedExpenses.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma despesa compartilhada lançada neste mês.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Data</th>
                      <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Descrição</th>
                      <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pago por</th>
                      <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Divisão</th>
                      <th style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedExpenses.map(exp => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px 20px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {exp.date ? exp.date.split('-').reverse().join('/') : '---'}
                        </td>
                        <td style={{ padding: '10px 20px', fontSize: '0.9rem', color: 'var(--text-title)', fontWeight: 500 }}>
                          {exp.description}
                        </td>
                        <td style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 600, color: exp.paidBy === 'Wesley' ? '#00b4d8' : '#ff007f' }}>
                          {exp.paidBy}
                        </td>
                        <td style={{ padding: '10px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {exp.wesleySplit}% Wesley / {100 - exp.wesleySplit}% Luana
                        </td>
                        <td style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', color: 'var(--text-title)' }}>
                          {formatBRL(exp.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
