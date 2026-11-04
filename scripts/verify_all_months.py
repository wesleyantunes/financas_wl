import urllib.request
import json

SUPABASE_URL = 'https://svautecmrxrfhdnkadyl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU'
headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}

months = ['2027-01', '2027-02', '2027-03', '2027-04', '2027-05']

# Recurring rules
req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/recurring_rules?active=eq.true", headers=headers)
with urllib.request.urlopen(req) as resp:
    rules = json.loads(resp.read().decode('utf-8'))

import calendar

for m in months:
    y, mon = map(int, m.split('-'))
    last_day = calendar.monthrange(y, mon)[1]
    start_date = f"{m}-01"
    end_date = f"{m}-{last_day:02d}"

    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/expenses?date=gte.{start_date}&date=lte.{end_date}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        m_expenses = json.loads(resp.read().decode('utf-8'))

    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/incomes?date=gte.{start_date}&date=lte.{end_date}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        m_incomes = json.loads(resp.read().decode('utf-8'))

    # Check recurring receivables
    inc_rules = [r for r in rules if r['rule_type'] == 'income']
    matched_inc_ids = set()
    pending_inc = []
    paid_inc = []
    for r in inc_rules:
        r_desc = r['description'].lower().strip()
        matched = next((i for i in m_incomes if i['id'] not in matched_inc_ids and r_desc in i['description'].lower().strip()), None)
        if matched:
            matched_inc_ids.add(matched['id'])
            paid_inc.append(r)
        else:
            pending_inc.append(r)

    # Check recurring expenses
    exp_rules = [r for r in rules if r['rule_type'] == 'expense']
    matched_exp_ids = set()
    pending_exp = []
    paid_exp = []
    for r in exp_rules:
        r_desc = r['description'].lower().strip()
        matched = next((e for e in m_expenses if e['id'] not in matched_exp_ids and r_desc in e['description'].lower().strip()), None)
        if matched:
            matched_exp_ids.add(matched['id'])
            paid_exp.append(r)
        else:
            pending_exp.append(r)

    print(f"[{m}]")
    print(f"  Receitas Realizadas/Lançadas: {len(m_incomes)} (Total R$ {sum(float(i['value']) for i in m_incomes):,.2f})")
    print(f"  Recebimentos Recorrentes Pendentes: {len(pending_inc)} | Recebidos: {len(paid_inc)}")
    print(f"  Despesas Realizadas/Lançadas: {len(m_expenses)} (Total R$ {sum(float(e['value']) for e in m_expenses):,.2f})")
    print(f"  Despesas Recorrentes Pendentes: {len(pending_exp)} | Pagas: {len(paid_exp)}")
