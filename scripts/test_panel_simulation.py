import urllib.request
import json

SUPABASE_URL = 'https://svautecmrxrfhdnkadyl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
}

# 1. Fetch recurring rules
req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/recurring_rules?active=eq.true", headers=headers)
with urllib.request.urlopen(req) as resp:
    all_rules = json.loads(resp.read().decode('utf-8'))

# 2. Fetch all expenses
req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/expenses?select=*&order=date.desc", headers=headers)
with urllib.request.urlopen(req) as resp:
    all_expenses = json.loads(resp.read().decode('utf-8'))

# 3. Fetch all incomes
req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/incomes?select=*&order=date.desc", headers=headers)
with urllib.request.urlopen(req) as resp:
    all_incomes = json.loads(resp.read().decode('utf-8'))

print(f"Total Expenses in DB: {len(all_expenses)}")
for e in all_expenses:
    print(f"  {e['id']} | {e['date']} | {e['description']} | R$ {e['value']} | {e['payment_method']}")

print(f"Total Incomes in DB: {len(all_incomes)}")
print(f"Total Recurring Rules in DB: {len(all_rules)}")

months_to_test = ['2027-01', '2027-02', '2027-03', '2027-04', '2027-05']

for m in months_to_test:
    start_date = f"{m}-01"
    end_date = f"{m}-31"
    
    m_expenses = [e for e in all_expenses if start_date <= e['date'] <= end_date]
    m_incomes = [i for i in all_incomes if start_date <= i['date'] <= end_date]
    
    # Matching logic from RecurringPanel.tsx
    matched_exp_ids = set()
    exp_rules = [r for r in all_rules if r['rule_type'] == 'expense']
    
    pending_exp = []
    paid_exp = []
    for r in exp_rules:
        r_desc = r['description'].lower().strip()
        matched = None
        for e in m_expenses:
            if e['id'] in matched_exp_ids:
                continue
            if r_desc in e['description'].lower().strip():
                matched = e
                break
        if matched:
            matched_exp_ids.add(matched['id'])
            paid_exp.append(r)
        else:
            pending_exp.append(r)
            
    # Receivables
    matched_inc_ids = set()
    inc_rules = [r for r in all_rules if r['rule_type'] == 'income']
    pending_inc = []
    paid_inc = []
    for r in inc_rules:
        r_desc = r['description'].lower().strip()
        matched = None
        for i in m_incomes:
            if i['id'] in matched_inc_ids:
                continue
            if r_desc in i['description'].lower().strip():
                matched = i
                break
        if matched:
            matched_inc_ids.add(matched['id'])
            paid_inc.append(r)
        else:
            pending_inc.append(r)
            
    shared_pending = [r for r in pending_exp if r['owner'] == 'Compartilhado']
    wesley_pending = [r for r in pending_exp if r['owner'] == 'Wesley']
    
    print(f"\n[{m}] Recurring Status:")
    print(f"  Despesas: {len(pending_exp)} PENDENTES ({len(shared_pending)} compartilhadas, {len(wesley_pending)} Wesley) | {len(paid_exp)} PAGAS")
    print(f"  Recebimentos: {len(pending_inc)} PENDENTES | {len(paid_inc)} PAGOS/RECEBIDOS")

