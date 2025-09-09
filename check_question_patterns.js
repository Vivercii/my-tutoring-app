const fs = require('fs');

// Read the unfixed questions
const questions = JSON.parse(fs.readFileSync('unfixed_questions.json', 'utf8'));

console.log(`\nAnalyzing ${questions.length} unfixed questions for question patterns...\n`);

// More comprehensive question patterns
const questionPatterns = [
  'Which choice completes',
  'Which choice best',
  'Which finding',
  'Which quotation',
  'What is the main',
  'According to the',
  'Based on the',
  'The author',
  'What function',
  'Which of the following',
  'The passage',
  'The primary purpose',
  'The text',
  'How does',
  'Why does',
  'What does',
  'Select',
  'Choose',
  'Identify',
  'Explain',
  'Describe'
];

let foundPatterns = [];
let noPattern = [];

questions.forEach(q => {
  const text = q.questionText;
  let found = false;
  
  // Check for patterns anywhere in the text
  for (const pattern of questionPatterns) {
    if (text.includes(pattern)) {
      foundPatterns.push({
        id: q.id,
        pattern: pattern,
        position: text.indexOf(pattern),
        snippet: text.substring(text.indexOf(pattern), text.indexOf(pattern) + 100)
      });
      found = true;
      break;
    }
  }
  
  if (!found) {
    noPattern.push(q);
  }
});

console.log(`=== SUMMARY ===`);
console.log(`Questions WITH question patterns: ${foundPatterns.length}`);
console.log(`Questions WITHOUT patterns: ${noPattern.length}`);

console.log(`\n=== FOUND PATTERNS ===`);
foundPatterns.slice(0, 10).forEach(item => {
  console.log(`\nID: ${item.id}`);
  console.log(`Pattern: "${item.pattern}" at position ${item.position}`);
  console.log(`Snippet: ${item.snippet}`);
});

// Check if the issue is encoding
console.log(`\n=== CHECKING FOR ENCODING ISSUES ===`);
questions.slice(0, 5).forEach(q => {
  // Look for Unicode characters that might be breaking pattern matching
  const hasUnicode = /[\u2018\u2019\u201C\u201D\u2013\u2014]/.test(q.questionText);
  const hasHTMLEntities = /&[a-z]+;/.test(q.questionText);
  
  console.log(`\nID: ${q.id}`);
  console.log(`Has Unicode quotes/dashes: ${hasUnicode}`);
  console.log(`Has HTML entities: ${hasHTMLEntities}`);
  
  // Try to find "Which" with different encodings
  const variations = [
    'Which',
    'Which',  // with potential invisible characters
  ];
  
  variations.forEach(v => {
    if (q.questionText.includes(v)) {
      console.log(`Found with variation: "${v}"`);
    }
  });
});