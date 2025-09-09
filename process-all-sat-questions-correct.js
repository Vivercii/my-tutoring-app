const fs = require('fs');
const Papa = require('papaparse');

// CORRECT parseQuestion with original threshold logic and MORE patterns
function parseQuestion(fullText, htmlText) {
    if (!fullText) return { passage: '', question: '', isDualText: false, isFillInBlank: false };
    
    // Check for dual-text comparison
    const isDualText = fullText.includes('Text 1') && fullText.includes('Text 2');
    
    // Check for fill-in-the-blank
    const isFillInBlank = fullText.includes('______') || fullText.includes('blank');
    
    // Extended patterns - INCLUDING ALL THE MISSING ONES
    const patterns = [
        "Which choice completes",
        "Which choice best describes",
        "Which choice best states",
        "Which choice most",
        "Which finding",
        "Which quotation",
        "Which statement",
        "Which response from",  // ADD THIS for survey questions
        "What choice best states",  // ADD THIS
        "As used in the text, what does",  // ADD THIS for vocabulary
        "As used in the text, what",  // ADD THIS variant
        "What does the word",  // ADD THIS for vocabulary
        "What does the phrase",  // ADD THIS for phrases
        "What is the main",
        "What does the underlined",
        "What does the author",
        "What function does",
        "According to the text,",
        "According to the passage,",
        "Based on the texts",
        "Based on the text,",
        "Based on the passage,",
        "The passage most strongly suggests",
        "The author's use of",
        "The primary purpose",
        "How does the",
        "Why does the",
        "In the context",
        "It can most reasonably be inferred",
        "The student wants",
        "As used in line",
        "The main purpose of",
        "Both texts",
        "Text 1 and Text 2"
    ];
    
    let splitPoint = -1;
    
    for (const pattern of patterns) {
        const index = fullText.lastIndexOf(pattern);
        if (index > splitPoint) {
            splitPoint = index;
        }
    }
    
    // USE THE ORIGINAL THRESHOLD LOGIC - this was correct!
    const threshold = (isDualText || isFillInBlank) ? 50 : 100;
    
    if (splitPoint > threshold) {
        return {
            passage: fullText.substring(0, splitPoint).trim(),
            question: fullText.substring(splitPoint).trim(),
            isDualText,
            isFillInBlank
        };
    }
    
    // If no split found and it's short, it's probably all question
    if (fullText.length < 200) {
        return { passage: '', question: fullText, isDualText: false, isFillInBlank };
    }
    
    // Default: treat as question without passage
    return { passage: '', question: fullText, isDualText: false, isFillInBlank };
}

// Parse module string to extract test information
function parseModuleInfo(moduleString) {
    if (!moduleString) return {
        testName: '',
        section: '',
        moduleNumber: '',
        difficulty: ''
    };
    
    // Example: "Bluebook - SAT Practice #1 - English - Module 1 - Easy"
    const parts = moduleString.split(' - ');
    
    let testName = '';
    let section = '';
    let moduleNumber = '';
    let difficulty = '';
    
    // Extract test name (usually "SAT Practice #X")
    if (parts.length > 1) {
        testName = parts[1] || '';
    }
    
    // Extract section (English or Math)
    if (parts.length > 2) {
        section = parts[2] || '';
        if (section === 'English') {
            section = 'Reading & Writing';
        }
    }
    
    // Extract module number
    if (parts.length > 3) {
        moduleNumber = parts[3] || '';
    }
    
    // Extract difficulty if present
    if (parts.length > 4) {
        difficulty = parts[4] || '';
    }
    
    return { testName, section, moduleNumber, difficulty };
}

// Check for visual content
function detectVisualContent(htmlContent) {
    if (!htmlContent) return { hasVisuals: false, hasUnderline: false };
    
    const hasVisuals = htmlContent.includes('<svg') || 
                      htmlContent.includes('<img') ||
                      htmlContent.includes('<table') ||
                      htmlContent.includes('<math') ||
                      htmlContent.includes('<canvas');
    
    const hasUnderline = htmlContent.includes('<u>') || 
                        htmlContent.includes('<u ') ||
                        htmlContent.includes('text-decoration: underline') ||
                        htmlContent.includes('text-decoration:underline') ||
                        htmlContent.includes('underline');
    
    return { hasVisuals, hasUnderline };
}

