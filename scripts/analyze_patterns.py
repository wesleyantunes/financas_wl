import pandas as pd
from inspect_excel import parse_all
import re

records = parse_all()

# Let's inspect all unique descriptions across sections and see if there are installment patterns
print("\n--- Installment patterns detected ---")
inst_regex = re.compile(r'(\d+)\s*/\s*(\d+)')
installments = set()
for r in records:
    desc = r['description']
    m = inst_regex.search(desc)
    if m:
        base = inst_regex.sub('', desc).strip()
        installments.add((base, desc, r['section']))

for base, desc, sec in sorted(installments):
    print(f"[{sec}] Base: '{base}' | Example: '{desc}'")

# Check rows where value is None or 0
zero_or_none = [r for r in records if r['value'] is None or r['value'] == 0]
print(f"\nTotal zero or None value records: {len(zero_or_none)}")
print("Sample zero or None:")
for r in zero_or_none[:15]:
    print(f"  {r['month']} | {r['section']} | '{r['description']}' | val={r['value']} | obs='{r['obs']}'")

