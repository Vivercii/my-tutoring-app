import csv
import json
import re

# Read the CSV file
csv_file = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv'

# Read truncated questions list
with open('unfixed_questions.json', 'r') as f:
    truncated_questions = json.load(f)

print(f"Processing {len(truncated_questions)} truncated questions...")

# Read all CSV data into memory
csv_questions = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        csv_questions.append(row)

print(f"Loaded {len(csv_questions)} questions from CSV")

# For each truncated question, find its match in CSV
matched = []
unmatched = []

for truncated in truncated_questions:
    # Get the start of the truncated text (remove HTML tags for matching)
    truncated_text = re.sub(r'<[^>]+>', '', truncated['questionText'][:200]).strip()
    truncated_text_start = truncated_text[:50]  # First 50 chars for matching
    
    found = False
    for csv_q in csv_questions:
        # Get plain text from CSV (remove HTML for comparison)
        csv_plain = csv_q.get('Question', '')
        
        # Check if the CSV question starts with the same text
        if csv_plain.startswith(truncated_text_start[:30]):  # Match first 30 chars
            matched.append({
                'id': truncated['id'],
                'old_text': truncated['questionText'],
                'new_html': csv_q.get('Question_html', ''),
                'new_plain': csv_q.get('Question', ''),
                'url': csv_q.get('URL', ''),
                'module': truncated['moduleTitle']
            })
            found = True
            print(f"✓ Found match for: {truncated['id'][:20]}... - {truncated_text_start[:40]}...")
            break
    
    if not found:
        # Try a more flexible match
        for csv_q in csv_questions:
            csv_plain = csv_q.get('Question', '')
            # Look for key phrases
            if 'mimosa tree' in truncated_text and 'mimosa tree' in csv_plain:
                matched.append({
                    'id': truncated['id'],
                    'old_text': truncated['questionText'],
                    'new_html': csv_q.get('Question_html', ''),
                    'new_plain': csv_q.get('Question', ''),
                    'url': csv_q.get('URL', ''),
                    'module': truncated['moduleTitle']
                })
                found = True
                print(f"✓ Found match (flexible) for: {truncated['id'][:20]}... - mimosa tree question")
                break
            elif any(phrase in truncated_text and phrase in csv_plain for phrase in 
                    ['Jane Austen', 'Charles W. Chesnutt', 'Black beans', 'Lewis Carroll', 
                     'Martín Chambi', 'Art collectives', 'Mexican', 'Beatles', 'Wigner crystal']):
                matched.append({
                    'id': truncated['id'],
                    'old_text': truncated['questionText'],
                    'new_html': csv_q.get('Question_html', ''),
                    'new_plain': csv_q.get('Question', ''),
                    'url': csv_q.get('URL', ''),
                    'module': truncated['moduleTitle']
                })
                found = True
                print(f"✓ Found match (flexible) for: {truncated['id'][:20]}...")
                break
    
    if not found:
        unmatched.append(truncated)
        print(f"✗ No match for: {truncated['id'][:20]}... - {truncated_text_start[:40]}...")

print(f"\n=== SUMMARY ===")
print(f"Matched: {len(matched)} questions")
print(f"Unmatched: {len(unmatched)} questions")

# Save matched questions for update
with open('matched_questions_to_update.json', 'w') as f:
    json.dump(matched, f, indent=2)

# Save unmatched for manual review
with open('unmatched_questions.json', 'w') as f:
    json.dump(unmatched, f, indent=2)

print(f"\nSaved {len(matched)} matched questions to matched_questions_to_update.json")
print(f"Saved {len(unmatched)} unmatched questions to unmatched_questions.json")

# Show sample of matched questions
if matched:
    print(f"\n=== SAMPLE MATCHED QUESTION ===")
    sample = matched[0]
    print(f"ID: {sample['id']}")
    print(f"URL: {sample['url']}")
    print(f"Old text (truncated): {sample['old_text'][-50:]}")
    print(f"New text (ending): {sample['new_plain'][-100:]}")
    print(f"Has 'Which choice': {'Which choice' in sample['new_plain']}")