// Main processing function
function processCSV(csvPath) {
    console.log(`📚 Reading CSV from: ${csvPath}\n`);
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const { data } = Papa.parse(csvContent, {
        header: true,
        dynamicTyping: false, // Keep everything as strings
        skipEmptyLines: true
    });
    
    console.log(`Found ${data.length} questions in CSV\n`);
    
    const processedQuestions = [];
    let englishCount = 0;
    let mathCount = 0;
    let passageCount = 0;
    let visualCount = 0;
    let underlineCount = 0;
    let fillInBlankCount = 0;
    let dualTextCount = 0;
    
    // Process each question
    data.forEach((row, index) => {
        // Parse the question
        const { passage, question, isDualText, isFillInBlank } = parseQuestion(
            row.Question,
            row.Question_html
        );
        
        // Parse module info
        const moduleInfo = parseModuleInfo(row.Module);
        
        // Detect visual content
        const { hasVisuals, hasUnderline } = detectVisualContent(row.Question_html);
        
        // Count statistics
        if (moduleInfo.section === 'Reading & Writing') englishCount++;
        else if (moduleInfo.section === 'Math') mathCount++;
        if (passage) passageCount++;
        if (hasVisuals) visualCount++;
        if (hasUnderline) underlineCount++;
        if (isFillInBlank) fillInBlankCount++;
        if (isDualText) dualTextCount++;
        
        // Create processed question object
        const processedQuestion = {
            // Identification
            id: index + 1,
            url: row.URL || '',
            
            // Test information
            testName: moduleInfo.testName,
            section: moduleInfo.section,
            module: moduleInfo.moduleNumber,
            difficulty: moduleInfo.difficulty,
            
            // Content (passage and question)
            passageHtml: row.Question_html || '', // Full HTML for rendering
            passageText: passage || row.Question || '', // Plain text passage
            questionText: question || row.Question || '', // Extracted question
            
            // Answer choices
            choices: {
                A: {
                    text: row['Choice A'] || '',
                    html: row['Choice A_html'] || row['Choice A'] || '',
                    isCorrect: row['Correct Answer'] === 'A'
                },
                B: {
                    text: row['Choice B'] || '',
                    html: row['Choice B_html'] || row['Choice B'] || '',
                    isCorrect: row['Correct Answer'] === 'B'
                },
                C: {
                    text: row['Choice C'] || '',
                    html: row['Choice C_html'] || row['Choice C'] || '',
                    isCorrect: row['Correct Answer'] === 'C'
                },
                D: {
                    text: row['Choice D'] || '',
                    html: row['Choice D_html'] || row['Choice D'] || '',
                    isCorrect: row['Correct Answer'] === 'D'
                }
            },
            
            // Correct answer
            correctAnswer: row['Correct Answer'] || '',
            
            // Explanation
            explanation: row['Explaination'] || row['Explanation'] || '',
            explanationHtml: row['Explaination_html'] || row['Explanation_html'] || '',
            
            // Flags
            hasVisuals: hasVisuals,
            hasUnderline: hasUnderline,
            isFillInBlank: isFillInBlank,
            isDualText: isDualText,
            
            // Original full content (for debugging/reference)
            fullHtml: row.Question_html || '',
            fullText: row.Question || ''
        };
        
        processedQuestions.push(processedQuestion);
        
        // Progress indicator every 100 questions
        if ((index + 1) % 100 === 0) {
            console.log(`Processed ${index + 1} questions...`);
        }
    });
    
    // Print statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total questions: ${processedQuestions.length}`);
    console.log(`Reading & Writing: ${englishCount}`);
    console.log(`Math: ${mathCount}`);
    console.log(`Questions with passages: ${passageCount}`);
    console.log(`Questions with visuals: ${visualCount}`);
    console.log(`Questions with underlines: ${underlineCount}`);
    console.log(`Fill-in-the-blank: ${fillInBlankCount}`);
    console.log(`Dual-text comparisons: ${dualTextCount}`);
    console.log('='.repeat(60));
    
    return processedQuestions;
}

// Save to JSON file
function saveToJSON(questions, outputPath) {
    const jsonContent = JSON.stringify(questions, null, 2);
    fs.writeFileSync(outputPath, jsonContent, 'utf8');
    console.log(`\n✅ Saved ${questions.length} questions to: ${outputPath}`);
    
    // Also save a minified version for production
    const minifiedPath = outputPath.replace('.json', '.min.json');
    fs.writeFileSync(minifiedPath, JSON.stringify(questions), 'utf8');
    console.log(`✅ Saved minified version to: ${minifiedPath}`);
}

// Save individual test files
function saveByTest(questions, outputDir) {
    // Group questions by test
    const testGroups = {};
    
    questions.forEach(q => {
        const testKey = q.testName || 'Unknown';
        if (!testGroups[testKey]) {
            testGroups[testKey] = [];
        }
        testGroups[testKey].push(q);
    });
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save each test separately
    Object.keys(testGroups).forEach(testName => {
        const filename = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
        const filepath = `${outputDir}/${filename}`;
        fs.writeFileSync(filepath, JSON.stringify(testGroups[testName], null, 2), 'utf8');
        console.log(`✅ Saved ${testGroups[testName].length} questions for "${testName}" to: ${filepath}`);
    });
}

// Main execution
function main() {
    const csvPath = process.argv[2] || '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv';
    const outputPath = process.argv[3] || 'sat_questions_correct.json';
    const outputDir = process.argv[4] || 'sat_questions_by_test_correct';
    
    try {
        // Process the CSV
        const questions = processCSV(csvPath);
        
        // Save all questions to single JSON
        saveToJSON(questions, outputPath);
        
        // Save questions grouped by test
        saveByTest(questions, outputDir);
        
        console.log('\n🎉 All processing complete with CORRECT extraction!');
        console.log('Back to optimal passage extraction with enhanced patterns.');
        
    } catch (error) {
        console.error('❌ Error processing CSV:', error.message);
        process.exit(1);
    }
}

// Run the script
main();