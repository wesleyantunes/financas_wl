import React, { useState, useEffect, useCallback } from 'react';
import { 
  getMonthData, 
  deleteExpense, 
  updateExpense, 
  deleteInstallments, 
  updateInstallments 
} from '../services/api';
import type { RawExpense } from '../services/api';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  Users, 
  User, 
  X,
  Check
} from 'lucide-react';

interface HistoryPanelProps {
  url: string;
  token: string;
  currentUser: 'Wesley' | 'Luana';
}

interface NormalizedExpense {
  id: string;
  date: string;
  description: string;
  value: number;
  tag: string;
  isShared: boolean;
  installmentGroupId: string;
  owner: 'Wesley' | 'Luana';
  raw: RawExpense;
}

const DEFAULT_TAGS = ['Alimentação', 'Lazer', 'Transporte', 'Saúde', 'Moradia', 'Educação', 'Supermercado', 'Outros'];

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ url, token }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState<NormalizedExpense[]>([]);

  // Filter States
  const [ownerFilter, setOwnerFilter] = useState<'Todos' | 'Wesley' | 'Luana'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit State
  const [editingExpense, setEditingExpense] = useState<NormalizedExpense | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editIsShared, setEditIsShared] = useState(false);
  const [editApplyFuture, setEditApplyFuture] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingExpense, setDeletingExpense] = useState<NormalizedExpense | null>(null);
  const [deleteOption, setDeleteOption] = useState<'single' | 'future' | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMonthData(url, token, selectedMonth);
      
      const parseList = (list: RawExpense[], owner: 'Wesley' | 'Luana'): NormalizedExpense[] => {
        return (list || []).map(exp => {
          const valRaw = exp.Valor !== undefined ? exp.Valor : exp.valor;
          const valor = typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw || 0)) || 0;
          
          const isShared = exp.Compartilhado === true || 
                           exp.Compartilhado === 'true' || 
                           exp.Compartilhado === 'TRUE' || 
                           String(exp.Compartilhado).toLowerCase() === 'true';
                           
          const rawDate = exp.Data || exp.data || '';
          let dateStr = '';
          if (rawDate) {
            if (typeof rawDate === 'string') {
              dateStr = rawDate.split('T')[0];
            } else if (rawDate instanceof Date) {
              dateStr = rawDate.toISOString().split('T')[0];
            }
          }
          
          return {
            id: exp.ID || exp.id || '',
            date: dateStr,
            description: exp.Descrição || exp.desc || 'Sem descrição',
            value: valor,
            tag: exp.Tag || exp.tag || 'Outros',
            isShared,
            installmentGroupId: exp['ID Parcelamento'] || '',
            owner,
            raw: exp
          };
        });
      };

      const wesleyParsed = parseList(res.wesleyExpenses, 'Wesley');
      const luanaParsed = parseList(res.luanaExpenses, 'Luana');
      
      // Ordenar por data decrescente (mais recente primeiro)
      const combined = [...wesleyParsed, ...luanaParsed].sort((a, b) => b.date.localeCompare(a.date));
      setExpenses(combined);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao carregar histórico.';
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
        fetchExpenses();
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [fetchExpenses]);

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

  // Open forms/modals
  const handleOpenEdit = (exp: NormalizedExpense) => {
    setEditingExpense(exp);
    setEditDescription(exp.description.replace(/\s*\(\d{2}\/\d{2}\)$/, '')); // Remove (XX/YY) se for parcelado ao preencher o form
    setEditValue(String(exp.value));
    setEditDate(exp.date);
    setEditTag(exp.tag);
    setEditIsShared(exp.isShared);
    setEditApplyFuture(false);
  };

  const handleOpenDelete = (exp: NormalizedExpense) => {
    setDeletingExpense(exp);
    setDeleteOption(exp.installmentGroupId ? null : 'single');
  };

  // Save changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const parsedVal = parseFloat(editValue);
    if (isNaN(parsedVal) || parsedVal <= 0) {
      alert('Por favor, digite um valor válido.');
      return;
    }

    setSaving(true);
    try {
      const tabName = `Despesas [${editingExpense.owner}]`;
      
      if (editingExpense.installmentGroupId && editApplyFuture) {
        // Atualização futura/coletiva
        await updateInstallments(
          url,
          token,
          tabName,
          editingExpense.installmentGroupId,
          editingExpense.date, // a partir desta parcela inclusive
          {
            Descrição: editDescription.trim(),
            Valor: parsedVal,
            Tag: editTag,
            Compartilhado: editIsShared
          }
        );
      } else {
        // Atualização individual
        // Formato da linha: [id, date, description, value, tag, isShared, installmentGroupId]
        const descriptionField = editingExpense.installmentGroupId 
          ? (editingExpense.description.match(/\((\d{2}\/\d{2})\)$/) 
              ? `${editDescription.trim()} (${editingExpense.description.match(/\((\d{2}\/\d{2})\)$/)?.[1]})`
              : editDescription.trim())
          : editDescription.trim();

        const expenseArray = [
          editingExpense.id,
          editDate,
          descriptionField,
          parsedVal,
          editTag,
          editIsShared,
          editingExpense.installmentGroupId
        ];

        await updateExpense(url, token, tabName, editingExpense.id, expenseArray);
      }

      setEditingExpense(null);
      await fetchExpenses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar despesa.');
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deletingExpense || !deleteOption) return;

    setRemoving(true);
    try {
      const tabName = `Despesas [${deletingExpense.owner}]`;

      if (deleteOption === 'future' && deletingExpense.installmentGroupId) {
        await deleteInstallments(
          url, 
          token, 
          tabName, 
          deletingExpense.installmentGroupId, 
          deletingExpense.date
        );
      } else {
        await deleteExpense(url, token, tabName, deletingExpense.id);
      }

      setDeletingExpense(null);
      await fetchExpenses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir despesa.');
    } finally {
      setRemoving(false);
    }
  };

  // Apply filters
  const filteredExpenses = expenses.filter(exp => {
    // Owner
    if (ownerFilter !== 'Todos' && exp.owner !== ownerFilter) return false;
    
    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const descMatch = exp.description.toLowerCase().includes(query);
      const tagMatch = exp.tag.toLowerCase().includes(query);
      return descMatch || tagMatch;
    }
    
    return true;
  });

  // Calculate stats for filtered view
  const stats = filteredExpenses.reduce(
    (acc, curr) => {
      if (curr.owner === 'Wesley') {
        acc.wesleyTotal += curr.value;
        if (curr.isShared) acc.wesleyShared += curr.value;
      } else {
        acc.luanaTotal += curr.value;
        if (curr.isShared) acc.luanaShared += curr.value;
      }
      return acc;
    },
    { wesleyTotal: 0, luanaTotal: 0, wesleyShared: 0, luanaShared: 0 }
  );

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Month Selector Card */}
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

      {/* Control Bar (Filters & Search) */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Owner segmented selector */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          {(['Todos', 'Wesley', 'Luana'] as const).map(opt => {
            const isActive = ownerFilter === opt;
            return (
              <button
                key={opt}
                onClick={() => setOwnerFilter(opt)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por descrição ou tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Wesley Stats */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid hsl(200, 100%, 45%)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} style={{ color: 'hsl(200, 100%, 50%)' }} />
            <span>Total Wesley</span>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--text-title)' }}>
            R$ {stats.wesleyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Compartilhado: R$ {stats.wesleyShared.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Luana Stats */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid hsl(330, 100%, 65%)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} style={{ color: 'hsl(330, 100%, 75%)' }} />
            <span>Total Luana</span>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--text-title)' }}>
            R$ {stats.luanaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Compartilhado: R$ {stats.luanaShared.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total General */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} style={{ color: 'var(--color-primary)' }} />
            <span>Total Filtrado</span>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--text-title)' }}>
            R$ {(stats.wesleyTotal + stats.luanaTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Total Compartilhado: R$ {(stats.wesleyShared + stats.luanaShared).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="glass-card" style={{ padding: '16px 20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px 0' }}>
            <div className="shimmer" style={{ height: '40px', borderRadius: '6px' }}></div>
            <div className="shimmer" style={{ height: '40px', borderRadius: '6px' }}></div>
            <div className="shimmer" style={{ height: '40px', borderRadius: '6px' }}></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma despesa localizada com os filtros ativos.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Data</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Dono</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Descrição</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Categoria</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => {
                const formattedDate = exp.date ? exp.date.split('-').reverse().join('/') : '---';
                
                return (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    {/* Date */}
                    <td style={{ padding: '12px 8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>{formattedDate}</td>
                    
                    {/* Owner */}
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 600, 
                        color: exp.owner === 'Wesley' ? 'hsl(200, 100%, 75%)' : 'hsl(330, 100%, 75%)' 
                      }}>
                        {exp.owner}
                      </span>
                    </td>
                    
                    {/* Description */}
                    <td style={{ padding: '12px 8px', fontSize: '0.9rem', color: 'var(--text-title)', fontWeight: 500 }}>
                      {exp.description}
                      {exp.installmentGroupId && (
                        <span style={{ 
                          marginLeft: '6px', 
                          fontSize: '0.75rem', 
                          padding: '1px 6px', 
                          borderRadius: '4px', 
                          background: 'var(--bg-tertiary)', 
                          color: 'var(--color-warning)' 
                        }}>
                          Parcelado
                        </span>
                      )}
                    </td>
                    
                    {/* Category */}
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-individual" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        {exp.tag}
                      </span>
                    </td>
                    
                    {/* Shared vs Individual */}
                    <td style={{ padding: '12px 8px' }}>
                      {exp.isShared ? (
                        <span className="badge badge-shared" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={10} /> Compartilhado
                        </span>
                      ) : (
                        <span className="badge badge-individual" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={10} /> Individual
                        </span>
                      )}
                    </td>
                    
                    {/* Value */}
                    <td style={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-title)', textAlign: 'right' }}>
                      R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    
                    {/* Actions */}
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleOpenEdit(exp)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Editar lançamento"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(exp)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Excluir lançamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingExpense && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '450px', padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-active)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Editar Despesa ({editingExpense.owner})</h3>
              <button 
                onClick={() => setEditingExpense(null)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Descrição */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Descrição</label>
                <input
                  type="text"
                  className="form-control"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              {/* Valor */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              {/* Data */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Data</label>
                <input
                  type="date"
                  className="form-control"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              {/* Categoria */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Categoria / Tag</label>
                <select
                  className="form-control"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  disabled={saving}
                >
                  {DEFAULT_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Compartilhado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  id="editIsShared"
                  checked={editIsShared}
                  onChange={(e) => setEditIsShared(e.target.checked)}
                  disabled={saving}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="editIsShared" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                  Despesa Compartilhada (Divisão 50/50)
                </label>
              </div>

              {/* Future Installments Switch (Only for parcelled ones) */}
              {editingExpense.installmentGroupId && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--color-warning)', 
                  borderRadius: '8px', 
                  padding: '10px 12px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="editApplyFuture"
                      checked={editApplyFuture}
                      onChange={(e) => setEditApplyFuture(e.target.checked)}
                      disabled={saving}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-warning)' }}
                    />
                    <label htmlFor="editApplyFuture" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-warning)', cursor: 'pointer', userSelect: 'none' }}>
                      Atualizar parcelas futuras
                    </label>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '26px' }}>
                    Aplica a alteração de Descrição, Valor, Categoria e Divisão nesta e em todas as parcelas subsequentes.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingExpense(null)}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                  style={{ flex: 1.5 }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingExpense && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '420px', padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-danger)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-title)' }}>Excluir Despesa</h3>
            
            {deletingExpense.installmentGroupId ? (
              // Parcelled flow
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  A despesa <strong>{deletingExpense.description}</strong> é parcelada. Como deseja excluí-la?
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => setDeleteOption('single')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: deleteOption === 'single' ? 'var(--color-primary-glow)' : 'var(--bg-primary)',
                      color: deleteOption === 'single' ? 'var(--color-primary)' : 'var(--text-main)',
                      borderColor: deleteOption === 'single' ? 'var(--color-primary)' : 'var(--border-glass)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Excluir apenas esta parcela</span>
                    {deleteOption === 'single' && <Check size={16} />}
                  </button>
                  
                  <button
                    onClick={() => setDeleteOption('future')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: deleteOption === 'future' ? 'var(--color-danger-glow)' : 'var(--bg-primary)',
                      color: deleteOption === 'future' ? 'var(--color-danger)' : 'var(--text-main)',
                      borderColor: deleteOption === 'future' ? 'var(--color-danger)' : 'var(--border-glass)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block' }}>Excluir esta e todas as futuras</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Apaga esta e as próximas parcelas vinculadas</span>
                    </div>
                    {deleteOption === 'future' && <Check size={16} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setDeletingExpense(null)}
                    disabled={removing}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDelete}
                    disabled={removing || !deleteOption}
                    style={{ flex: 1.5 }}
                  >
                    {removing ? 'Excluindo...' : 'Confirmar Exclusão'}
                  </button>
                </div>
              </div>
            ) : (
              // Standard flow
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Tem certeza que deseja excluir a despesa <strong>{deletingExpense.description}</strong> no valor de <strong>R$ {deletingExpense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>?
                </p>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setDeletingExpense(null)}
                    disabled={removing}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDelete}
                    disabled={removing}
                    style={{ flex: 1.5 }}
                  >
                    {removing ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
