import sys
sys.path.append('scripts')
from parse_2027 import expenses, incomes

print('--- UNIQUE EXPENSES ---')
exp_dict = {}
for e in expenses:
    key = (e['description'], e['section'], e['tag'], e['is_shared'], e['payment_method'], e['user_owner'])
    exp_dict[key] = exp_dict.get(key, 0) + 1

for (desc, sec, tag, shared, pay, owner), count in sorted(exp_dict.items()):
    print(f'{count}x [{sec}] "{desc}" -> Tag: {tag} | Shared: {shared} | Pay: {pay} | Owner: {owner}')

print('\n--- UNIQUE INCOMES ---')
inc_dict = {}
for i in incomes:
    key = (i['description'], i['tag'], i['user_owner'])
    inc_dict[key] = inc_dict.get(key, 0) + 1

for (desc, tag, owner), count in sorted(inc_dict.items()):
    print(f'{count}x "{desc}" -> Tag: {tag} | Owner: {owner}')

