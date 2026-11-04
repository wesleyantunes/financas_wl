import pandas as pd
import unicodedata
import json

excel_path = r"D:\Develop\financial-manager\dados\Gestão de Despesas (1).xlsx"
xl = pd.ExcelFile(excel_path)

def normalize_text(text):
    if not isinstance(text, str):
        return ""
    return "".join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c)).lower().strip()

month_map = {
    'janeiro': 1, 'fevereiro': 2, 'marco': 3,
    'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
    'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
}

def parse_sheet_name(name):
    norm = normalize_text(name)
    parts = norm.split('_')
    m_name = parts[0]
    y_str = parts[1]
    year = 2000 + int(y_str) if len(y_str) == 2 else int(y_str)
    month = month_map.get(m_name, 0)
    return year, month

def clean_val(v):
    if pd.isna(v):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    v_str = str(v).strip().replace('R$', '').replace(' ', '')
    try:
        # handle brazilian format 1.234,56
        if ',' in v_str and '.' in v_str:
            v_str = v_str.replace('.', '').replace(',', '.')
        elif ',' in v_str:
            v_str = v_str.replace(',', '.')
        return float(v_str)
    except:
        return None

def parse_all():
    all_records = []
    
    for s in xl.sheet_names:
        year, month = parse_sheet_name(s)
        month_str = f"{year}-{month:02d}"
        df = xl.parse(s, header=None)
        
        # Check if vertical (<= 3 cols or 'Despesas Variáveis' in col 0)
        # Search where 'Despesas Variáveis' is
        col_desp_var = None
        for r in range(min(5, len(df))):
            for c in range(len(df.columns)):
                if 'despesas variaveis' in normalize_text(str(df.iloc[r, c])):
                    col_desp_var = c
                    break
            if col_desp_var is not None:
                break
        
        is_vertical = (col_desp_var == 0 or col_desp_var is None)
        
        records_in_sheet = []
        
        if is_vertical:
            # Layout vertical
            curr_section = None
            for idx, row in df.iterrows():
                val0 = str(row[0]).strip() if pd.notna(row[0]) else ""
                val0_norm = normalize_text(val0)
                
                if 'despesas fixas' in val0_norm:
                    curr_section = 'Despesas Fixas'
                    continue
                elif 'despesas variaveis' in val0_norm:
                    curr_section = 'Despesas Variáveis'
                    continue
                elif 'economizar' in val0_norm:
                    curr_section = 'Economizar'
                    continue
                elif 'entradas' in val0_norm:
                    curr_section = 'Entradas'
                    continue
                elif 'saidas' in val0_norm or 'liquido' in val0_norm:
                    curr_section = None
                    continue
                elif val0_norm == 'total':
                    continue
                
                if curr_section and val0:
                    val_num = clean_val(row[1]) if len(row) > 1 else None
                    obs = str(row[2]).strip() if len(row) > 2 and pd.notna(row[2]) else ""
                    records_in_sheet.append({
                        'month': month_str,
                        'sheet': s,
                        'section': curr_section,
                        'description': val0,
                        'value': val_num,
                        'obs': obs
                    })
        else:
            # Layout horizontal
            # Columns 0, 1, 2: Despesas Fixas
            # Columns 3, 4, 5: Despesas Variáveis
            # Columns 6, 7, 8: Economizar
            # Lower down, Columns 0, 1, 2: Entradas
            
            # Find row index of Entradas and Saídas
            row_entradas = None
            for r in range(len(df)):
                val0_norm = normalize_text(str(df.iloc[r, 0]))
                if 'entradas' in val0_norm:
                    row_entradas = r
                    break
            
            # Process Despesas Fixas (Col 0..2, rows 1 until Total or Saídas)
            for r in range(1, len(df)):
                val0 = str(df.iloc[r, 0]).strip() if pd.notna(df.iloc[r, 0]) else ""
                val0_norm = normalize_text(val0)
                if val0_norm in ['total', 'saidas', 'entradas', 'liquido'] or 'saidas' in val0_norm or 'entradas' in val0_norm:
                    break
                if val0:
                    val_num = clean_val(df.iloc[r, 1]) if df.shape[1] > 1 else None
                    obs = str(df.iloc[r, 2]).strip() if df.shape[1] > 2 and pd.notna(df.iloc[r, 2]) else ""
                    records_in_sheet.append({
                        'month': month_str,
                        'sheet': s,
                        'section': 'Despesas Fixas',
                        'description': val0,
                        'value': val_num,
                        'obs': obs
                    })
            
            # Process Despesas Variáveis (Col 3..5)
            for r in range(1, len(df)):
                val = str(df.iloc[r, 3]).strip() if df.shape[1] > 3 and pd.notna(df.iloc[r, 3]) else ""
                val_norm = normalize_text(val)
                if val_norm == 'total':
                    break
                if val:
                    val_num = clean_val(df.iloc[r, 4]) if df.shape[1] > 4 else None
                    obs = str(df.iloc[r, 5]).strip() if df.shape[1] > 5 and pd.notna(df.iloc[r, 5]) else ""
                    records_in_sheet.append({
                        'month': month_str,
                        'sheet': s,
                        'section': 'Despesas Variáveis',
                        'description': val,
                        'value': val_num,
                        'obs': obs
                    })
            
            # Process Economizar (Col 6..8)
            for r in range(1, len(df)):
                val = str(df.iloc[r, 6]).strip() if df.shape[1] > 6 and pd.notna(df.iloc[r, 6]) else ""
                val_norm = normalize_text(val)
                if val_norm == 'total':
                    break
                if val:
                    val_num = clean_val(df.iloc[r, 7]) if df.shape[1] > 7 else None
                    obs = str(df.iloc[r, 8]).strip() if df.shape[1] > 8 and pd.notna(df.iloc[r, 8]) else ""
                    records_in_sheet.append({
                        'month': month_str,
                        'sheet': s,
                        'section': 'Economizar',
                        'description': val,
                        'value': val_num,
                        'obs': obs
                    })
            
            # Process Entradas (below row_entradas, in Col 0..2)
            if row_entradas is not None:
                for r in range(row_entradas + 1, len(df)):
                    val = str(df.iloc[r, 0]).strip() if pd.notna(df.iloc[r, 0]) else ""
                    val_norm = normalize_text(val)
                    if val_norm in ['total', 'liquido'] or 'liquido' in val_norm:
                        break
                    if val:
                        val_num = clean_val(df.iloc[r, 1]) if df.shape[1] > 1 else None
                        obs = str(df.iloc[r, 2]).strip() if df.shape[1] > 2 and pd.notna(df.iloc[r, 2]) else ""
                        records_in_sheet.append({
                            'month': month_str,
                            'sheet': s,
                            'section': 'Entradas',
                            'description': val,
                            'value': val_num,
                            'obs': obs
                        })
        
        all_records.extend(records_in_sheet)
        print(f"Sheet {s} ({month_str}): extracted {len(records_in_sheet)} records.")
    
    return all_records

records = parse_all()
print(f"\nTotal records extracted across all 29 sheets: {len(records)}")

df_all = pd.DataFrame(records)
print("\nBreakdown by section:")
print(df_all['section'].value_counts())

print("\nMissing/None values count by section:")
print(df_all[df_all['value'].isna()]['section'].value_counts())

print("\nSample records with None values:")
print(df_all[df_all['value'].isna()][['month', 'section', 'description', 'obs']].head(10))
