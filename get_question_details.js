const fs = require('fs');

// Read the unfixed questions
const questions = JSON.parse(fs.readFileSync('unfixed_questions.json', 'utf8'));

// Function to get question details
function getQuestionDetails(index) {
  const q = questions[index];
  if (!q) {
    console.log(`No question at index ${index}`);
    return;
  }
  
  console.log(`\n========== QUESTION ${index + 1} of 88 ==========`);
  console.log(`Database ID: ${q.id}`);
  console.log(`Section: ${q.sectionTitle}`);
  console.log(`Module: ${q.moduleTitle}`);
  console.log(`Program: ${q.program}`);
  console.log(`\nCurrent truncated text (first 400 chars):`);
  console.log(q.questionText.substring(0, 400));
  console.log(`\nText ends with: "${q.questionText.substring(q.questionText.length - 50)}"`);
  console.log(`\nTotal length: ${q.textLength} characters`);
  console.log(`================================\n`);
  
  return q;
}

// Get first question
const firstQuestion = getQuestionDetails(0);

// Save current question being worked on
fs.writeFileSync('current_question.json', JSON.stringify(firstQuestion, null, 2));
console.log('Saved current question details to current_question.json');