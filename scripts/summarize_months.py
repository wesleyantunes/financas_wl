import openpyxl
import pandas as pd

wb = openpyxl.load_workbook(r"D:\Develop\financial-manager\dados\Gestão de Despesas (1).xlsx", data_only=True)

monthly_summary = []
for sname in wb.sheetnames:
    ws = wb[sname]
    # find Liquido, Saidas, Entradas, Despesas Fixas, Despesas Variaveis, Economizar
    saidas = None
    entradas = None
    liquido = None
    total_fixas = None
    total_var = None
    total_econ = None
    
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            val = ws.cell(row=r, column=c).value
            if isinstance(val, str):
                v_clean = val.strip().lower()
                if v_clean == 'saídas' or v_clean == 'saidas':
                    # usually next row or neighbor has total
                    saidas = ws.cell(row=r+1, column=c+1).value or ws.cell(row=r, column=c+1).value
                elif v_clean == 'entradas':
                    # scan down until Total
                    for r2 in range(r, min(r + 15, ws.max_row + 1)):
                        if str(ws.cell(row=r2, column=c).value).strip().lower() == 'total':
                            entradas = ws.cell(row=r2, column=c+1).value
                            break
                elif v_clean == 'líquido' or v_clean == 'liquido':
                    liquido = ws.cell(row=r, column=c+1).value
    
    monthly_summary.append({
        'sheet': sname,
        'saidas': saidas,
        'entradas': entradas,
        'liquido': liquido
    })

df = pd.DataFrame(monthly_summary)
print(df.to_string())

