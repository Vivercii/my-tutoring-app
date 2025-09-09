# Question Bank Import Format Guide

## Required Column Headers (In Exact Order)

The import expects **15 columns** in this exact order:

1. **URL** - The source URL (will be ignored by parser)
2. **Question** - Plain text version (will be ignored by parser) 
3. **Question_html** - HTML content of question (REQUIRED - this is what gets imported)
4. **Question Type** - Question type (see accepted values below)
5. **Choice A** - Plain text for option A (fallback if HTML not provided)
6. **Choice B** - Plain text for option B (fallback if HTML not provided)
7. **Choice C** - Plain text for option C (fallback if HTML not provided)
8. **Choice D** - Plain text for option D (fallback if HTML not provided)
9. **Choice A_html** - HTML for option A (preferred over plain text)
10. **Choice B_html** - HTML for option B (preferred over plain text)
11. **Choice C_html** - HTML for option C (preferred over plain text)
12. **Choice D_html** - HTML for option D (preferred over plain text)
13. **Correct Answer** - Single letter: A, B, C, or D
14. **Explaination** - Plain text explanation (note the spelling)
15. **Explaination_html** - HTML explanation (preferred over plain text)

## Accepted Values

### Question Type
- `mcq` or `MCQ` → converts to MULTIPLE_CHOICE
- `MULTIPLE_CHOICE` → stays as MULTIPLE_CHOICE
- Any text containing "MULTIPLE" or "CHOICE" → MULTIPLE_CHOICE
- Any text containing "SHORT" → SHORT_ANSWER
- Any text containing "FREE" → FREE_RESPONSE
- Any text containing "ESSAY" → ESSAY

### Correct Answer
- Must be a single letter: `A`, `B`, `C`, or `D`
- Case insensitive (a, b, c, d also work)

## Format Types Supported

### 1. CSV Format (Comma-Separated)
- Fields separated by commas
- Fields containing commas must be wrapped in double quotes
- Example: `"Question with, comma","mcq","Option A",...`

### 2. TSV Format (Tab-Separated)
- Fields separated by tabs
- Better for data with commas in content
- Can be copied directly from Excel

## Important Notes

1. **The parser ignores columns 1 and 2** (URL and plain Question text)
2. **Column 3 (Question_html) is the actual question content used**
3. HTML content can span multiple lines within a cell
4. If Choice HTML columns (9-12) are empty, plain text choices (5-8) will be used
5. Math content should use MathML format (will be converted to LaTeX)

## Example Row

```csv
https://example.com,Plain question text,"<p>What is 2+2?</p>",mcq,Three,Four,Five,Six,"<p>Three</p>","<p>Four</p>","<p>Five</p>","<p>Six</p>",B,Two plus two equals four,"<p>Two plus two equals four</p>"
```

## Troubleshooting

### "Could not parse question" Error
This usually means:
- Missing Question_html content (column 3 is empty)
- Not enough columns (less than 13 after skipping first 2)
- Row is malformed or incomplete

### Parser Debug Info
The parser will show:
- Detected separator (TAB or COMMA)
- Number of rows found
- Sample of first row's data
- Specific column values for debugging