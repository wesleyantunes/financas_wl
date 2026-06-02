import React, { useState, useEffect } from 'react';
import { getMonthData, addExpenses } from '../services/api';
import { RecurringConfig } from './RecurringConfig';
import { Calendar, Check, AlertCircle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

interface RecurringPanelProps {
  url: string;
  token: string;
  currentUser: 'Wesley' | 'Luana';
}

export const RecurringPanel: React.FC<RecurringPanelProps> = ({ url, token, currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    recurring: any[];
    wesleyExpenses: any[];
    luanaExpenses: any[];
  } | null>(null);

  // Modal and Config form toggles
  const [showConfig, setShowConfig] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<any>(null); // holds rule object when open
  const [confirmValue, setConfirmValue] = useState('');
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');
  const [confirming, setConfirming] = useState(false);

  const fetchMonthData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMonthData(url, token, selectedMonth);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados consolidados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [selectedMonth]);

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

  const handleOpenConfirm = (rule: any) => {
    const [year, monthStr] = selectedMonth.split('-');
    const dayStr = String(rule.DiaVencimento || rule['Dia Vencimento'] || 10).padStart(2, '0');
    
    setShowConfirmModal(rule);
    setConfirmValue(String(rule.ValorEstimado || rule['Valor Estimado'] || ''));
    setConfirmDescription(rule.Descrição || rule.desc || '');
    setConfirmDate(`${year}-${monthStr}-${dayStr}`);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConfirmModal) return;

    const parsedValue = parseFloat(confirmValue);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      alert('Por favor, insira um valor válido.');
      return;
    }

    setConfirming(true);

    try {
      const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const targetUser = showConfirmModal.Dono || showConfirmModal.dono || 'Compartilhado';
      const isShared = targetUser === 'Compartilhado';
      
      const tabName = `Despesas [${isShared ? currentUser : targetUser}]`;
      const ruleTag = 'Recorrentes'; // Tag específica ou herdada

      const expenseRow = [
        id,
        confirmDate,
        confirmDescription,
        parsedValue,
        ruleTag,
        isShared,
        "" // Sem parcelamento
      ];

      await addExpenses(url, token, tabName, [expenseRow]);

      // Fechar modal e atualizar dados
      setShowConfirmModal(null);
      await fetchMonthData();

    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar pagamento.');
    } finally {
      setConfirming(false);
    }
  };

  // Conciliate local rules with actual month expenses
  const allExpenses = [
    ...(data?.wesleyExpenses || []),
    ...(data?.luanaExpenses || [])
  ];

  const conciliatedRules = data?.recurring.map(rule => {
    const ruleDesc = (rule.Descrição || rule.desc || '').toLowerCase();
    
    // Find matching transaction
    const matchedExpense = allExpenses.find(exp => {
      const expDesc = (exp.Descrição || exp.desc || '').toLowerCase();
      return expDesc.includes(ruleDesc);
    });

    return {
      rule,
      isPaid: !!matchedExpense,
      expense: matchedExpense
    };
  }) || [];

  const pendingRules = conciliatedRules.filter(r => !r.isPaid);
  const paidRules = conciliatedRules.filter(r => r.isPaid);

  const getMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Month Selector Header */}
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
          <Calendar size={18} style={{ color: 'var(--color-primary)', marginRight: '8px', verticalAlign: 'middle' }} />
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
          fontSize: '0.9rem',
          textAlign: 'left'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowConfig(!showConfig)}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
        >
          {showConfig ? <Calendar size={16} /> : <Settings size={16} />}
          {showConfig ? 'Ver Pendências' : 'Configurar Contas'}
        </button>
      </div>

      {/* Settings / Config Form */}
      {showConfig ? (
        <RecurringConfig url={url} token={token} onRuleAdded={fetchMonthData} />
      ) : (
        <>
          {/* loading state */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <span className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'inline-block', marginBottom: '16px' }}></span>
              <p style={{ color: 'var(--text-muted)' }}>Sincronizando planilha...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* List of Pending Bills */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Contas Pendentes</span>
                  <span style={{ fontSize: '0.9rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-danger-glow)', fontWeight: 'bold' }}>{pendingRules.length}</span>
                </h3>

                {pendingRules.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                    Tudo pago! Nenhuma conta pendente para este mês.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingRules.map(({ rule }) => {
                      const estimatedVal = rule.ValorEstimado || rule['Valor Estimado'] || 0;
                      const dayVal = rule.DiaVencimento || rule['Dia Vencimento'] || 10;
                      const ownerVal = rule.Dono || rule.dono || 'Compartilhado';
                      const isVar = (rule.Tipo || rule.tipo) === 'Variável';

                      return (
                        <div key={rule.ID || rule.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '8px'
                        }}>
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ display: 'block', color: 'var(--text-title)' }}>{rule.Descrição || rule.desc}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Vence dia {dayVal} • {ownerVal} {isVar && <span style={{ color: 'var(--color-warning)' }}>(Variável)</span>}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <strong style={{ color: 'var(--text-title)' }}>
                              R$ {estimatedVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleOpenConfirm(rule)}
                              style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                              Confirmar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* List of Paid Bills */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Contas Pagas</span>
                  <span style={{ fontSize: '0.9rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-glow)', fontWeight: 'bold' }}>{paidRules.length}</span>
                </h3>

                {paidRules.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                    Nenhum pagamento registrado neste mês ainda.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {paidRules.map(({ rule, expense }) => {
                      const finalVal = expense.Valor || expense.valor || 0;
                      const dateVal = expense.Data || expense.data || '';

                      return (
                        <div key={rule.ID || rule.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '8px',
                          opacity: 0.8
                        }}>
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ display: 'block', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {rule.Descrição || rule.desc}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={12} /> Pago em {dateVal.split('-').reverse().join('/')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>
                              R$ {finalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '420px', padding: '28px', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Confirmar Pagamento</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Ajuste os dados reais da conta <strong>{showConfirmModal.Descrição || showConfirmModal.desc}</strong>
            </p>

            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Descrição Lançada</label>
                <input
                  type="text"
                  className="form-control"
                  value={confirmDescription}
                  onChange={(e) => setConfirmDescription(e.target.value)}
                  disabled={confirming}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Real Pago (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={confirmValue}
                  onChange={(e) => setConfirmValue(e.target.value)}
                  disabled={confirming}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Pagamento</label>
                <input
                  type="date"
                  className="form-control"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  disabled={confirming}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowConfirmModal(null)}
                  disabled={confirming}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={confirming}
                  style={{ flex: 1.5 }}
                >
                  {confirming ? 'Registrando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
