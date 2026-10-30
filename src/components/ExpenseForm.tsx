import React, { useState } from 'react';
import { addExpenses } from '../services/api';
import { Landmark, Calendar, FileText, Tag, Users, RefreshCw, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

interface ExpenseFormProps {
  url: string;
  token: string;
  currentUser: 'Wesley' | 'Luana';
}

const DEFAULT_TAGS = ['Alimentação', 'Lazer', 'Transporte', 'Saúde', 'Moradia', 'Educação', 'Supermercado', 'Veículo', 'Pets', 'Outros'];
const RECEIVABLE_TAGS = ['Salário', 'Freelance', 'Rendimentos', 'Outros'];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ url, token, currentUser }) => {
  const [entryType, setEntryType] = useState<'expense' | 'receivable'>('expense');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTag, setSelectedTag] = useState(DEFAULT_TAGS[0]);
  const [isShared, setIsShared] = useState(false);
  const [wesleySplit, setWesleySplit] = useState(50);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão Wesley' | 'Cartão Luana' | 'Boleto'>('Pix');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const tagsList = entryType === 'expense' ? DEFAULT_TAGS : RECEIVABLE_TAGS;

  const handleEntryTypeChange = (type: 'expense' | 'receivable') => {
    setEntryType(type);
    setSelectedTag(type === 'expense' ? DEFAULT_TAGS[0] : RECEIVABLE_TAGS[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Por favor, digite uma descrição.');
      return;
    }

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      setError('Por favor, digite um valor válido maior que zero.');
      return;
    }

    if (!date) {
      setError('Por favor, insira uma data.');
      return;
    }

    const parsedInstallments = parseInt(installments);
    if (entryType === 'expense' && isInstallment) {
      if (isNaN(parsedInstallments) || parsedInstallments < 2) {
        setError('O número de parcelas deve ser no mínimo 2.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const generatedExpenses: unknown[][] = [];
      const baseDate = new Date(date + 'T00:00:00'); // Carrega em Hora Local do Navegador

      const formatLocalDate = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      if (entryType === 'receivable') {
        const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        generatedExpenses.push([
          id,
          date,
          description,
          parsedValue,
          selectedTag
        ]);
      } else if (isInstallment) {
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
            paymentMethod,
            isShared ? wesleySplit : ''
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
          "", // Sem ID de parcelamento
          paymentMethod,
          isShared ? wesleySplit : ''
        ]);
      }

      const tabName = entryType === 'expense' ? `Despesas [${currentUser}]` : `Recebimentos [${currentUser}]`;
      await addExpenses(url, token, tabName, generatedExpenses);

      // Feedback de Sucesso
      setToastMessage(
        entryType === 'receivable' 
          ? 'Recebimento cadastrado com sucesso!' 
          : isInstallment 
            ? `${parsedInstallments} parcelas gravadas com sucesso!` 
            : 'Despesa cadastrada com sucesso!'
      );

      // Limpeza do formulário
      setDescription('');
      setValue('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedTag(entryType === 'expense' ? DEFAULT_TAGS[0] : RECEIVABLE_TAGS[0]);
      setIsShared(false);
      setWesleySplit(50);
      setIsInstallment(false);
      setInstallments('2');
      setPaymentMethod('Pix');

      setTimeout(() => {
        setToastMessage('');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao enviar o lançamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto' }}>

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

      <div className="glass-card" style={{ width: '100%' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Landmark size={24} style={{ color: 'var(--color-primary)' }} />
          Novo Lançamento
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Inserindo na aba de <strong style={{ color: 'var(--text-title)' }}>
            {entryType === 'expense' ? `Despesas [${currentUser}]` : `Recebimentos [${currentUser}]`}
          </strong>
        </p>

        {/* Switch Despesa/Recebimento */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid var(--border-glass)',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => handleEntryTypeChange('expense')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: entryType === 'expense' ? 'var(--color-primary)' : 'transparent',
              color: entryType === 'expense' ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
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
            Despesa
          </button>
          <button
            type="button"
            onClick={() => handleEntryTypeChange('receivable')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: entryType === 'receivable' ? 'var(--color-primary)' : 'transparent',
              color: entryType === 'receivable' ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
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
            Recebimento
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: 'var(--color-danger-glow)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--color-danger)',
            fontSize: '0.9rem',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Descrição */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-desc">
              <FileText size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Descrição
            </label>
            <input
              id="expense-desc"
              type="text"
              className="form-control"
              placeholder={entryType === 'expense' ? "Ex: Supermercado, Combustível, Aluguel" : "Ex: Salário, Freelance, Rendimentos"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          {/* Valor */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-value">
              Valor (R$)
            </label>
            <input
              id="expense-value"
              type="number"
              step="0.01"
              min="0.01"
              className="form-control"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          {/* Data */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-date">
              <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Data {entryType === 'expense' ? 'de Vencimento / Compra' : 'do Recebimento'}
            </label>
            <input
              id="expense-date"
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Categoria / Tag */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-tag">
              <Tag size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Categoria (Tag)
            </label>
            <select
              id="expense-tag"
              className="form-control"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              disabled={submitting}
              style={{ cursor: 'pointer' }}
            >
              {tagsList.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Meio de Pagamento (somente para despesas) */}
          {entryType === 'expense' && (
            <div className="form-group">
              <label className="form-label" htmlFor="expense-payment-method">
                <CreditCard size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Meio de Pagamento
              </label>
              <select
                id="expense-payment-method"
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'Pix' | 'Cartão Wesley' | 'Cartão Luana' | 'Boleto')}
                disabled={submitting}
                style={{ cursor: 'pointer' }}
              >
                <option value="Pix">Pix</option>
                <option value="Cartão Wesley">Cartão Wesley</option>
                <option value="Cartão Luana">Cartão Luana</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
          )}

          {/* Toggles (Compartilhado & Parcelado) */}
          {entryType === 'expense' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)'
            }}>
              {/* Compartilhado */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  disabled={submitting}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--color-primary)',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  Compartilhado
                </span>
              </label>

              {/* Parcelado */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  disabled={submitting}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--color-primary)',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={14} style={{ color: 'var(--text-muted)' }} />
                  Parcelado
                </span>
              </label>
            </div>
          )}

          {/* Divisão da Despesa Compartilhada */}
          {entryType === 'expense' && isShared && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              animation: 'fade-in 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 500 }}>
                <span style={{ color: '#00b4d8' }}>Wesley {wesleySplit}%</span>
                <span style={{ color: 'var(--text-muted)' }}>Divisão</span>
                <span style={{ color: '#ff007f' }}>Luana {100 - wesleySplit}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={wesleySplit}
                onChange={(e) => setWesleySplit(Number(e.target.value))}
                disabled={submitting}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>
          )}

          {/* Campos Adicionais de Parcelamento */}
          {entryType === 'expense' && isInstallment && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              animation: 'slide-down 0.2s ease',
              textAlign: 'left'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="expense-installments">
                  Número de Parcelas
                </label>
                <input
                  id="expense-installments"
                  type="number"
                  min="2"
                  max="120"
                  className="form-control"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {value && !isNaN(parseFloat(value)) && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Valor estimado por parcela:</span>
                  <strong style={{ color: 'var(--color-primary)' }}>
                    R$ {(parseFloat(value) / (parseInt(installments) || 2)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ flex: 2 }}
            >
              {submitting ? 'Gravando...' : 'Confirmar Lançamento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
