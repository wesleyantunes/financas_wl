import React, { useState, useEffect, useCallback } from 'react';
import { 
  getMonthData, 
  addExpenses, 
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
  CreditCard, 
  Users, 
  User, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Minus,
  X,
  Tag as TagIcon,
  FileText
} from 'lucide-react';

interface CardInvoicePanelProps {
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
  paymentMethod: string;
  raw: RawExpense;
}

const DEFAULT_TAGS = ['Alimentação', 'Lazer', 'Transporte', 'Saúde', 'Moradia', 'Educação', 'Supermercado', 'Veículo', 'Pets', 'Outros'];

export const CardInvoicePanel: React.FC<CardInvoicePanelProps> = ({ url, token, currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [selectedCard, setSelectedCard] = useState<'Cartão Wesley' | 'Cartão Luana'>('Cartão Wesley');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState<NormalizedExpense[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form States
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(`${selectedMonth}-01`);
  const [selectedTag, setSelectedTag] = useState(DEFAULT_TAGS[0]);
  const [isShared, setIsShared] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const fetchCardExpenses = useCallback(async () => {
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
          
          const meioPagamento = exp['Meio de Pagamento'] || exp.meioPagamento || 'Pix';

          return {
            id: exp.ID || exp.id || '',
            date: dateStr,
            description: exp.Descrição || exp.desc || 'Sem descrição',
            value: valor,
            tag: exp.Tag || exp.tag || 'Outros',
            isShared,
            installmentGroupId: exp['ID Parcelamento'] || '',
            owner,
            paymentMethod: meioPagamento,
            raw: exp
          };
        });
      };

      const wesleyParsed = parseList(res.wesleyExpenses || [], 'Wesley');
      const luanaParsed = parseList(res.luanaExpenses || [], 'Luana');
      
      // Filtrar apenas o cartão ativo
      const combinedExpenses = [...wesleyParsed, ...luanaParsed]
        .filter(exp => exp.paymentMethod === selectedCard)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      setExpenses(combinedExpenses);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao carregar faturas de cartões.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [url, token, selectedMonth, selectedCard]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        fetchCardExpenses();
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [fetchCardExpenses]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dateObj = new Date(y, m - 2, 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newMonth = `${ny}-${nm}`;
    setSelectedMonth(newMonth);
    setDate(`${newMonth}-01`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dateObj = new Date(y, m, 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newMonth = `${ny}-${nm}`;
    setSelectedMonth(newMonth);
    setDate(`${newMonth}-01`);
  };

  const getMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    return dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleOpenEdit = (exp: NormalizedExpense) => {
    setEditingExpense(exp);
    setEditDescription(exp.description.replace(/\s*\(\d{2}\/\d{2}\)$/, ''));
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
        // Atualização em lote de parcelas futuras
        await updateInstallments(
          url,
          token,
          tabName,
          editingExpense.installmentGroupId,
          editingExpense.date,
          {
            Descrição: editDescription.trim(),
            Valor: parsedVal,
            Tag: editTag,
            Compartilhado: editIsShared,
            ['Meio de Pagamento']: selectedCard,
            meioPagamento: selectedCard
          }
        );
      } else {
        // Atualização individual
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
          editingExpense.installmentGroupId,
          selectedCard
        ];

        await updateExpense(url, token, tabName, editingExpense.id, expenseArray);
      }

      setEditingExpense(null);
      setToastMessage('Lançamento atualizado com sucesso!');
      setTimeout(() => setToastMessage(''), 3000);
      await fetchCardExpenses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar lançamento.');
    } finally {
      setSaving(false);
    }
  };

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
      setToastMessage('Lançamento excluído com sucesso!');
      setTimeout(() => setToastMessage(''), 3000);
      await fetchCardExpenses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir lançamento.');
    } finally {
      setRemoving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Por favor, digite uma descrição.');
      return;
    }

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      alert('Por favor, digite um valor válido.');
      return;
    }

    if (!date) {
      alert('Por favor, insira uma data.');
      return;
    }

    const parsedInstallments = parseInt(installments);
    if (isInstallment && (isNaN(parsedInstallments) || parsedInstallments < 2)) {
      alert('O número de parcelas deve ser no mínimo 2.');
      return;
    }

    setSubmitting(true);
    try {
      const generatedExpenses: unknown[][] = [];
      const baseDate = new Date(date + 'T00:00:00');

      const formatLocalDate = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      if (isInstallment) {
        const installmentValue = parseFloat((parsedValue / parsedInstallments).toFixed(2));
        const installmentGroupId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        for (let i = 0; i < parsedInstallments; i++) {
          const targetDate = new Date(baseDate);
          targetDate.setMonth(baseDate.getMonth() + i);

          const formattedDate = formatLocalDate(targetDate);
          const id = `tx_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
          const desc = `${description} (${String(i + 1).padStart(2, '0')}/${String(parsedInstallments).padStart(2, '0')})`;

          generatedExpenses.push([
            id,
            formattedDate,
            desc,
            installmentValue,
            selectedTag,
            isShared,
            installmentGroupId,
            selectedCard
          ]);
        }
      } else {
        const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        generatedExpenses.push([
          id,
          date,
          description,
          parsedValue,
          selectedTag,
          isShared,
          "",
          selectedCard
        ]);
      }

      const tabName = `Despesas [${currentUser}]`;
      await addExpenses(url, token, tabName, generatedExpenses);

      setToastMessage(
        isInstallment 
          ? `${parsedInstallments} parcelas gravadas com sucesso!` 
          : 'Despesa cadastrada com sucesso!'
      );

      // Limpeza do formulário
      setDescription('');
      setValue('');
      setDate(`${selectedMonth}-01`);
      setSelectedTag(DEFAULT_TAGS[0]);
      setIsShared(false);
      setIsInstallment(false);
      setInstallments('2');
      setIsFormOpen(false);

      setTimeout(() => {
        setToastMessage('');
      }, 3000);

      await fetchCardExpenses();

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar o lançamento.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cálculos Financeiros
  const totalInvoice = expenses.reduce((acc, curr) => acc + curr.value, 0);
  const wesleyTotal = expenses.reduce((acc, curr) => acc + (curr.owner === 'Wesley' ? curr.value : 0), 0);
  const luanaTotal = expenses.reduce((acc, curr) => acc + (curr.owner === 'Luana' ? curr.value : 0), 0);
  const sharedTotal = expenses.reduce((acc, curr) => acc + (curr.isShared ? curr.value : 0), 0);

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--color-primary)',
          borderRadius: '8px',
          padding: '12px 24px',
          color: 'var(--color-primary)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fade-in 0.3s ease'
        }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: '500' }}>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho Seletor de Mês e Cartão */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '10px 0'
      }}>
        {/* Seletor de Mês */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '24px',
          padding: '4px 12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button 
            onClick={handlePrevMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span style={{
            fontSize: '1rem',
            fontWeight: '600',
            fontFamily: 'var(--font-title)',
            minWidth: '160px',
            textAlign: 'center',
            textTransform: 'capitalize',
            color: 'var(--text-title)'
          }}>
            {getMonthName(selectedMonth)}
          </span>

          <button 
            onClick={handleNextMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Seleção do Cartão */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid var(--border-glass)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <button
            onClick={() => setSelectedCard('Cartão Wesley')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: selectedCard === 'Cartão Wesley' ? 'var(--color-primary)' : 'transparent',
              color: selectedCard === 'Cartão Wesley' ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <CreditCard size={16} />
            Cartão Wesley
          </button>
          <button
            onClick={() => setSelectedCard('Cartão Luana')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: selectedCard === 'Cartão Luana' ? 'var(--color-primary)' : 'transparent',
              color: selectedCard === 'Cartão Luana' ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <CreditCard size={16} />
            Cartão Luana
          </button>
        </div>
      </div>

      {/* Resumo e Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {/* Total da Fatura */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Total da Fatura</span>
          <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            R$ {totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Wesley Gasto */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} style={{ color: '#00b4d8' }} />
            Gasto Wesley
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-title)' }}>
            R$ {wesleyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Luana Gasto */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} style={{ color: '#ff007f' }} />
            Gasto Luana
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-title)' }}>
            R$ {luanaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Compartilhado */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} style={{ color: 'var(--color-primary)' }} />
            Compartilhado
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-title)' }}>
            R$ {sharedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Formulário Colapsável de Inclusão Rápida */}
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
            fontFamily: 'var(--font-title)',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass-card)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={18} style={{ color: 'var(--color-primary)' }} />
            Lançar Compra no {selectedCard}
          </span>
          {isFormOpen ? <Minus size={18} /> : <Plus size={18} />}
        </button>

        {isFormOpen && (
          <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--border-glass)', animation: 'slide-down 0.3s ease' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '20px'
            }}>
              {/* Descrição */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} />
                  Descrição
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Supermercado Koch"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Valor */}
              <div className="form-group">
                <label className="form-label">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0,00"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              </div>

              {/* Data */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  Data da Compra
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              {/* Tag */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TagIcon size={14} />
                  Categoria
                </label>
                <select
                  className="form-control"
                  value={selectedTag}
                  onChange={e => setSelectedTag(e.target.value)}
                >
                  {DEFAULT_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes de Compartilhamento e Parcelamento */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              margin: '16px 0',
              alignItems: 'center'
            }}>
              {/* Compartilhado */}
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: 'var(--text-main)'
              }}>
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={e => setIsShared(e.target.checked)}
                  style={{
                    accentColor: 'var(--color-primary)',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                Despesa Compartilhada (Dividir 50/50)
              </label>

              {/* Parcelar */}
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: 'var(--text-main)'
              }}>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={e => setIsInstallment(e.target.checked)}
                  style={{
                    accentColor: 'var(--color-primary)',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                Compra Parcelada
              </label>

              {isInstallment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fade-in 0.2s ease' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>em</span>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    className="form-control"
                    style={{ width: '80px', padding: '6px 10px', fontSize: '0.9rem' }}
                    value={installments}
                    onChange={e => setInstallments(e.target.value)}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>vezes</span>
                </div>
              )}
            </div>

            {/* Ações do Formulário */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setIsFormOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn animate-glow"
                disabled={submitting}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'hsl(140, 10%, 4%)'
                }}
              >
                {submitting ? 'Gravando...' : 'Confirmar Lançamento'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de Transações da Fatura */}
      <div className="glass-card" style={{ padding: '24px 0px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} style={{ color: 'var(--color-primary)' }} />
          Itens da Fatura
        </h3>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando transações do cartão...
          </div>
        ) : error ? (
          <div style={{ padding: '24px', margin: '0 24px', border: '1px solid var(--color-danger-glow)', borderRadius: '8px', color: 'var(--color-danger)', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'hsla(0, 84%, 62%, 0.05)' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma despesa lançada neste cartão para o mês selecionado.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Data</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Descrição</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Categoria</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Usuário</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Divisão</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textAlign: 'right' }}>Valor</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr 
                    key={exp.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-glass)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass-card)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Data */}
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                      {(() => {
                        const parts = exp.date.split('-');
                        if (parts.length < 3) return exp.date;
                        return `${parts[2]}/${parts[1]}`;
                      })()}
                    </td>
                    
                    {/* Descrição */}
                    <td style={{ padding: '16px 24px', fontWeight: '500', color: 'var(--text-title)', fontSize: '0.9rem' }}>
                      {exp.description}
                    </td>

                    {/* Tag */}
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {exp.tag}
                      </span>
                    </td>

                    {/* Usuário (Quem gastou) */}
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: exp.owner === 'Wesley' ? '#00b4d8' : '#ff007f',
                        fontWeight: '600'
                      }}>
                        <User size={12} />
                        {exp.owner}
                      </span>
                    </td>

                    {/* Divisão */}
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      {exp.isShared ? (
                        <span style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                          <Users size={14} />
                          Compartilhado
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Individual</span>
                      )}
                    </td>

                    {/* Valor */}
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--text-title)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                      R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'color 0.2s, background-color 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--color-primary)';
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Editar lançamento"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(exp)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'color 0.2s, background-color 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--color-danger)';
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Excluir lançamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingExpense && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', animation: 'scale-up 0.2s ease', position: 'relative' }}>
            <button 
              onClick={() => setEditingExpense(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={20} style={{ color: 'var(--color-primary)' }} />
              Editar Transação do Cartão
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Descrição */}
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input
                  type="text"
                  className="form-control"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  required
                />
              </div>

              {/* Valor */}
              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  required
                />
              </div>

              {/* Data */}
              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  type="date"
                  className="form-control"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  required
                />
              </div>

              {/* Tag */}
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-control"
                  value={editTag}
                  onChange={e => setEditTag(e.target.value)}
                >
                  {DEFAULT_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Compartilhado */}
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}>
                <input
                  type="checkbox"
                  checked={editIsShared}
                  onChange={e => setEditIsShared(e.target.checked)}
                  style={{
                    accentColor: 'var(--color-primary)',
                    width: '16px',
                    height: '16px'
                  }}
                />
                Despesa Compartilhada
              </label>

              {/* Se for parcelado, oferecer edição em lote */}
              {editingExpense.installmentGroupId && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--color-warning)'
                  }}>
                    <input
                      type="checkbox"
                      checked={editApplyFuture}
                      onChange={e => setEditApplyFuture(e.target.checked)}
                      style={{
                        accentColor: 'var(--color-warning)',
                        width: '14px',
                        height: '14px'
                      }}
                    />
                    Aplicar alterações nesta e nas parcelas futuras?
                  </label>
                </div>
              )}

              {/* Ações do Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setEditingExpense(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={saving}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'hsl(140, 10%, 4%)'
                  }}
                >
                  {saving ? 'Gravando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deletingExpense && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', animation: 'scale-up 0.2s ease', position: 'relative' }}>
            <button 
              onClick={() => setDeletingExpense(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={20} />
              Excluir Transação
            </h3>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '16px' }}>
              Tem certeza que deseja excluir a despesa <strong>"{deletingExpense.description}"</strong> de R$ {deletingExpense.value.toFixed(2)}?
            </p>

            {/* Opções de exclusão de parcelados */}
            {deletingExpense.installmentGroupId ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                marginBottom: '20px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="delete-option"
                    checked={deleteOption === 'single'}
                    onChange={() => setDeleteOption('single')}
                    style={{ accentColor: 'var(--color-danger)' }}
                  />
                  Excluir apenas esta parcela
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="delete-option"
                    checked={deleteOption === 'future'}
                    onChange={() => setDeleteOption('future')}
                    style={{ accentColor: 'var(--color-danger)' }}
                  />
                  Excluir esta e todas as parcelas futuras
                </label>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }} />
            )}

            {/* Ações do Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setDeletingExpense(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                disabled={removing || !deleteOption}
                onClick={handleDelete}
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff'
                }}
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
