import csv
import json
import re

# Read the CSV file
csv_file = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv'

# Read truncated questions list
with open('unfixed_questions.json', 'r') as f:
    truncated_questions = json.load(f)

print(f"Processing all {len(truncated_questions)} truncated questions manually...")

# Read all CSV data
all_questions = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        all_questions.append(row)

print(f"Loaded {len(all_questions)} questions from CSV")

# Manual mapping based on unique identifiers
manual_matches = []

# For each truncated question, find its match
for i, truncated in enumerate(truncated_questions, 1):
    truncated_text = re.sub(r'<[^>]+>', '', truncated['questionText'][:150]).strip()
    
    print(f"\n{i}/88: Looking for question starting with: {truncated_text[:50]}...")
    
    found = False
    for csv_q in all_questions:
        csv_text = csv_q.get('Question', '')
        csv_html = csv_q.get('Question_html', '')
        
        # Check various matching patterns
        if 'mimosa tree' in truncated_text and 'mimosa tree' in csv_text:
            manual_matches.append({
                'id': truncated['id'],
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"  ✓ Found: Mimosa tree question")
            found = True
            break
        elif 'Jane Austen' in truncated_text and 'Jane Austen' in csv_text and '1811' in csv_text:
            manual_matches.append({
                'id': truncated['id'],
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"  ✓ Found: Jane Austen question")
            found = True
            break
        elif 'Charles W. Chesnutt' in truncated_text and 'Charles W. Chesnutt' in csv_text:
            manual_matches.append({
                'id': truncated['id'],
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"  ✓ Found: Charles W. Chesnutt question")
            found = True
            break
        elif 'Black beans' in truncated_text and 'Black beans' in csv_text and 'Phaseolus vulgaris' in csv_text:
            manual_matches.append({
                'id': truncated['id'],
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"  ✓ Found: Black beans question")
            found = True
            break
        elif 'Torpor Bouts' in truncated_text and 'Torpor Bouts' in csv_text:
            manual_matches.append({
                'id': truncated['id'],
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"  ✓ Found: Torpor Bouts table question")
            found = True
            break
        elif 'Spider Population' in csv_html:
            manual_matches.append({
                'id': truncated['id'],
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"  ✓ Found: Spider Population graph")
            found = True
            break
        elif 'Metal Content of Plants' in csv_html:
            manual_matches.append({
                'id': truncated['id'],
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"  ✓ Found: Metal Content graph")
            found = True
            break
        # Add more specific patterns as needed...
        
    if not found:
        print(f"  ✗ Not found yet - needs manual check")

print(f"\n=== SUMMARY ===")
print(f"Found {len(manual_matches)} matches out of {len(truncated_questions)} questions")

# Save all matches
with open('all_88_updates.json', 'w') as f:
    json.dump(manual_matches, f, indent=2)

print(f"Saved to all_88_updates.json")