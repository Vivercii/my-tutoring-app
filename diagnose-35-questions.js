const fs = require('fs');

// Read the processed JSON files
const originalQuestions = JSON.parse(fs.readFileSync('sat_questions_processed.json', 'utf8'));
const fixedQuestions = JSON.parse(fs.readFileSync('sat_questions_processed_fixed.json', 'utf8'));

// Filter for questions without passages
const originalNoPassage = originalQuestions.filter(q => !q.passageText || q.passageText === q.fullText);
const fixedNoPassage = fixedQuestions.filter(q => !q.passageText || q.passageText === q.fullText);

console.log('='.repeat(60));
console.log('COMPARISON:');
console.log('='.repeat(60));
console.log(`Original script: ${originalNoPassage.length} questions without passages`);
console.log(`"Fixed" script: ${fixedNoPassage.length} questions without passages`);
console.log(`Difference: ${fixedNoPassage.length - originalNoPassage.length} MORE questions without passages!`);

// Check what's at the END of these 35 questions
console.log('\n' + '='.repeat(60));
console.log('ANALYZING THE END OF QUESTIONS WITHOUT PASSAGES:');
console.log('='.repeat(60));

fixedNoPassage.slice(0, 10).forEach((q, index) => {
    const fullText = q.fullText;
    const last250 = fullText.substring(Math.max(0, fullText.length - 250));
    
    console.log(`\n--- Question ${index + 1} (ID: ${q.id}) ---`);
    console.log(`Test: ${q.testName}`);
    console.log(`Length: ${fullText.length} chars`);
    console.log(`LAST 250 chars: "${last250}"`);
    
    // Check if any patterns exist in the text
    const patterns = [
        "Which choice completes",
        "Which choice best",
        "Which choice most",
        "Which finding",
        "Which quotation",
        "Which statement",
        "Which detail",
        "Which of the following",
        "What is the",
        "What does",
        "According to",
        "Based on",
        "The passage",
        "The author",
        "How does",
        "Why does"
    ];
    
    let foundPattern = null;
    let patternPosition = -1;
    patterns.forEach(pattern => {
        const index = fullText.lastIndexOf(pattern);
        if (index > -1) {
            if (!foundPattern || index > patternPosition) {
                foundPattern = pattern;
                patternPosition = index;
            }
        }
    });
    
    if (foundPattern) {
        console.log(`✓ Contains "${foundPattern}" at position ${patternPosition}/${fullText.length}`);
        console.log(`  Text at pattern: "${fullText.substring(patternPosition, patternPosition + 100)}..."`);
    } else {
        console.log('❌ No standard question patterns found');
    }
    
    // Check for fill-in-blank
    if (fullText.includes('_____')) {
        const blankIndex = fullText.lastIndexOf('_____');
        console.log(`📝 Has fill-in-blank at position ${blankIndex}`);
    }
});

// Compare specific questions that changed
console.log('\n' + '='.repeat(60));
console.log('QUESTIONS THAT LOST THEIR PASSAGES IN THE "FIX":');
console.log('='.repeat(60));

const originalWithPassage = originalQuestions.filter(q => q.passageText && q.passageText !== q.fullText);
const fixedWithPassage = fixedQuestions.filter(q => q.passageText && q.passageText !== q.fullText);

// Find questions that had passages in original but not in fixed
originalQuestions.forEach((origQ, idx) => {
    const fixedQ = fixedQuestions[idx];
    
    const origHasPassage = origQ.passageText && origQ.passageText !== origQ.fullText;
    const fixedHasPassage = fixedQ.passageText && fixedQ.passageText !== fixedQ.fullText;
    
    if (origHasPassage && !fixedHasPassage) {
        console.log(`\nQuestion ${origQ.id} LOST its passage extraction!`);
        console.log(`Test: ${origQ.testName}`);
        console.log(`Original extracted: ${origQ.passageText.substring(0, 100)}...`);
        console.log(`Fixed extracted: NOTHING`);
    }
});