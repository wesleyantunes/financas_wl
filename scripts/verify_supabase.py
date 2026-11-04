import urllib.request
import json
import collections

SUPABASE_URL = 'https://svautecmrxrfhdnkadyl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
}

# 1. Expenses
req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/expenses?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    expenses = json.loads(resp.read().decode('utf-8'))

# 2. Incomes
req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/incomes?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    incomes = json.loads(resp.read().decode('utf-8'))

# 3. Recurring
req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/recurring_rules?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    rules = json.loads(resp.read().decode('utf-8'))

print(f'Supabase Expenses: {len(expenses)} rows | Total: R$ {sum(e["value"] for e in expenses):,.2f}')
print(f'Supabase Incomes: {len(incomes)} rows | Total: R$ {sum(i["value"] for i in incomes):,.2f}')
print(f'Supabase Recurring Rules: {len(rules)} rows')

# Breakdown
exp_by_month = collections.defaultdict(lambda: [0, 0.0])
for e in expenses:
    m = e['date'][:7]
    exp_by_month[m][0] += 1
    exp_by_month[m][1] += float(e['value'])

inc_by_month = collections.defaultdict(lambda: [0, 0.0])
for i in incomes:
    m = i['date'][:7]
    inc_by_month[m][0] += 1
    inc_by_month[m][1] += float(i['value'])

print('\nDespesas por Mês no Supabase:')
for m in sorted(exp_by_month):
    cnt, val = exp_by_month[m]
    print(f'  {m}: {cnt} despesas | R$ {val:,.2f}')

print('\nReceitas por Mês no Supabase:')
for m in sorted(inc_by_month):
    cnt, val = inc_by_month[m]
    print(f'  {m}: {cnt} receitas | R$ {val:,.2f}')

