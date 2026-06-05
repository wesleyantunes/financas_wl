import React, { useState, useEffect } from 'react';
import { addRecurringRule } from '../services/api';
import { PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

interface RecurringConfigProps {
  url: string;
  token: string;
  onRuleAdded: () => void;
  mode: 'expense' | 'receivable';
}

export const RecurringConfig: React.FC<RecurringConfigProps> = ({ url, token, onRuleAdded, mode }) => {
  const [description, setDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [type, setType] = useState<'Fixo' | 'Variável'>('Fixo');
  const [owner, setOwner] = useState<'Wesley' | 'Luana' | 'Compartilhado'>('Compartilhado');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mode === 'receivable') {
      setOwner('Wesley');
    } else {
      setOwner('Compartilhado');
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!description.trim()) {
      setError(mode === 'expense' ? 'Por favor, digite uma descrição para a conta recorrente.' : 'Por favor, digite uma descrição para o recebimento recorrente.');
      return;
    }

    const valueNum = parseFloat(estimatedValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setError('Por favor, digite um valor estimado válido.');
      return;
    }

    const dayNum = parseInt(dueDay);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError(mode === 'expense' ? 'O dia de vencimento deve ser entre 1 e 31.' : 'O dia de recebimento deve ser entre 1 e 31.');
      return;
    }

    setSubmitting(true);

    try {
      const id = mode === 'expense' 
        ? `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        : `recrec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      let rule: unknown[];
      let tabName: string;

      if (mode === 'expense') {
        // Estrutura: ['ID', 'Descrição', 'Valor Estimado', 'Dia Vencimento', 'Tipo', 'Dono', 'Ativo']
        rule = [
          id,
          description.trim(),
          valueNum,
          dayNum,
          type,
          owner,
          true // ativo
        ];
        tabName = 'Recorrentes';
      } else {
        // Estrutura: ['ID', 'Descrição', 'Valor Estimado', 'Dia Recebimento', 'Dono', 'Ativo']
        rule = [
          id,
          description.trim(),
          valueNum,
          dayNum,
          owner === 'Compartilhado' ? 'Wesley' : owner,
          true // ativo
        ];
        tabName = 'Recorrentes Recebimentos';
      }

      await addRecurringRule(url, token, rule, tabName);

      setSuccess(true);
      setDescription('');
      setEstimatedValue('');
      setDueDay('10');
      setType('Fixo');
      if (mode === 'receivable') {
        setOwner('Wesley');
      } else {
        setOwner('Compartilhado');
      }

      // Avisa o pai para atualizar a lista
      onRuleAdded();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar a regra recorrente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ width: '100%', marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-title)' }}>
        <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} />
        {mode === 'expense' ? 'Nova Conta Recorrente' : 'Novo Recebimento Recorrente'}
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
          <span>{mode === 'expense' ? 'Conta recorrente salva com sucesso!' : 'Recebimento recorrente salvo com sucesso!'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Descrição */}
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">
            {mode === 'expense' ? 'Descrição da Conta' : 'Descrição do Recebimento'}
          </label>
          <input
            type="text"
            className="form-control"
            placeholder={mode === 'expense' ? "Ex: Aluguel, Netflix, Água, Academia" : "Ex: Salário Wesley, Pró-labore Luana, Rendimentos"}
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

        {/* Dia Vencimento / Recebimento */}
        <div className="form-group">
          <label className="form-label">
            {mode === 'expense' ? 'Dia de Vencimento' : 'Dia de Recebimento'}
          </label>
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

        {/* Tipo (Fixo / Variável) - Somente para despesas */}
        {mode === 'expense' && (
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
        )}

        {/* Dono (Wesley / Luana / Compartilhado) */}
        <div className="form-group" style={{ gridColumn: mode === 'receivable' ? 'span 2' : 'auto' }}>
          <label className="form-label font-title">Dono / Responsável</label>
          <select
            className="form-control"
            value={owner}
            onChange={(e) => setOwner(e.target.value as any)}
            disabled={submitting}
          >
            {mode === 'expense' && <option value="Compartilhado">Compartilhado (Casal)</option>}
            <option value="Wesley">Wesley (Individual)</option>
            <option value="Luana">Luana (Individual)</option>
          </select>
        </div>

        {/* Botão de Envio */}
        <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Salvando...' : mode === 'expense' ? 'Adicionar Conta Recorrente' : 'Adicionar Recebimento Recorrente'}
          </button>
        </div>

      </form>
    </div>
  );
};
