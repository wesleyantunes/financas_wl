import openpyxl
import pandas as pd
import json

wb = openpyxl.load_workbook(r"D:\Develop\financial-manager\dados\Gestão de Despesas (1).xlsx", data_only=True)
sheets_27 = ['Janeiro_27', 'Fevereiro_27', 'Março_27', 'Abril_27', 'Maio_27']

def parse_val(v):
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    v_str = str(v).strip().replace('R$', '').replace(' ', '')
    try:
        if ',' in v_str and '.' in v_str:
            v_str = v_str.replace('.', '').replace(',', '.')
        elif ',' in v_str:
            v_str = v_str.replace(',', '.')
        return float(v_str)
    except:
        return 0.0

month_nums = {
    'Janeiro_27': '2027-01',
    'Fevereiro_27': '2027-02',
    'Março_27': '2027-03',
    'Abril_27': '2027-04',
    'Maio_27': '2027-05'
}

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
    if any(k in n for k in ['internet', 'energia', 'agua', 'água', 'casa', 'iptu', 'ração', 'racao', 'banho', 'iptv', 'reserva']):
        return True
    return False

expenses = []
incomes = []

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
                expenses.append({
                    'date': f"{m_str}-01",
                    'month': m_str,
                    'section': 'Despesas Fixas',
                    'description': name_str,
                    'value': num,
                    'tag': get_tag(name_str, 'Despesas Fixas'),
                    'is_shared': is_shared_item(name_str),
                    'payment_method': 'Boleto' if any(k in name_str.lower() for k in ['energia', 'agua', 'casa', 'internet']) else 'Pix',
                    'user_owner': 'Wesley'
                })
                
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
                pay_method = 'Cartão Wesley' if any(k in name_str.lower() for k in ['nubank', 'sicredi']) else 'Pix'
                owner = 'Luana' if 'c. luana' in name_str.lower() else 'Wesley'
                expenses.append({
                    'date': f"{m_str}-01",
                    'month': m_str,
                    'section': 'Despesas Variáveis',
                    'description': name_str,
                    'value': num,
                    'tag': get_tag(name_str, 'Despesas Variáveis'),
                    'is_shared': is_shared_item(name_str),
                    'payment_method': pay_method,
                    'user_owner': owner
                })
                
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
                expenses.append({
                    'date': f"{m_str}-01",
                    'month': m_str,
                    'section': 'Economizar',
                    'description': name_str,
                    'value': num,
                    'tag': 'Investimentos',
                    'is_shared': True if 'reserva' in name_str.lower() else False,
                    'payment_method': 'Pix',
                    'user_owner': 'Wesley'
                })
                
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
                        'date': f"{m_str}-01",
                        'month': m_str,
                        'description': name_str,
                        'value': num,
                        'tag': get_tag(name_str, 'Entradas'),
                        'user_owner': 'Luana' if any(k in name_str.lower() for k in ['luana', 'rosi']) else 'Wesley'
                    })

print(f"Total 2027 Expenses to load: {len(expenses)}")
print(f"Total 2027 Incomes to load: {len(incomes)}")

df_exp = pd.DataFrame(expenses)
print("\nExpenses by month:")
print(df_exp.groupby('month')['value'].agg(['count', 'sum']))

df_inc = pd.DataFrame(incomes)
print("\nIncomes by month:")
print(df_inc.groupby('month')['value'].agg(['count', 'sum']))
