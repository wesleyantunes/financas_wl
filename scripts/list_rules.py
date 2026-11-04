import urllib.request
import json

SUPABASE_URL = 'https://svautecmrxrfhdnkadyl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU'
headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/recurring_rules?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    rules = json.loads(resp.read().decode('utf-8'))

print(f"Total rules: {len(rules)}")
for r in rules:
    print(f"{r['id']} | {r['rule_type']} | {r['description']} | R$ {r['estimated_value']} | Dia {r['due_day']} | Dono: {r['owner']} | Categoria: {r.get('category_type')}")
