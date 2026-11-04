import openpyxl
import urllib.request
import json
import os

SUPABASE_URL = "https://svautecmrxrfhdnkadyl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU"

EXCEL_PATH = r"D:\Develop\financial-manager\dados\Gestão de Despesas (1).xlsx"

sheets_27 = ['Janeiro_27', 'Fevereiro_27', 'Março_27', 'Abril_27', 'Maio_27']

month_nums = {
    'Janeiro_27': '2027-01',
    'Fevereiro_27': '2027-02',
    'Março_27': '2027-03',
    'Abril_27': '2027-04',
    'Maio_27': '2027-05'
}

def parse_val(v):
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return round(float(v), 2)
    v_str = str(v).strip().replace('R$', '').replace(' ', '')
    try:
        if ',' in v_str and '.' in v_str:
            v_str = v_str.replace('.', '').replace(',', '.')
        elif ',' in v_str:
            v_str = v_str.replace(',', '.')
        return round(float(v_str), 2)
    except:
        return 0.0

def get_tag(name, section):
    if section == 'Economizar':
        return 'Investimentos'
    if section == 'Entradas':
        if 'salário' in name.lower() or 'salario' in name.lower():
            return 'Salário'
        return 'Outros'
    n = name.lower()
    if any(k in n for k in ['internet', 'energia', 'agua', 'água', 'casa', 'condomínio', 'iptu', 'consórcio serviços', 'consorcio servicos', 'telefone']):
        return 'Moradia'
    if any(k in n for k in ['carro', 'combustível', 'combustivel', 'seguro carro', 'consórcio carro', 'consorcio carro']):
        return 'Veículo'
    if any(k in n for k in ['ração', 'racao', 'banho', 'cacau', 'izy', 'nina', 'vacina']):
        return 'Pets'
    if any(k in n for k in ['spotify', 'netflix', 'prime', 'iptv', 'apple', 'meli', 'drive', 'youtube']):
        return 'Lazer'
    if any(k in n for k in ['cabelo', 'academia', 'unimed', 'saúde', 'saude']):
        return 'Saúde'
    if any(k in n for k in ['faculdade', 'curso', 'educação', 'educacao']):
        return 'Educação'
    if any(k in n for k in ['mercado', 'supermercado']):
        return 'Supermercado'
    return 'Outros'

def is_shared_item(name):
    n = name.lower()
    if any(k in n for k in ['internet', 'energia', 'agua', 'água', 'casa', 'iptu', 'ração', 'racao', 'banho', 'iptv']):
        return True
    return False

def get_payment_method(name, section):
    n = name.lower()
    if any(k in n for k in ['sicredi', 'nubank']):
        return 'Cartão Wesley'
    if any(k in n for k in ['energia', 'agua', 'água', 'casa', 'internet', 'iptu']):
        return 'Boleto'
    return 'Pix'

def get_user_owner(name):
    n = name.lower()
    if any(k in n for k in ['c. luana', 'luana', 'rosi']):
        return 'Luana'
    return 'Wesley'

def extract_data():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    expenses = []
    incomes = []
    
    exp_idx = 1
    inc_idx = 1
    
    for sname in sheets_27:
        ws = wb[sname]
        m_str = month_nums[sname]
        
        # 1. Despesas Fixas (Col 1 & 2)
        for r in range(2, 25):
            name = ws.cell(row=r, column=1).value
            val = ws.cell(row=r, column=2).value
            if name and str(name).strip().lower() == 'total':
                break
            if name and val is not None:
                num = parse_val(val)
                if num > 0:
                    name_str = str(name).strip()
                    inst_id = None
                    if 'seguro carro' in name_str.lower():
                        inst_id = 'inst_seguro_carro_2027'
                    
                    expenses.append({
                        'id': f"exp_{m_str.replace('-', '')}_{exp_idx:03d}",
                        'user_owner': get_user_owner(name_str),
                        'date': f"{m_str}-01",
                        'description': name_str,
                        'value': num,
                        'tag': get_tag(name_str, 'Despesas Fixas'),
                        'is_shared': is_shared_item(name_str),
                        'installment_group_id': inst_id,
                        'payment_method': get_payment_method(name_str, 'Despesas Fixas')
                    })
                    exp_idx += 1
                    
        # 2. Despesas Variáveis (Col 4 & 5)
        for r in range(2, 25):
            name = ws.cell(row=r, column=4).value
            val = ws.cell(row=r, column=5).value
            if name and str(name).strip().lower() == 'total':
                break
            if name and val is not None:
                num = parse_val(val)
                if num > 0:
                    name_str = str(name).strip()
                    inst_id = None
                    if 'mãe (kit)' in name_str.lower() or 'mae (kit)' in name_str.lower():
                        inst_id = 'inst_mae_kit'
                        
                    expenses.append({
                        'id': f"exp_{m_str.replace('-', '')}_{exp_idx:03d}",
                        'user_owner': get_user_owner(name_str),
                        'date': f"{m_str}-01",
                        'description': name_str,
                        'value': num,
                        'tag': get_tag(name_str, 'Despesas Variáveis'),
                        'is_shared': is_shared_item(name_str),
                        'installment_group_id': inst_id,
                        'payment_method': get_payment_method(name_str, 'Despesas Variáveis')
                    })
                    exp_idx += 1
                    
        # 3. Economizar -> Investimentos (Col 7 & 8)
        for r in range(2, 10):
            name = ws.cell(row=r, column=7).value
            val = ws.cell(row=r, column=8).value
            if name and str(name).strip().lower() == 'total':
                break
            if name and val is not None:
                num = parse_val(val)
                if num > 0:
                    name_str = str(name).strip()
                    inst_id = None
                    if 'celular' in name_str.lower():
                        inst_id = 'inst_celular_invest'
                        
                    expenses.append({
                        'id': f"exp_{m_str.replace('-', '')}_{exp_idx:03d}",
                        'user_owner': get_user_owner(name_str),
                        'date': f"{m_str}-01",
                        'description': name_str,
                        'value': num,
                        'tag': 'Investimentos',
                        'is_shared': False,
                        'installment_group_id': inst_id,
                        'payment_method': 'Pix'
                    })
                    exp_idx += 1
                    
        # 4. Entradas (Col 1 & 2 after 'Entradas')
        in_entradas = False
        for r in range(20, ws.max_row + 1):
            name = ws.cell(row=r, column=1).value
            val = ws.cell(row=r, column=2).value
            if name and 'entradas' in str(name).lower():
                in_entradas = True
                continue
            if in_entradas:
                if name and str(name).strip().lower() in ['total', 'líquido', 'liquido']:
                    break
                if name and val is not None:
                    num = parse_val(val)
                    if num > 0:
                        name_str = str(name).strip()
                        incomes.append({
                            'id': f"inc_{m_str.replace('-', '')}_{inc_idx:03d}",
                            'user_owner': get_user_owner(name_str),
                            'date': f"{m_str}-01",
                            'description': name_str,
                            'value': num,
                            'tag': get_tag(name_str, 'Entradas')
                        })
                        inc_idx += 1
                        
    return expenses, incomes

