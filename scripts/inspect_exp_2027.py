import urllib.request
import json

SUPABASE_URL = 'https://svautecmrxrfhdnkadyl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU'
headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/expenses?id=like.exp_2027*&select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    exp_2027 = json.loads(resp.read().decode('utf-8'))

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/recurring_rules?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    rules = json.loads(resp.read().decode('utf-8'))

exp_rule_descs = [r['description'].lower().strip() for r in rules if r['rule_type'] == 'expense']

matching = []
non_matching = []

for e in exp_2027:
    desc = e['description'].lower().strip()
    if any(r in desc for r in exp_rule_descs):
        matching.append(e)
    else:
        non_matching.append(e)

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/incomes?id=like.inc_2027*&select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    inc_2027 = json.loads(resp.read().decode('utf-8'))

inc_rule_descs = [r['description'].lower().strip() for r in rules if r['rule_type'] == 'income']
inc_matching = []
inc_non_matching = []

for i in inc_2027:
    desc = i['description'].lower().strip()
    if any(r in desc for r in inc_rule_descs):
        inc_matching.append(i)
    else:
        inc_non_matching.append(i)

print(f"\nTotal inc_2027: {len(inc_2027)}")
print(f"Matching recurring rules (showing as Recebidos): {len(inc_matching)}")
print(f"Non-matching: {len(inc_non_matching)}")
for i in inc_non_matching:
    print(f"  {i['id']} | {i['date']} | {i['description']} | R$ {i['value']}")

print(f"Matching recurring rules (showing as Pagas): {len(matching)}")
print(f"Non-matching (not in recurring_rules): {len(non_matching)}")
for e in non_matching:
    print(f"  {e['id']} | {e['date']} | {e['description']} | R$ {e['value']}")
