import urllib.request
import json

SUPABASE_URL = 'https://svautecmrxrfhdnkadyl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXV0ZWNtcnhyZmhkbmthZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA5ODksImV4cCI6MjEwODg5Njk4OX0.temqEUy18pLxg3bpIE42UHeWiNDkUnbSsqrbQworemU'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def delete_records(table, filter_param):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filter_param}"
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[{table}] Deletados registros com filtro '{filter_param}': HTTP {resp.status}")
    except Exception as e:
        print(f"[{table}] Erro ao deletar: {e}")
        raise e

def update_recurring_rules():
    # 1. Deletar regras antigas
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/recurring_rules?id=neq.none", headers=headers, method='DELETE')
    with urllib.request.urlopen(req) as resp:
        print(f"[recurring_rules] Limpeza de regras antigas: HTTP {resp.status}")

    # 2. Inserir regras atualizadas e calibradas com os donos certos
    rules = [
        # Contas Compartilhadas (is_shared = true)
        {'id': 'rec_exp_01', 'rule_type': 'expense', 'description': 'Internet', 'estimated_value': 130.00, 'due_day': 10, 'owner': 'Compartilhado', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_02', 'rule_type': 'expense', 'description': 'Casa', 'estimated_value': 1600.00, 'due_day': 10, 'owner': 'Compartilhado', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_03', 'rule_type': 'expense', 'description': 'Energia', 'estimated_value': 250.00, 'due_day': 15, 'owner': 'Compartilhado', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_04', 'rule_type': 'expense', 'description': 'Agua', 'estimated_value': 120.00, 'due_day': 15, 'owner': 'Compartilhado', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_05', 'rule_type': 'expense', 'description': 'IPTV', 'estimated_value': 35.00, 'due_day': 10, 'owner': 'Compartilhado', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_06', 'rule_type': 'expense', 'description': 'Ração', 'estimated_value': 170.00, 'due_day': 10, 'owner': 'Compartilhado', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_07', 'rule_type': 'expense', 'description': 'Banho Izy e Cacau', 'estimated_value': 170.00, 'due_day': 15, 'owner': 'Compartilhado', 'category_type': 'Fixo', 'active': True},

        # Contas de Wesley (individuais)
        {'id': 'rec_exp_08', 'rule_type': 'expense', 'description': 'Dízimo', 'estimated_value': 500.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_09', 'rule_type': 'expense', 'description': 'Academia', 'estimated_value': 110.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_10', 'rule_type': 'expense', 'description': 'Cabelo', 'estimated_value': 70.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_11', 'rule_type': 'expense', 'description': 'Spotify', 'estimated_value': 22.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_12', 'rule_type': 'expense', 'description': 'Drive', 'estimated_value': 10.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_13', 'rule_type': 'expense', 'description': 'Apple', 'estimated_value': 35.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_14', 'rule_type': 'expense', 'description': 'Meli+', 'estimated_value': 28.00, 'due_day': 1, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_15', 'rule_type': 'expense', 'description': 'Telefone', 'estimated_value': 60.00, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_16', 'rule_type': 'expense', 'description': 'Combustível', 'estimated_value': 400.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Variável', 'active': True},
        {'id': 'rec_exp_17', 'rule_type': 'expense', 'description': 'Consórcio Carro', 'estimated_value': 427.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_18', 'rule_type': 'expense', 'description': 'Consórcio Serviços', 'estimated_value': 212.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_19', 'rule_type': 'expense', 'description': 'Seguro Carro', 'estimated_value': 325.00, 'due_day': 15, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_exp_20', 'rule_type': 'expense', 'description': 'Guardar', 'estimated_value': 2000.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Investimento', 'active': True},

        # Recebimentos de Wesley
        {'id': 'rec_inc_01', 'rule_type': 'income', 'description': 'Salário', 'estimated_value': 4600.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_inc_02', 'rule_type': 'income', 'description': 'Alimentação', 'estimated_value': 1000.00, 'due_day': 5, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},
        {'id': 'rec_inc_03', 'rule_type': 'income', 'description': 'Mãe', 'estimated_value': 320.80, 'due_day': 10, 'owner': 'Wesley', 'category_type': 'Fixo', 'active': True},

        # Recebimentos de Luana
        {'id': 'rec_inc_04', 'rule_type': 'income', 'description': 'Rosi (Gympass)', 'estimated_value': 70.00, 'due_day': 10, 'owner': 'Luana', 'category_type': 'Fixo', 'active': True},
    ]

    data = json.dumps(rules, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/recurring_rules", data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        print(f"[recurring_rules] Inseridas {len(rules)} regras atualizadas: HTTP {resp.status}")

def main():
    print("Iniciando correção das despesas recorrentes de 2027...")
    
    # 1. Deletar os lançamentos de despesas de 2027 que vieram da planilha
    delete_records('expenses', 'id=like.exp_2027*')
    
    # 2. Deletar os lançamentos de receitas de 2027 que vieram da planilha
    delete_records('incomes', 'id=like.inc_2027*')
    
    # 3. Atualizar a tabela public.recurring_rules com divisão correta de Donos
    update_recurring_rules()
    
    print("\nCorreção finalizada com sucesso! Todos os lançamentos futuros agora estão como PENDENTES.")

if __name__ == '__main__':
    main()