def generate_recurring_rules():
    rules = [
        # Despesas Fixas
        {'id': 'rec_exp_01', 'rule_type': 'expense', 'description': 'Internet', 'estimated_value': 130.00, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_02', 'rule_type': 'expense', 'description': 'Dízimo', 'estimated_value': 500.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_03', 'rule_type': 'expense', 'description': 'Casa', 'estimated_value': 1600.00, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_04', 'rule_type': 'expense', 'description': 'Energia', 'estimated_value': 250.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_05', 'rule_type': 'expense', 'description': 'Agua', 'estimated_value': 120.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_06', 'rule_type': 'expense', 'description': 'Academia', 'estimated_value': 110.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_07', 'rule_type': 'expense', 'description': 'Cabelo', 'estimated_value': 70.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_08', 'rule_type': 'expense', 'description': 'Spotify', 'estimated_value': 22.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_09', 'rule_type': 'expense', 'description': 'Drive', 'estimated_value': 10.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_10', 'rule_type': 'expense', 'description': 'IPTV', 'estimated_value': 35.00, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_11', 'rule_type': 'expense', 'description': 'Apple', 'estimated_value': 35.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_12', 'rule_type': 'expense', 'description': 'Meli+', 'estimated_value': 28.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_13', 'rule_type': 'expense', 'description': 'Telefone', 'estimated_value': 60.00, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_14', 'rule_type': 'expense', 'description': 'Combustível', 'estimated_value': 400.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Variável', 'active': True},
        {'id': 'rec_exp_15', 'rule_type': 'expense', 'description': 'Ração', 'estimated_value': 170.00, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_16', 'rule_type': 'expense', 'description': 'Banho Izy e Cacau', 'estimated_value': 170.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_17', 'rule_type': 'expense', 'description': 'Consórcio Carro', 'estimated_value': 427.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_18', 'rule_type': 'expense', 'description': 'Consórcio Serviços', 'estimated_value': 212.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_19', 'rule_type': 'expense', 'description': 'Guardar', 'estimated_value': 2000.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Investimento', 'active': True},
        
        # Recebimentos
        {'id': 'rec_inc_01', 'rule_type': 'income', 'description': 'Salário', 'estimated_value': 4600.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_inc_02', 'rule_type': 'income', 'description': 'Alimentação', 'estimated_value': 1000.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_inc_03', 'rule_type': 'income', 'description': 'Mãe 21/36', 'estimated_value': 320.80, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_inc_04', 'rule_type': 'income', 'description': 'Rosi (Gympass)', 'estimated_value': 70.00, 'due_day': 10, 'owner': 'Luana', 'category_type': 'Fixo', 'active': True},
    ]
    return rules

def post_to_supabase(table, records):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    # Inserção em lotes de 50
    batch_size = 50
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        data = json.dumps(batch, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 201):
                    print(f"[{table}] Lote {i // batch_size + 1} ({len(batch)} itens) inserido com sucesso (HTTP {resp.status})")
                else:
                    print(f"[{table}] Resposta inesperada: {resp.status}")
        except Exception as e:
            if hasattr(e, 'read'):
                err_msg = e.read().decode('utf-8')
                print(f"[{table}] ERRO no lote {i // batch_size + 1}: {e} -> {err_msg}")
            else:
                print(f"[{table}] ERRO: {e}")
            raise e

def main():
    print("Iniciando extração dos dados de 2027 da planilha...")
    expenses, incomes = extract_data()
    rules = generate_recurring_rules()
    
    print(f"Total de Despesas: {len(expenses)} (Valor total: R$ {sum(e['value'] for e in expenses):,.2f})")
    print(f"Total de Receitas: {len(incomes)} (Valor total: R$ {sum(i['value'] for i in incomes):,.2f})")
    print(f"Total de Regras Recorrentes: {len(rules)}")
    
    print("\nEnviando Despesas para o Supabase (public.expenses)...")
    post_to_supabase('expenses', expenses)
    
    print("\nEnviando Receitas para o Supabase (public.incomes)...")
    post_to_supabase('incomes', incomes)
    
    print("\nEnviando Regras Recorrentes para o Supabase (public.recurring_rules)...")
    post_to_supabase('recurring_rules', rules)
    
    print("\nCarga concluída com sucesso!")

if __name__ == '__main__':
    main()

