import pandas as pd
from inspect_excel import parse_all

records = parse_all()
df = pd.DataFrame(records)

print("\n--- Unique Descriptions in Despesas Fixas ---")
print(df[df['section'] == 'Despesas Fixas']['description'].value_counts())

print("\n--- Unique Descriptions in Despesas Variáveis ---")
print(df[df['section'] == 'Despesas Variáveis']['description'].value_counts())

print("\n--- Unique Descriptions in Entradas ---")
print(df[df['section'] == 'Entradas']['description'].value_counts())

print("\n--- Unique Descriptions in Economizar ---")
print(df[df['section'] == 'Economizar']['description'].value_counts())

print("\n--- Unique Obs values across all sections ---")
print(df['obs'].value_counts().head(30))

