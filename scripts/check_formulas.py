import openpyxl

wb = openpyxl.load_workbook(r"D:\Develop\financial-manager\dados\Gestão de Despesas (1).xlsx", data_only=False)

for sname in ['Janeiro_25', 'Maio_25', 'Janeiro_26']:
    ws = wb[sname]
    print(f"\n--- Formulas in {sname} ---")
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            cell = ws.cell(row=r, column=c)
            if cell.value and str(cell.value).startswith('='):
                # print neighbor label
                label = ws.cell(row=r, column=max(1, c-1)).value
                print(f"Cell {cell.coordinate} (left: '{label}'): {cell.value}")

