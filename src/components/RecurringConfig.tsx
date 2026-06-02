import React, { useState } from 'react';
import { addRecurringRule } from '../services/api';
import { PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

interface RecurringConfigProps {
  url: string;
  token: string;
  onRuleAdded: () => void;
}

export const RecurringConfig: React.FC<RecurringConfigProps> = ({ url, token, onRuleAdded }) => {
  const [description, setDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [type, setType] = useState<'Fixo' | 'Variável'>('Fixo');
  const [owner, setOwner] = useState<'Wesley' | 'Luana' | 'Compartilhado'>('Compartilhado');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!description.trim()) {
      setError('Por favor, digite uma descrição para a conta recorrente.');
      return;
    }

    const valueNum = parseFloat(estimatedValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setError('Por favor, digite um valor estimado válido.');
      return;
    }

    const dayNum = parseInt(dueDay);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError('O dia de vencimento deve ser entre 1 e 31.');
      return;
    }

    setSubmitting(true);

    try {
      const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Estrutura: ['ID', 'Descrição', 'Valor Estimado', 'Dia Vencimento', 'Tipo', 'Dono', 'Ativo']
      const rule = [
        id,
        description.trim(),
        valueNum,
        dayNum,
        type,
        owner,
        true // ativo
      ];

      await addRecurringRule(url, token, rule);

      setSuccess(true);
      setDescription('');
      setEstimatedValue('');
      setDueDay('10');
      setType('Fixo');
      setOwner('Compartilhado');

      // Avisa o pai para atualizar a lista
      onRuleAdded();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar a regra recorrente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ width: '100%', marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-title)' }}>
        <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} />
        Nova Conta Recorrente
      </h3>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--color-danger-glow)',
          border: '1px solid var(--color-danger)',
          borderRadius: '6px',
          padding: '10px 14px',
          color: 'var(--color-danger)',
          fontSize: '0.85rem',
          textAlign: 'left',
          marginBottom: '16px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'hsla(148, 100%, 36%, 0.15)',
          border: '1px solid var(--color-primary)',
          borderRadius: '6px',
          padding: '10px 14px',
          color: 'var(--color-primary)',
          fontSize: '0.85rem',
          textAlign: 'left',
          marginBottom: '16px'
        }}>
          <Sparkles size={16} style={{ flexShrink: 0 }} />
          <span>Regra recorrente salva com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Descrição */}
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Descrição da Conta</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ex: Aluguel, Netflix, Água, Academia"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Valor Estimado */}
        <div className="form-group">
          <label className="form-label">Valor Estimado (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="form-control"
            placeholder="0,00"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Dia Vencimento */}
        <div className="form-group">
          <label className="form-label">Dia de Vencimento</label>
          <input
            type="number"
            min="1"
            max="31"
            className="form-control"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Tipo (Fixo / Variável) */}
        <div className="form-group">
          <label className="form-label">Tipo de Conta</label>
          <select
            className="form-control"
            value={type}
            onChange={(e) => setType(e.target.value as 'Fixo' | 'Variável')}
            disabled={submitting}
          >
            <option value="Fixo">Fixo (Valor idêntico todo mês)</option>
            <option value="Variável">Variável (Valor muda todo mês)</option>
          </select>
        </div>

        {/* Dono (Wesley / Luana / Compartilhado) */}
        <div className="form-group">
          <label className="form-label font-title">Dono / Responsável</label>
          <select
            className="form-control"
            value={owner}
            onChange={(e) => setOwner(e.target.value as 'Wesley' | 'Luana' | 'Compartilhado')}
            disabled={submitting}
          >
            <option value="Compartilhado">Compartilhado (Casal)</option>
            <option value="Wesley">Wesley (Individual)</option>
            <option value="Luana">Luana (Individual)</option>
          </select>
        </div>

        {/* Botão de Envio */}
        <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Adicionar Conta Recorrente'}
          </button>
        </div>

      </form>
    </div>
  );
};
