const fs = require('fs');

// Read the unfixed questions
const questions = JSON.parse(fs.readFileSync('unfixed_questions.json', 'utf8'));

console.log(`\nAnalyzing ${questions.length} unfixed questions...\n`);

// Check for common endings that might indicate where the question starts
const questionStarters = [
  'Which', 'What', 'How', 'Why', 'When', 'Where', 'Who',
  'According to', 'Based on', 'The author', 'The passage',
  'In the', 'The text', 'The primary', 'Select', 'Choose'
];

let hasQuestionPattern = 0;
let noQuestionPattern = [];

questions.forEach(q => {
  const text = q.questionText;
  let foundPattern = false;
  
  // Check if any question pattern appears after position 200
  for (const pattern of questionStarters) {
    const regex = new RegExp(`\\b${pattern}`, 'i');
    const match = text.match(regex);
    if (match && match.index && match.index > 200) {
      hasQuestionPattern++;
      foundPattern = true;
      console.log(`Found "${pattern}" at position ${match.index} in question ${q.id}`);
      break;
    }
  }
  
  if (!foundPattern) {
    noQuestionPattern.push(q);
  }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Questions with detectable pattern: ${hasQuestionPattern}`);
console.log(`Questions without pattern: ${noQuestionPattern.length}`);

console.log(`\n=== SAMPLES WITHOUT PATTERN ===`);
noQuestionPattern.slice(0, 5).forEach(q => {
  console.log(`\nID: ${q.id}`);
  console.log(`Section: ${q.sectionTitle}`);
  console.log(`Length: ${q.textLength}`);
  console.log(`First 200 chars: ${q.questionText.substring(0, 200)}`);
  console.log(`Last 200 chars: ${q.questionText.substring(q.textLength - 200)}`);
});