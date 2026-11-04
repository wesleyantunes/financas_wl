import urllib.request
import json

SUPABASE_URL = 'https://svautecmrxrfhdnkadyl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU'
headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/expenses?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    expenses = json.loads(resp.read().decode('utf-8'))

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/incomes?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    incomes = json.loads(resp.read().decode('utf-8'))

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/recurring_rules?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    rules = json.loads(resp.read().decode('utf-8'))

exp_rules = [r['description'].lower().strip() for r in rules if r['rule_type'] == 'expense']
inc_rules = [r['description'].lower().strip() for r in rules if r['rule_type'] == 'income']

print(f"Total Expenses in DB: {len(expenses)}")
print(f"Total Incomes in DB: {len(incomes)}")
print(f"Expense Rules: {exp_rules}")
print(f"Income Rules: {inc_rules}")

print("\n--- EXPENSES MATCHING ---")
exp_matching = []
exp_non_matching = []
for e in expenses:
    desc = e['description'].lower().strip()
    match = any(r in desc for r in exp_rules)
    if match:
        exp_matching.append(e)
    else:
        exp_non_matching.append(e)

print(f"Matching: {len(exp_matching)}")
print(f"Non-matching: {len(exp_non_matching)}")
for e in exp_non_matching:
    print(f"  Non-matching exp: {e['date']} | {e['description']} | R$ {e['value']}")

print("\n--- INCOMES MATCHING ---")
inc_matching = []
inc_non_matching = []
for i in incomes:
    desc = i['description'].lower().strip()
    match = any(r in desc for r in inc_rules)
    if match:
        inc_matching.append(i)
    else:
        inc_non_matching.append(i)

print(f"Matching: {len(inc_matching)}")
print(f"Non-matching: {len(inc_non_matching)}")
for i in inc_non_matching:
    print(f"  Non-matching inc: {i['date']} | {i['description']} | R$ {i['value']}")
