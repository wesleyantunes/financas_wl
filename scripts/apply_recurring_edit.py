with open('src/components/RecurringPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_import_api = "import { getMonthData, addExpenses } from '../services/api';"
new_import_api = "import { getMonthData, addExpenses, updateRecurringRule, deleteRecurringRule } from '../services/api';"

old_import_icons = "import { Calendar, Check, AlertCircle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';"
new_import_icons = "import { Calendar, Check, AlertCircle, ChevronLeft, ChevronRight, Settings, Pencil, Trash2 } from 'lucide-react';"

content = content.replace(old_import_api, new_import_api)
content = content.replace(old_import_icons, new_import_icons)

# 2. Add state variables
target_state = "  const [activeTab, setActiveTab] = useState<'Todos' | 'Wesley' | 'Luana' | 'Compartilhado'>('Todos');"
new_state = """  const [activeTab, setActiveTab] = useState<'Todos' | 'Wesley' | 'Luana' | 'Compartilhado'>('Todos');

  // Edit recurring rule modal states
  const [showEditModal, setShowEditModal] = useState<RawRecurringRule | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editEstimatedValue, setEditEstimatedValue] = useState('');
  const [editDueDay, setEditDueDay] = useState('10');
  const [editType, setEditType] = useState<'Fixo' | 'Variável'>('Fixo');
  const [editOwner, setEditOwner] = useState<'Wesley' | 'Luana' | 'Compartilhado'>('Compartilhado');
  const [savingEdit, setSavingEdit] = useState(false);"""

content = content.replace(target_state, new_state)

# 3. Add handler functions
target_handlers = "  // Conciliate local rules with actual month expenses/receivables"
new_handlers = """  const handleOpenEdit = (rule: RawRecurringRule) => {
    setShowEditModal(rule);
    setEditDescription(rule.Descrição || rule.desc || '');
    const val = rule.ValorEstimado !== undefined ? rule.ValorEstimado : (rule['Valor Estimado'] !== undefined ? rule['Valor Estimado'] : '');
    setEditEstimatedValue(String(val || ''));
    const day = rule.DiaVencimento || rule['Dia Vencimento'] || rule.DiaRecebimento || rule['Dia Recebimento'] || 10;
    setEditDueDay(String(day));
    setEditType((rule.Tipo || rule.tipo) === 'Variável' ? 'Variável' : 'Fixo');
    const defaultOwner = recurringType === 'receivable' ? 'Wesley' : 'Compartilhado';
    setEditOwner((rule.Dono || rule.dono || defaultOwner) as 'Wesley' | 'Luana' | 'Compartilhado');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    const valNum = parseFloat(editEstimatedValue);
    if (isNaN(valNum) || valNum <= 0) {
      alert('Por favor, insira um valor previsto válido.');
      return;
    }

    const dayNum = parseInt(editDueDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      alert('O dia deve ser entre 1 e 31.');
      return;
    }

    const ruleId = showEditModal.ID || showEditModal.id;
    if (!ruleId) {
      alert('Identificador da regra não encontrado.');
      return;
    }

    setSavingEdit(true);
    try {
      await updateRecurringRule(url, token, ruleId, {
        description: editDescription.trim(),
        estimated_value: valNum,
        due_day: dayNum,
        owner: editOwner,
        category_type: editType
      });

      setShowEditModal(null);
      await fetchMonthData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar regra recorrente.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!showEditModal) return;
    const ruleId = showEditModal.ID || showEditModal.id;
    if (!ruleId) return;

    if (!confirm(`Tem certeza que deseja excluir a regra "${editDescription}"?`)) {
      return;
    }

    setSavingEdit(true);
    try {
      await deleteRecurringRule(url, token, ruleId);
      setShowEditModal(null);
      await fetchMonthData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir regra recorrente.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Conciliate local rules with actual month expenses/receivables"""

content = content.replace(target_handlers, new_handlers)

# 4. Add Edit button to pending list
target_pending_btn = """                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                    </div>"""

new_pending_btn = """                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: 'var(--text-title)', marginRight: '6px' }}>
                        R$ {estimatedVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                      <button 
                        type="button"
                        className="btn btn-secondary" 
                        onClick={() => handleOpenEdit(rule)}
                        title="Editar valor previsto e regra"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Pencil size={14} /> Editar
                      </button>
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={() => handleOpenConfirm(rule)}
                        style={{ width: 'auto', padding: '6px 14px', fontSize: '0.85rem' }}
                      >
                        Confirmar
                      </button>
                    </div>"""

content = content.replace(target_pending_btn, new_pending_btn)

# 5. Add Edit button to paid list
target_paid_btn = """                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        R$ {finalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>"""

new_paid_btn = """                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: 'var(--color-primary)', marginRight: '6px' }}>
                        R$ {finalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                      <button 
                        type="button"
                        className="btn btn-secondary" 
                        onClick={() => handleOpenEdit(rule)}
                        title="Editar valor previsto e regra"
                        style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Pencil size={13} /> Editar Regra
                      </button>
                    </div>"""

content = content.replace(target_paid_btn, new_paid_btn)

# 6. Add Edit Modal before closing </div> of container
target_modal_close = """      {showConfirmModal && (
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
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
              {recurringType === 'expense' ? 'Confirmar Pagamento' : 'Confirmar Recebimento'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Ajuste os dados reais {recurringType === 'expense' ? 'da conta' : 'do recebimento'} <strong>{showConfirmModal.Descrição || showConfirmModal.desc}</strong>
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
                <label className="form-label">
                  {recurringType === 'expense' ? 'Valor Real Pago (R$)' : 'Valor Real Recebido (R$)'}
                </label>
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
                <label className="form-label">
                  {recurringType === 'expense' ? 'Data de Pagamento' : 'Data de Recebimento'}
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  disabled={confirming}
                  required
                />
              </div>
 
              {recurringType === 'expense' && (
                <div className="form-group">
                  <label className="form-label">Meio de Pagamento</label>
                  <select
                    className="form-control"
                    value={confirmPaymentMethod}
                    onChange={(e) => setConfirmPaymentMethod(e.target.value as 'Pix' | 'Cartão Wesley' | 'Cartão Luana' | 'Boleto')}
                    disabled={confirming}
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão Wesley">Cartão Wesley</option>
                    <option value="Cartão Luana">Cartão Luana</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>
              )}

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
      )}"""

edit_modal_code = """

      {/* Modal de Edição da Regra Recorrente */}
      {showEditModal && (
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
          <div className="glass-card" style={{ width: '90%', maxWidth: '440px', padding: '28px', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pencil size={18} style={{ color: 'var(--color-primary)' }} />
              {recurringType === 'expense' ? 'Editar Despesa Recorrente' : 'Editar Recebimento Recorrente'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Altere o valor previsto e as configurações da regra <strong>{showEditModal.Descrição || showEditModal.desc}</strong>
            </p>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input
                  type="text"
                  className="form-control"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={savingEdit}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                  Valor Previsto / Estimado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                  value={editEstimatedValue}
                  onChange={(e) => setEditEstimatedValue(e.target.value)}
                  disabled={savingEdit}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {recurringType === 'expense' ? 'Dia de Vencimento (1 a 31)' : 'Dia de Recebimento (1 a 31)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="form-control"
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(e.target.value)}
                  disabled={savingEdit}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dono / Responsável</label>
                <select
                  className="form-control"
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value as 'Wesley' | 'Luana' | 'Compartilhado')}
                  disabled={savingEdit}
                >
                  {recurringType === 'expense' && <option value="Compartilhado">Compartilhado</option>}
                  <option value="Wesley">Wesley</option>
                  <option value="Luana">Luana</option>
                </select>
              </div>

              {recurringType === 'expense' && (
                <div className="form-group">
                  <label className="form-label">Tipo de Despesa</label>
                  <select
                    className="form-control"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as 'Fixo' | 'Variável')}
                    disabled={savingEdit}
                  >
                    <option value="Fixo">Fixo</option>
                    <option value="Variável">Variável</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteRule}
                  disabled={savingEdit}
                  style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Excluir
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowEditModal(null)}
                    disabled={savingEdit}
                    style={{ width: 'auto', padding: '8px 16px' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={savingEdit}
                    style={{ width: 'auto', padding: '8px 20px' }}
                  >
                    {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}"""

content = content.replace(target_modal_close, target_modal_close + edit_modal_code)

with open('src/components/RecurringPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated RecurringPanel.tsx successfully!")
