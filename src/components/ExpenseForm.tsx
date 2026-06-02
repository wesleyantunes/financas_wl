import React, { useState } from 'react';
import { Landmark, Calendar, FileText, Tag, Users, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ExpenseFormProps {
  url: string;
  token: string;
  currentUser: 'Wesley' | 'Luana';
}

const DEFAULT_TAGS = ['Alimentação', 'Lazer', 'Transporte', 'Saúde', 'Moradia', 'Educação', 'Supermercado', 'Outros'];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ url, token, currentUser }) => {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTag, setSelectedTag] = useState(DEFAULT_TAGS[0]);
  const [isShared, setIsShared] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

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

    if (isInstallment) {
      const parsedInstallments = parseInt(installments);
      if (isNaN(parsedInstallments) || parsedInstallments < 2) {
        setError('O número de parcelas deve ser no mínimo 2.');
        return;
      }
    }

    setSubmitting(true);

    try {
      // O algoritmo de parcelamento e envio à API real será implementado no Plan 2.2.
      // Aqui criamos a lógica de validação básica. Em 2.2, chamaremos a API.
      console.log('Sending transaction to:', url, 'with token configured:', !!token);
      
      // Simulação rápida para o Plan 2.1 compilar e demonstrar a navegação
      setToastMessage(isInstallment ? `${installments} parcelas geradas com sucesso!` : 'Despesa cadastrada com sucesso!');
      
      // Limpeza do formulário
      setDescription('');
      setValue('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedTag(DEFAULT_TAGS[0]);
      setIsShared(false);
      setIsInstallment(false);
      setInstallments('2');

      setTimeout(() => {
        setToastMessage('');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar a despesa.');
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
          Inserindo na aba de <strong style={{ color: 'var(--text-title)' }}>Despesas [{currentUser}]</strong>
        </p>

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
              placeholder="Ex: Supermercado Sicredi, Combustível, Aluguel"
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
              Data de Vencimento / Compra
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
              {DEFAULT_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Toggles (Compartilhado & Parcelado) */}
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

          {/* Campos Adicionais de Parcelamento */}
          {isInstallment && (
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
