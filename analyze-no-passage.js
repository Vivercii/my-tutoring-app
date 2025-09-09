const fs = require('fs');

// Read the processed JSON file
const questions = JSON.parse(fs.readFileSync('sat_questions_processed.json', 'utf8'));

// Filter for questions without passages
const noPassageQuestions = questions.filter(q => !q.passageText || q.passageText === q.fullText);

console.log('\n' + '='.repeat(60));
console.log(`🔍 ANALYZING ${noPassageQuestions.length} QUESTIONS WITHOUT PASSAGES:`);
console.log('='.repeat(60) + '\n');

noPassageQuestions.forEach((q, index) => {
    console.log(`\n--- Question ${index + 1} of ${noPassageQuestions.length} ---`);
    console.log(`ID: ${q.id}`);
    console.log(`URL: ${q.url}`);
    console.log(`Test: ${q.testName}`);
    console.log(`Module: ${q.module} - ${q.difficulty}`);
    console.log(`Section: ${q.section}`);
    console.log(`First 300 chars of full text:`);
    console.log(`"${q.fullText.substring(0, 300)}..."`);
    console.log(`Question text: "${q.questionText.substring(0, 150)}..."`);
    console.log(`Has visuals: ${q.hasVisuals}`);
    console.log(`Is fill-in-blank: ${q.isFillInBlank}`);
    console.log(`Is dual-text: ${q.isDualText}`);
});

// Check if any patterns might be at the very beginning
console.log('\n' + '='.repeat(60));
console.log('CHECKING FOR PATTERNS AT START OF TEXT:');
console.log('='.repeat(60) + '\n');

const patterns = [
    "Which choice completes",
    "Which choice best describes",
    "Which choice best states",
    "Which choice most",
    "Which finding",
    "Which quotation",
    "Which statement",
    "What is the main",
    "What does the",
    "According to",
    "Based on",
    "The passage",
    "The author",
    "How does",
    "Why does"
];

let startsWithPattern = 0;
noPassageQuestions.forEach(q => {
    patterns.forEach(pattern => {
        if (q.fullText.startsWith(pattern)) {
            console.log(`⚠️ Question ${q.id} starts immediately with: "${pattern}"`);
            startsWithPattern++;
        }
    });
});

// Check for questions that might have patterns we're missing
console.log('\n' + '='.repeat(60));
console.log('LOOKING FOR MISSED PATTERNS:');
console.log('='.repeat(60) + '\n');

noPassageQuestions.forEach(q => {
    const text = q.fullText;
    
    // Look for "Which" anywhere in the text
    const whichIndex = text.lastIndexOf('Which');
    if (whichIndex > 100) {
        console.log(`Question ${q.id} has "Which" at position ${whichIndex}/${text.length}`);
        console.log(`   Pattern: "${text.substring(whichIndex, whichIndex + 50)}..."`);
    }
    
    // Look for "What" anywhere in the text
    const whatIndex = text.lastIndexOf('What');
    if (whatIndex > 100) {
        console.log(`Question ${q.id} has "What" at position ${whatIndex}/${text.length}`);
        console.log(`   Pattern: "${text.substring(whatIndex, whatIndex + 50)}..."`);
    }
});

// Summary statistics
console.log('\n' + '='.repeat(60));
console.log('SUMMARY:');
console.log('='.repeat(60));
console.log(`Total questions without passages: ${noPassageQuestions.length}`);
console.log(`Questions that start with a pattern: ${startsWithPattern}`);

// Group by test
const byTest = {};
noPassageQuestions.forEach(q => {
    const test = q.testName || 'Unknown';
    byTest[test] = (byTest[test] || 0) + 1;
});

console.log('\nDistribution by test:');
Object.entries(byTest).forEach(([test, count]) => {
    console.log(`  ${test}: ${count} questions`);
});

// Check if they're all math questions
const mathQuestions = noPassageQuestions.filter(q => q.section === 'Math');
console.log(`\nMath questions: ${mathQuestions.length}/${noPassageQuestions.length}`);