import csv
import json

# Read unmatched questions
with open('unmatched_questions.json', 'r') as f:
    unmatched = json.load(f)

# Line numbers from grep
graph_lines = [16050, 16087, 16092, 20465, 20489, 20494, 39476, 39500, 39505, 
               53410, 53441, 53446, 57743, 57785, 57798, 62932, 62962, 62975, 
               63005, 63173, 67483, 67517, 67522, 81577, 81608, 81613]

# Read CSV and get the questions at these lines
csv_file = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv'

remaining_matches = []

with open(csv_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
    # Parse header
    header_line = lines[0].strip()
    reader = csv.DictReader([header_line] + [lines[i-1] for i in graph_lines if i <= len(lines)])
    
    for row in reader:
        question_html = row.get('Question_html', '')
        question_text = row.get('Question', '')
        
        # Match with unmatched questions
        for unmatch in unmatched:
            # Check if this is a graph question
            if 'Spider Population' in question_text and 'Spider' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Spider Population Count'
                })
                print(f"✓ Found: Spider Population - {unmatch['id']}")
            elif 'Metal Content' in question_text and 'Metal Content' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Metal Content of Plants'
                })
                print(f"✓ Found: Metal Content - {unmatch['id']}")
            elif 'Political Orientation' in question_text and 'Political Orientation' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Voters Political Orientation'
                })
                print(f"✓ Found: Voters Political - {unmatch['id']}")
            elif 'Power Conversion' in question_text and 'Power Conversion' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Power Conversion Efficiency'
                })
                print(f"✓ Found: Power Conversion - {unmatch['id']}")
            elif 'Average Number of Individuals' in question_text and 'Average Number of Individuals' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Average Number of Individuals'
                })
                print(f"✓ Found: Average Number - {unmatch['id']}")
            elif 'Attentiveness' in question_text and 'Attentiveness' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Mean Attentiveness Scores'
                })
                print(f"✓ Found: Attentiveness - {unmatch['id']}")
            elif 'Science Research' in question_text and 'Science Research' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Total Science Research'
                })
                print(f"✓ Found: Science Research - {unmatch['id']}")
            elif 'California Condor' in question_text and 'California Condor' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'California Condor Populations'
                })
                print(f"✓ Found: California Condor - {unmatch['id']}")
            elif 'Radial Growth' in question_text and 'Radial Growth' in unmatch['questionText']:
                remaining_matches.append({
                    'id': unmatch['id'],
                    'new_html': question_html,
                    'new_plain': question_text,
                    'url': row.get('URL', ''),
                    'title': 'Radial Growth of Sugar'
                })
                print(f"✓ Found: Radial Growth - {unmatch['id']}")

# Remove duplicates based on ID
seen_ids = set()
unique_matches = []
for match in remaining_matches:
    if match['id'] not in seen_ids:
        seen_ids.add(match['id'])
        unique_matches.append(match)

print(f"\n=== SUMMARY ===")
print(f"Found {len(unique_matches)} unique matches from {len(remaining_matches)} total matches")

# Save for update
with open('remaining_9_to_update.json', 'w') as f:
    json.dump(unique_matches, f, indent=2)

print(f"Saved to remaining_9_to_update.json")

# Show what we found
for match in unique_matches:
    print(f"\n{match['title']}: {match['id']}")
    print(f"  URL: {match['url']}")
    print(f"  Has question: {'Which' in match['new_plain'] or 'What' in match['new_plain']}")