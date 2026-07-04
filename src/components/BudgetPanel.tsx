import React, { useState, useEffect, useCallback } from 'react';
import { getBudgets, addBudget, updateBudget, deleteBudget, getMonthData } from '../services/api';
import type { RawBudget, RawExpense } from '../services/api';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Edit2,
  Trash2,
  X,
  Users,
  User,
  AlertCircle,
  Tag as TagIcon
} from 'lucide-react';

interface BudgetPanelProps {
  url: string;
  token: string;
}

interface NormalizedBudget {
  id: string;
  tag: string;
  limit: number;
  owner: 'Wesley' | 'Luana' | 'Compartilhado';
  raw: RawBudget;
}

const DEFAULT_TAGS = ['Alimentação', 'Lazer', 'Transporte', 'Saúde', 'Moradia', 'Educação', 'Supermercado', 'Veículo', 'Pets', 'Outros'];

const parseExpenseValue = (exp: RawExpense): number => {
  const raw = exp.Valor !== undefined ? exp.Valor : exp.valor;
  return typeof raw === 'number' ? raw : parseFloat(String(raw || 0)) || 0;
};

const ownerColor = (owner: 'Wesley' | 'Luana' | 'Compartilhado') =>
  owner === 'Wesley' ? '#00b4d8' : owner === 'Luana' ? '#ff007f' : 'var(--color-primary)';

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ url, token }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [budgets, setBudgets] = useState<RawBudget[]>([]);
  const [wesleyExpenses, setWesleyExpenses] = useState<RawExpense[]>([]);
  const [luanaExpenses, setLuanaExpenses] = useState<RawExpense[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTag, setFormTag] = useState(DEFAULT_TAGS[0]);
  const [formLimit, setFormLimit] = useState('');
  const [formOwner, setFormOwner] = useState<'Wesley' | 'Luana' | 'Compartilhado'>('Compartilhado');
  const [submitting, setSubmitting] = useState(false);

  const [editingBudget, setEditingBudget] = useState<NormalizedBudget | null>(null);
  const [editTag, setEditTag] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editOwner, setEditOwner] = useState<'Wesley' | 'Luana' | 'Compartilhado'>('Compartilhado');
  const [saving, setSaving] = useState(false);

  const [deletingBudget, setDeletingBudget] = useState<NormalizedBudget | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [budgetsRes, monthRes] = await Promise.all([
        getBudgets(url, token),
        getMonthData(url, token, selectedMonth)
      ]);
      setBudgets(budgetsRes.budgets || []);
      setWesleyExpenses(monthRes.wesleyExpenses || []);
      setLuanaExpenses(monthRes.luanaExpenses || []);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao carregar orçamentos.';
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

  const normalizedBudgets: NormalizedBudget[] = budgets.map(b => ({
    id: b.ID || b.id || '',
    tag: b.Tag || b.tag || '',
    limit: parseFloat(String(b['Valor Limite'] !== undefined ? b['Valor Limite'] : (b.valorLimite !== undefined ? b.valorLimite : 0))) || 0,
    owner: ((b.Dono || b.dono || 'Compartilhado') as 'Wesley' | 'Luana' | 'Compartilhado'),
    raw: b
  }));

  const spentForBudget = (budget: NormalizedBudget): number => {
    const matchesTag = (exp: RawExpense) => (exp.Tag || exp.tag || '') === budget.tag;
    if (budget.owner === 'Compartilhado') {
      return [...wesleyExpenses, ...luanaExpenses].filter(matchesTag).reduce((acc, e) => acc + parseExpenseValue(e), 0);
    }
    const list = budget.owner === 'Wesley' ? wesleyExpenses : luanaExpenses;
    return list.filter(matchesTag).reduce((acc, e) => acc + parseExpenseValue(e), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(formLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      alert('Por favor, digite um valor de limite válido.');
      return;
    }

    setSubmitting(true);
    try {
      const id = `orc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await addBudget(url, token, [id, formTag, parsedLimit, formOwner, true]);

      setFormTag(DEFAULT_TAGS[0]);
      setFormLimit('');
      setFormOwner('Compartilhado');
      setIsFormOpen(false);

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cadastrar orçamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (budget: NormalizedBudget) => {
    setEditingBudget(budget);
    setEditTag(budget.tag);
    setEditLimit(String(budget.limit));
    setEditOwner(budget.owner);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    const parsedLimit = parseFloat(editLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      alert('Por favor, digite um valor de limite válido.');
      return;
    }

    setSaving(true);
    try {
      await updateBudget(url, token, editingBudget.id, [editingBudget.id, editTag, parsedLimit, editOwner, true]);
      setEditingBudget(null);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar orçamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;

    setRemoving(true);
    try {
      await deleteBudget(url, token, deletingBudget.id);
      setDeletingBudget(null);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir orçamento.');
    } finally {
      setRemoving(false);
    }
  };

  const renderProgressBar = (spent: number, limit: number) => {
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    const displayPct = Math.min(pct, 100);
    const color = pct < 80 ? 'var(--color-primary)' : pct <= 100 ? 'var(--color-warning)' : 'var(--color-danger)';

    return (
      <div style={{ width: '100%', height: '10px', borderRadius: '6px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
        <div style={{
          width: `${displayPct}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s ease, background-color 0.3s ease'
        }} />
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
          <Target size={18} style={{ color: 'var(--color-primary)', marginRight: '8px', verticalAlign: 'middle' }} />
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

      {/* Formulário Colapsável de Novo Orçamento */}
      <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-title)',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-title)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={18} style={{ color: 'var(--color-primary)' }} />
            Novo Orçamento
          </span>
          {isFormOpen ? <Minus size={18} /> : <Plus size={18} />}
        </button>

        {isFormOpen && (
          <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--border-glass)', animation: 'slide-down 0.3s ease' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '20px'
            }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TagIcon size={14} />
                  Categoria
                </label>
                <select className="form-control" value={formTag} onChange={e => setFormTag(e.target.value)}>
                  {DEFAULT_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Limite Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0,00"
                  value={formLimit}
                  onChange={e => setFormLimit(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dono</label>
                <select
                  className="form-control"
                  value={formOwner}
                  onChange={e => setFormOwner(e.target.value as 'Wesley' | 'Luana' | 'Compartilhado')}
                >
                  <option value="Compartilhado">Compartilhado (Wesley + Luana)</option>
                  <option value="Wesley">Wesley</option>
                  <option value="Luana">Luana</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setIsFormOpen(false)}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn animate-glow"
                disabled={submitting}
                style={{ backgroundColor: 'var(--color-primary)', color: 'hsl(140, 10%, 4%)' }}
              >
                {submitting ? 'Salvando...' : 'Adicionar Orçamento'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de Orçamentos */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card shimmer" style={{ height: '90px', borderRadius: '16px' }}></div>
          <div className="glass-card shimmer" style={{ height: '90px', borderRadius: '16px' }}></div>
        </div>
      ) : normalizedBudgets.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Nenhum orçamento cadastrado ainda. Adicione um limite mensal por categoria acima.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {normalizedBudgets.map(budget => {
            const spent = spentForBudget(budget);
            const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

            return (
              <div key={budget.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ color: 'var(--text-title)', fontSize: '1rem' }}>{budget.tag}</strong>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: ownerColor(budget.owner)
                    }}>
                      {budget.owner === 'Compartilhado' ? <Users size={12} /> : <User size={12} />}
                      {budget.owner}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(budget)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Editar orçamento"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingBudget(budget)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Excluir orçamento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {renderProgressBar(spent, budget.limit)}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: pct > 100 ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: 500 }}>
                    R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} gastos
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Limite: R$ {budget.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edição */}
      {editingBudget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
            <button
              onClick={() => setEditingBudget(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={20} style={{ color: 'var(--color-primary)' }} />
              Editar Orçamento
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select className="form-control" value={editTag} onChange={e => setEditTag(e.target.value)}>
                  {DEFAULT_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Limite Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editLimit}
                  onChange={e => setEditLimit(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dono</label>
                <select
                  className="form-control"
                  value={editOwner}
                  onChange={e => setEditOwner(e.target.value as 'Wesley' | 'Luana' | 'Compartilhado')}
                >
                  <option value="Compartilhado">Compartilhado (Wesley + Luana)</option>
                  <option value="Wesley">Wesley</option>
                  <option value="Luana">Luana</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setEditingBudget(null)}
                  style={{ backgroundColor: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={saving}
                  style={{ backgroundColor: 'var(--color-primary)', color: 'hsl(140, 10%, 4%)' }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deletingBudget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button
              onClick={() => setDeletingBudget(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={20} />
              Excluir Orçamento
            </h3>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '20px' }}>
              Tem certeza que deseja excluir o orçamento de <strong>{deletingBudget.tag}</strong> ({deletingBudget.owner})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setDeletingBudget(null)}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                disabled={removing}
                onClick={handleDelete}
                style={{ backgroundColor: 'var(--color-danger)', color: '#ffffff' }}
              >
                {removing ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
