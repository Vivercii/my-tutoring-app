import csv
import json
import subprocess

# Read the CSV file
csv_file = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv'
questions_to_update = []

# Read truncated questions list
with open('unfixed_questions.json', 'r') as f:
    truncated_questions = json.load(f)

# Create a mapping of truncated text to ID
truncated_map = {}
for q in truncated_questions:
    # Get first 100 chars as key (without HTML tags for better matching)
    text_start = q['questionText'][:100].replace('<div class="">', '').replace('<p>', '').strip()
    truncated_map[q['id']] = text_start

print(f"Looking for {len(truncated_questions)} truncated questions in CSV...")

# Read CSV and find matching questions
found_count = 0
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        question_html = row.get('Question_html', '')
        
        # Check if this matches any truncated question
        for q_id, truncated_start in truncated_map.items():
            if 'mimosa tree' in question_html.lower() and found_count == 0:
                # Found the mimosa tree question
                print(f"\n=== FOUND QUESTION 1 ===")
                print(f"Database ID: {truncated_questions[0]['id']}")
                print(f"URL: {row.get('URL', '')}")
                print(f"\nComplete Question HTML:")
                print(question_html)
                print(f"\nQuestion Text (plain):")
                print(row.get('Question', ''))
                
                # Save for update
                questions_to_update.append({
                    'id': truncated_questions[0]['id'],
                    'question_html': question_html,
                    'question_text': row.get('Question', ''),
                    'url': row.get('URL', '')
                })
                found_count += 1
                
                # Save to file for the update script
                with open('question_to_update.json', 'w') as out:
                    json.dump(questions_to_update[0], out, indent=2)
                
                print(f"\nSaved to question_to_update.json")
                break

print(f"\nFound {found_count} questions to update")