import React, { useState } from 'react';
import { getMonthData, addExpenses } from '../services/api';
import type { RawExpense } from '../services/api';
import { parseCsvPreview, parseCsv, parseOfx, parsePdfFatura } from '../utils/importParsers';
import type { ParsedTransaction } from '../utils/importParsers';
import { matchExisting } from '../utils/importDedup';
import type { DedupExpenseRef } from '../utils/importDedup';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface ImportPanelProps {
  url: string;
  token: string;
}

type ImportMode = 'csv' | 'ofx' | 'pdf';
type Step = 'upload' | 'mapping' | 'review';

interface ReviewRow {
  data: string;
  descricao: string;
  valor: number;
  status: 'novo' | 'possivel_duplicata';
  matchId?: string;
  selected: boolean;
  tag: string;
  paymentMethod: 'Pix' | 'Cartão Wesley' | 'Cartão Luana' | 'Boleto';
}

const DEFAULT_TAGS = ['Alimentação', 'Lazer', 'Transporte', 'Saúde', 'Moradia', 'Educação', 'Supermercado', 'Veículo', 'Pets', 'Outros'];

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsText(file);
  });
};

export const ImportPanel: React.FC<ImportPanelProps> = ({ url, token }) => {
  const [importMode, setImportMode] = useState<ImportMode>('csv');
  const [selectedOwner, setSelectedOwner] = useState<'Wesley' | 'Luana'>('Wesley');
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // CSV mapping state
  const [csvContent, setCsvContent] = useState('');
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [mapDate, setMapDate] = useState(0);
  const [mapDescription, setMapDescription] = useState(1);
  const [mapValue, setMapValue] = useState(2);
  const [hasHeader, setHasHeader] = useState(true);

  // Review state
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [pdfTotalDetectado, setPdfTotalDetectado] = useState<number | null>(null);
  const [bulkTag, setBulkTag] = useState(DEFAULT_TAGS[0]);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<'Pix' | 'Cartão Wesley' | 'Cartão Luana' | 'Boleto'>('Pix');

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const resetAll = () => {
    setStep('upload');
    setCsvContent('');
    setCsvPreview([]);
    setReviewRows([]);
    setPdfTotalDetectado(null);
    setError('');
  };

  const runDedup = async (parsed: ParsedTransaction[]) => {
    if (parsed.length === 0) {
      setError('Nenhuma transação reconhecida no arquivo enviado.');
      return;
    }

    const months = Array.from(new Set(parsed.map(t => t.data.substring(0, 7)).filter(Boolean)));
    const existingRefs: DedupExpenseRef[] = [];

    const normalize = (list: RawExpense[]): DedupExpenseRef[] =>
      (list || []).map(exp => {
        const valRaw = exp.Valor !== undefined ? exp.Valor : exp.valor;
        const value = typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw || 0)) || 0;
        const rawDate = exp.Data || exp.data || '';
        const date = typeof rawDate === 'string' ? rawDate.split('T')[0] : (rawDate instanceof Date ? rawDate.toISOString().split('T')[0] : '');
        return { id: exp.ID || exp.id || '', date, description: exp.Descrição || exp.desc || '', value };
      });

    for (const month of months) {
      const res = await getMonthData(url, token, month);
      existingRefs.push(...normalize(res.wesleyExpenses || []), ...normalize(res.luanaExpenses || []));
    }

    const classified = matchExisting(parsed, existingRefs);
    setReviewRows(classified.map(c => ({
      data: c.data,
      descricao: c.descricao,
      valor: c.valor,
      status: c.status,
      matchId: c.matchId,
      selected: c.status === 'novo',
      tag: DEFAULT_TAGS[0],
      paymentMethod: 'Pix'
    })));
    setStep('review');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    e.target.value = '';

    if (importMode === 'csv') {
      try {
        const text = await readFileAsText(file);
        setCsvContent(text);
        setCsvPreview(parseCsvPreview(text));
        setStep('mapping');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao ler o CSV.');
      }
      return;
    }

    setProcessing(true);
    try {
      if (importMode === 'ofx') {
        const text = await readFileAsText(file);
        const parsed = parseOfx(text);
        await runDedup(parsed);
      } else {
        const { transacoes, totalDetectado } = await parsePdfFatura(file);
        setPdfTotalDetectado(totalDetectado);
        await runDedup(transacoes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o arquivo.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmMapping = async () => {
    setProcessing(true);
    setError('');
    try {
      const parsed = parseCsv(csvContent, { date: mapDate, description: mapDescription, value: mapValue, hasHeader });
      await runDedup(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o CSV com o mapeamento indicado.');
    } finally {
      setProcessing(false);
    }
  };

  const applyBulk = () => {
    setReviewRows(rows => rows.map(r => r.selected ? { ...r, tag: bulkTag, paymentMethod: bulkPaymentMethod } : r));
  };

  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    setReviewRows(rows => rows.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const removeRow = (index: number) => {
    setReviewRows(rows => rows.filter((_, i) => i !== index));
  };

  const addManualRow = () => {
    setReviewRows(rows => [...rows, {
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      valor: 0,
      status: 'novo',
      selected: true,
      tag: DEFAULT_TAGS[0],
      paymentMethod: 'Pix'
    }]);
  };

  const selectedRows = reviewRows.filter(r => r.selected);
  const selectedSum = selectedRows.reduce((acc, r) => acc + Math.abs(r.valor), 0);
  const totalMismatch = pdfTotalDetectado !== null && Math.abs(selectedSum - pdfTotalDetectado) > 0.01;

  const handleImport = async () => {
    if (selectedRows.length === 0) {
      alert('Selecione ao menos uma transação para importar.');
      return;
    }

    setImporting(true);
    try {
      const rows = selectedRows.map((r, i) => ([
        `imp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        r.data,
        r.descricao,
        Math.abs(r.valor),
        r.tag,
        false,
        '',
        r.paymentMethod,
        ''
      ]));

      await addExpenses(url, token, `Despesas [${selectedOwner}]`, rows);
      setToastMessage(`${rows.length} transação(ões) importada(s) com sucesso!`);
      resetAll();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao importar transações.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      {/* Seletor de Modo */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '4px',
        border: '1px solid var(--border-glass)'
      }}>
        {([
          { key: 'csv', label: 'CSV (Extrato)' },
          { key: 'ofx', label: 'OFX (Extrato)' },
          { key: 'pdf', label: 'PDF (Fatura)' }
        ] as const).map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => { setImportMode(opt.key); resetAll(); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: importMode === opt.key ? 'var(--color-primary)' : 'transparent',
              color: importMode === opt.key ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {opt.label}
          </button>
        ))}
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

      {step === 'upload' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Lançar despesas na aba de</label>
            <select className="form-control" value={selectedOwner} onChange={e => setSelectedOwner(e.target.value as 'Wesley' | 'Luana')}>
              <option value="Wesley">Wesley</option>
              <option value="Luana">Luana</option>
            </select>
          </div>

          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '40px 20px',
            border: '2px dashed var(--border-glass)',
            borderRadius: '12px',
            cursor: processing ? 'wait' : 'pointer',
            textAlign: 'center'
          }}>
            <Upload size={32} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--text-title)', fontWeight: 600 }}>
              {processing ? 'Processando arquivo...' : `Selecionar arquivo ${importMode.toUpperCase()}`}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {importMode === 'csv' && 'Extrato exportado do seu banco em formato .csv'}
              {importMode === 'ofx' && 'Extrato exportado do seu banco em formato .ofx'}
              {importMode === 'pdf' && 'PDF da fatura do cartão baixado do banco'}
            </span>
            <input
              type="file"
              accept={importMode === 'csv' ? '.csv' : importMode === 'ofx' ? '.ofx' : '.pdf'}
              onChange={handleFileSelect}
              disabled={processing}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {step === 'mapping' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
            Indique as colunas do CSV
          </h3>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={e => setHasHeader(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
            />
            A primeira linha é cabeçalho
          </label>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <tbody>
                {csvPreview.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid var(--border-glass)', opacity: ri === 0 && hasHeader ? 0.6 : 1 }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '8px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Coluna da Data</label>
              <select className="form-control" value={mapDate} onChange={e => setMapDate(Number(e.target.value))}>
                {(csvPreview[0] || []).map((_, i) => <option key={i} value={i}>Coluna {i + 1}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Coluna da Descrição</label>
              <select className="form-control" value={mapDescription} onChange={e => setMapDescription(Number(e.target.value))}>
                {(csvPreview[0] || []).map((_, i) => <option key={i} value={i}>Coluna {i + 1}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Coluna do Valor</label>
              <select className="form-control" value={mapValue} onChange={e => setMapValue(Number(e.target.value))}>
                {(csvPreview[0] || []).map((_, i) => <option key={i} value={i}>Coluna {i + 1}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={resetAll} style={{ width: 'auto', padding: '10px 20px' }}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleConfirmMapping} disabled={processing} style={{ width: 'auto', padding: '10px 20px' }}>
              {processing ? 'Processando...' : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {importMode === 'pdf' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'hsla(38, 92%, 58%, 0.1)',
              border: '1px solid var(--color-warning)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--color-warning)',
              fontSize: '0.85rem'
            }}>
              <AlertTriangle size={18} />
              <span>Extração de PDF pode conter erros — revise cada linha antes de confirmar.</span>
            </div>
          )}

          {pdfTotalDetectado !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: totalMismatch ? 'var(--color-danger-glow)' : 'var(--color-primary-glow)',
              border: `1px solid ${totalMismatch ? 'var(--color-danger)' : 'var(--color-primary)'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: totalMismatch ? 'var(--color-danger)' : 'var(--color-primary)',
              fontSize: '0.85rem'
            }}>
              {totalMismatch ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>
                Soma das transações selecionadas: <strong>{formatBRL(selectedSum)}</strong> — Total da fatura detectado: <strong>{formatBRL(pdfTotalDetectado)}</strong>
                {totalMismatch ? ' — confira antes de importar.' : ''}
              </span>
            </div>
          )}

          {/* Ações em Lote */}
          <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', padding: '16px 20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Aplicar Tag aos selecionados</label>
              <select className="form-control" value={bulkTag} onChange={e => setBulkTag(e.target.value)}>
                {DEFAULT_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Aplicar Meio de Pagamento</label>
              <select className="form-control" value={bulkPaymentMethod} onChange={e => setBulkPaymentMethod(e.target.value as 'Pix' | 'Cartão Wesley' | 'Cartão Luana' | 'Boleto')}>
                <option value="Pix">Pix</option>
                <option value="Cartão Wesley">Cartão Wesley</option>
                <option value="Cartão Luana">Cartão Luana</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
            <button className="btn btn-secondary" onClick={applyBulk} style={{ width: 'auto', padding: '10px 16px' }}>
              Aplicar aos selecionados
            </button>
            {importMode === 'pdf' && (
              <button className="btn btn-secondary" onClick={addManualRow} style={{ width: 'auto', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Adicionar linha
              </button>
            )}
            <button className="btn btn-secondary" onClick={resetAll} style={{ width: 'auto', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={16} /> Recomeçar
            </button>
          </div>

          {/* Tabela de Revisão */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}></th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Status</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Data</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Descrição</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>Valor</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tag</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pagamento</th>
                    {importMode === 'pdf' && <th style={{ padding: '10px 12px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {reviewRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={e => updateRow(i, { selected: e.target.checked })}
                          style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {row.status === 'novo' ? (
                          <span className="badge" style={{ backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>Novo</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'var(--color-danger-glow)', color: 'var(--color-danger)' }}>Possível duplicata</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {importMode === 'pdf' ? (
                          <input
                            type="date"
                            className="form-control"
                            value={row.data}
                            onChange={e => updateRow(i, { data: e.target.value })}
                            style={{ padding: '6px 8px', fontSize: '0.85rem', minWidth: '140px' }}
                          />
                        ) : (
                          row.data.split('-').reverse().join('/')
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.9rem' }}>
                        {importMode === 'pdf' ? (
                          <input
                            type="text"
                            className="form-control"
                            value={row.descricao}
                            onChange={e => updateRow(i, { descricao: e.target.value })}
                            style={{ padding: '6px 8px', fontSize: '0.85rem', minWidth: '180px' }}
                          />
                        ) : (
                          row.descricao
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.9rem' }}>
                        {importMode === 'pdf' ? (
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={row.valor}
                            onChange={e => updateRow(i, { valor: parseFloat(e.target.value) || 0 })}
                            style={{ padding: '6px 8px', fontSize: '0.85rem', minWidth: '100px', textAlign: 'right' }}
                          />
                        ) : (
                          formatBRL(row.valor)
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <select
                          className="form-control"
                          value={row.tag}
                          onChange={e => updateRow(i, { tag: e.target.value })}
                          style={{ padding: '6px 8px', fontSize: '0.85rem', minWidth: '130px' }}
                        >
                          {DEFAULT_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <select
                          className="form-control"
                          value={row.paymentMethod}
                          onChange={e => updateRow(i, { paymentMethod: e.target.value as 'Pix' | 'Cartão Wesley' | 'Cartão Luana' | 'Boleto' })}
                          style={{ padding: '6px 8px', fontSize: '0.85rem', minWidth: '130px' }}
                        >
                          <option value="Pix">Pix</option>
                          <option value="Cartão Wesley">Cartão Wesley</option>
                          <option value="Cartão Luana">Cartão Luana</option>
                          <option value="Boleto">Boleto</option>
                        </select>
                      </td>
                      {importMode === 'pdf' && (
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            onClick={() => removeRow(i)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            title="Remover linha"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleImport} disabled={importing} style={{ width: 'auto', padding: '12px 24px' }}>
              {importing ? 'Importando...' : `Importar ${selectedRows.length} Selecionado(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
