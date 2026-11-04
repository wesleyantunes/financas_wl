import openpyxl
import pandas as pd
import json

wb = openpyxl.load_workbook(r"D:\Develop\financial-manager\dados\Gestão de Despesas (1).xlsx", data_only=True)
sheets_27 = [s for s in wb.sheetnames if '27' in s]

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

all_expenses = []
all_incomes = []

for sname in sheets_27:
    ws = wb[sname]
    m_str = month_nums[sname]
    
    # Col 0, 1: Despesas Fixas (row 2 to row before Total)
    for r in range(2, 25):
        name = ws.cell(row=r, column=1).value
        val = ws.cell(row=r, column=2).value
        if name and str(name).strip().lower() == 'total':
            break
        if name and val is not None:
            num = parse_val(val)
            if num > 0:
                all_expenses.append({
                    'month': m_str,
                    'section': 'Despesas Fixas',
                    'description': str(name).strip(),
                    'value': num
                })
                
    # Col 3, 4: Despesas Variaveis
    for r in range(2, 25):
        name = ws.cell(row=r, column=3).value
        val = ws.cell(row=r, column=4).value
        if name and str(name).strip().lower() == 'total':
            break
        if name and val is not None:
            num = parse_val(val)
            if num > 0:
                all_expenses.append({
                    'month': m_str,
                    'section': 'Despesas Variáveis',
                    'description': str(name).strip(),
                    'value': num
                })
                
    # Col 6, 7: Economizar (Investimentos)
    for r in range(2, 10):
        name = ws.cell(row=r, column=5).value or ws.cell(row=r, column=6).value or ws.cell(row=r, column=7).value
        # let's find the exact columns in this sheet
        pass

print("Testing parser...")
