const fs = require('fs');

// Read the unfixed questions
const questions = JSON.parse(fs.readFileSync('unfixed_questions.json', 'utf8'));

console.log(`\nChecking ${questions.length} unfixed questions for truncation...\n`);

let truncatedCount = 0;
let endPatterns = {};

questions.forEach(q => {
  const text = q.questionText;
  const last50 = text.substring(text.length - 50);
  
  // Check if text appears to be cut off (ends abruptly)
  if (text.endsWith('...') || 
      text.endsWith(' <em>') || 
      text.endsWith(' the') ||
      text.endsWith(' a') ||
      text.endsWith(' an') ||
      text.endsWith(' of') ||
      text.endsWith(' in') ||
      text.endsWith(' to') ||
      text.endsWith(' for') ||
      text.endsWith(' and') ||
      text.endsWith(' but') ||
      text.endsWith(' or') ||
      text.endsWith(',') ||
      text.endsWith(' ter') ||  // Specific truncation seen
      text.endsWith('individua') ||  // Another truncation
      !text.endsWith('</div>') && !text.endsWith('</p>') && !text.endsWith('.') && !text.endsWith('?') && !text.endsWith('!')) {
    truncatedCount++;
    console.log(`Truncated: ${q.id} ends with: "${last50}"`);
  }
  
  // Count ending patterns
  const ending = text.substring(text.length - 20);
  if (!endPatterns[ending]) {
    endPatterns[ending] = 0;
  }
  endPatterns[ending]++;
});

console.log(`\n=== SUMMARY ===`);
console.log(`Truncated questions: ${truncatedCount} / ${questions.length}`);

console.log(`\n=== COMMON ENDINGS ===`);
Object.entries(endPatterns)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([ending, count]) => {
    console.log(`"${ending}": ${count} questions`);
  });