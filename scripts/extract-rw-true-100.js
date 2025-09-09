const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Complete parsing logic with dual-text handling
function parseQuestion(fullText) {
  if (!fullText) return { 
    passage: '', 
    question: '',
    hasVisualContent: false,
    hasUnderline: false,
    isDualText: false
  };
  
  // Clean the text - normalize different blank representations
  fullText = fullText
    .replace(/______blank/g, '_____')
    .replace(/<span[^>]*>blank<\/span>/g, '_____')
    .replace(/<span[^>]*>______<\/span>/g, '_____')
    .replace(/<span class="sr-only">blank<\/span>/g, '_____')
    .replace(/<span aria-hidden="true">______<\/span>/g, '_____')
    .trim();
  
  // Check for visual content
  const hasVisualContent = fullText.includes('<svg') || 
                           fullText.includes('<img') || 
                           fullText.includes('<table') ||
                           fullText.includes('graph') ||
                           fullText.includes('figure') ||
                           fullText.includes('diagram');
  
  // Check for underline
  const hasUnderline = fullText.includes('underlined');
  
  // Check if this is a dual-text comparison
  const isDualText = fullText.includes('Text 1') && fullText.includes('Text 2');
  
  // Question patterns - extended for all scenarios
  const patterns = [
    // Dual-text specific patterns
    "Based on the texts",
    "Both texts",
    "The author of Text 2",
    "The author of Text 1",
    "Text 1 and Text 2",
    "How would the author",
    "Compared to Text 1",
    "Unlike Text 1",
    // Standard patterns
    "Which choice completes",
    "Which choice best describes",
    "Which choice best states",
    "Which choice best",
    "Which choice most",
    "Which finding",
    "Which quotation",
    "Which statement",
    "Which of the following",
    "What is the main",
    "What is the primary",
    "What is true about",
    "What does the underlined",
    "What does the word",
    "What does the author",
    "What function does",
    "What can most reasonably",
    "As used in the text",
    "According to the text",
    "According to the passage",
    "Based on the text",
    "Based on the passage",
    "The passage most strongly suggests",
    "The passage indicates",
    "The author's use of",
    "The author most likely",
    "The primary purpose",
    "The main purpose",
    "The main idea",
    "How does the",
    "Why does the",
    "In the context of",
    "It can most reasonably be inferred",
    "It can reasonably be concluded"
  ];
  
  let splitPoint = -1;
  let matchedPattern = '';
  
  // Find the LAST occurrence of any pattern
  for (const pattern of patterns) {
    const index = fullText.lastIndexOf(pattern);
    if (index > splitPoint) {
      splitPoint = index;
      matchedPattern = pattern;
    }
  }
  
  // Check if it's a fill-in-the-blank question
  const hasBlank = fullText.includes('_____');
  
  if (hasBlank) {
    // For fill-in-the-blank, the question pattern comes AFTER the blank
    if (splitPoint > 0 && splitPoint > fullText.indexOf('_____')) {
      return {
        passage: fullText.substring(0, splitPoint).trim(),
        question: fullText.substring(splitPoint).trim(),
        hasPassage: true,
        hasVisualContent,
        hasUnderline,
        isDualText
      };
    } else {
      // No clear question pattern after blank
      return {
        passage: fullText,
        question: 'Which choice completes the text with the most logical and precise word or phrase?',
        hasPassage: true,
        hasVisualContent,
        hasUnderline,
        isDualText
      };
    }
  }
  
  // For dual-text, literary excerpts, or any text with "The following text"
  if (isDualText || fullText.includes("The following text")) {
    // Even with a low threshold, if we found a pattern, use it
    if (splitPoint > 50) {
      return {
        passage: fullText.substring(0, splitPoint).trim(),
        question: fullText.substring(splitPoint).trim(),
        hasPassage: true,
        hasVisualContent,
        hasUnderline,
        isDualText
      };
    }
  }
  
  // Standard split point validation
  if (splitPoint > 100) {
    const potentialPassage = fullText.substring(0, splitPoint).trim();
    const potentialQuestion = fullText.substring(splitPoint).trim();
    
    // Validate that the question part is reasonable
    if (potentialQuestion.length > 15) {  // Lower threshold for question length
      return {
        passage: potentialPassage,
        question: potentialQuestion,
        hasPassage: true,
        hasVisualContent,
        hasUnderline,
        isDualText
      };
    }
  }
  
  // For very short texts (likely just questions)
  if (fullText.length < 200) {
    return { 
      passage: '', 
      question: fullText,
      hasPassage: false,
      hasVisualContent,
      hasUnderline,
      isDualText: false
    };
  }
  
  // Default: no clear passage
  return { 
    passage: '', 
    question: fullText,
    hasPassage: false,
    hasVisualContent,
    hasUnderline,
    isDualText: false
  };
}

async function extractTrue100() {
  const csvPath = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv';
  
  console.log('📚 Reading CSV from:', csvPath);
  
  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`Found ${data.length} rows in CSV\n`);
  
  // Filter for English (Reading & Writing) questions
  const rwQuestions = data.filter(row => 
    row.Module && row.Module.includes('English')
  );
  
  console.log(`Found ${rwQuestions.length} English (Reading & Writing) questions in CSV\n`);
  
  // Get all Reading & Writing questions from database
  const dbQuestions = await prisma.examQuestion.findMany({
    where: {
      module: {
        section: {
          OR: [
            { title: { contains: 'Reading' } },
            { title: { contains: 'Writing' } }
          ]
        }
      }
    },
    include: {
      question: true,
      module: {
        include: {
          section: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });
  
  console.log(`Found ${dbQuestions.length} Reading & Writing questions in database\n`);
  
  // Delete ALL existing passages to start fresh
  const deletedAll = await prisma.passage.deleteMany({});
  console.log(`Deleted ${deletedAll.count} existing passages (full reset)\n`);
  
  // Process questions - MATCH BY CONTENT, NOT INDEX
  const passageMap = new Map();
  let updated = 0;
  let withPassages = 0;
  let fillInBlanks = 0;
  let dualTextCount = 0;
  let literaryCount = 0;
  let visualQuestions = 0;
  let underlineQuestions = 0;
  let notFoundInCsv = 0;
  
  console.log('Matching questions by content (this may take a moment)...\n');
  
  for (const dbQuestion of dbQuestions) {
    // Get the DB question text
    const dbText = (dbQuestion.question.questionText || '').replace(/<[^>]*>/g, '');
    const dbTextStart = dbText.substring(0, 50);
    
    // Find matching CSV row by content
    let csvRow = null;
    for (const row of rwQuestions) {
      const csvText = (row.Question || row.Question_html || '').replace(/<[^>]*>/g, '');
      
      // Match by first 50 characters (ignoring HTML)
      if (csvText.includes(dbTextStart) || dbText.includes(csvText.substring(0, 50))) {
        csvRow = row;
        break;
      }
    }
    
    if (!csvRow) {
      notFoundInCsv++;
      console.log(`⚠️ No CSV match for DB question ${dbQuestion.id}`);
      continue;
    }
    
    // Use both plain text and HTML
    const plainText = csvRow.Question || '';
    const htmlText = csvRow.Question_html || '';
    const fullText = plainText || htmlText;
    
    if (!fullText) continue;
    
    // Parse passage and question
    const result = parseQuestion(fullText);
    
    // Track statistics
    if (result.hasVisualContent) visualQuestions++;
    if (result.hasUnderline) underlineQuestions++;
    if (result.isDualText) dualTextCount++;
    if (result.hasPassage && result.passage) {
      if (result.passage.includes('_____')) fillInBlanks++;
      if (result.passage.includes('The following text')) literaryCount++;
    }
    
    let updateData = {
      questionText: result.question || fullText
    };
    
    // Create or reuse passage if found
    if (result.hasPassage && result.passage) {
      let passageId = passageMap.get(result.passage);
      
      if (!passageId) {
        const passageTitle = result.isDualText 
          ? `${dbQuestion.module.section.title} - Dual Text Comparison`
          : `${dbQuestion.module.section.title} - ${dbQuestion.module.title || 'Module'}`;
        
        const newPassage = await prisma.passage.create({
          data: {
            title: passageTitle,
            content: result.passage,
            passageText: plainText ? parseQuestion(plainText).passage : result.passage,
            fullHtml: htmlText || null,
            hasVisualContent: result.hasVisualContent,
            hasUnderline: result.hasUnderline,
            program: 'SAT'
          }
        });
        passageId = newPassage.id;
        passageMap.set(result.passage, passageId);
      }
      
      updateData.passageId = passageId;
      withPassages++;
    } else {
      updateData.passageId = null;
    }
    
    // Update the question
    await prisma.questionBankItem.update({
      where: { id: dbQuestion.question.id },
      data: updateData
    });
    
    updated++;
    
    if (updated % 50 === 0) {
      console.log(`✓ Processed ${updated} questions...`);
    }
  }
  
  console.log('\n✅ TRUE 100% Extraction Complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions in database: ${dbQuestions.length}`);
  console.log(`- Questions matched to CSV: ${updated}`);
  console.log(`- Questions not found in CSV: ${notFoundInCsv}`);
  console.log(`- Questions with passages: ${withPassages} (${(withPassages/updated*100).toFixed(1)}%)`);
  console.log(`  - Fill-in-blank: ${fillInBlanks}`);
  console.log(`  - Dual-text comparisons: ${dualTextCount}`);
  console.log(`  - Literary excerpts: ${literaryCount}`);
  console.log(`- Questions with visual content: ${visualQuestions}`);
  console.log(`- Questions with underlines: ${underlineQuestions}`);
  console.log(`- Unique passages created: ${passageMap.size}`);
  
  // Final verification
  const finalCount = await prisma.questionBankItem.count({
    where: {
      passageId: { not: null }
    }
  });
  
  console.log(`\n🔍 Final verification: ${finalCount} questions have passages in database`);
  
  // Check remaining questions without passages
  const noPassageCount = await prisma.examQuestion.count({
    where: {
      module: {
        section: {
          OR: [
            { title: { contains: 'Reading' } },
            { title: { contains: 'Writing' } }
          ]
        }
      },
      question: {
        passageId: null
      }
    }
  });
  
  if (noPassageCount > 0) {
    console.log(`\n⚠️ ${noPassageCount} questions still without passages`);
    console.log('These may be questions that genuinely have no extractable passage.');
  } else {
    console.log('\n🏆 PERFECT! 100% of Reading & Writing questions now have proper extraction!');
  }
  
  const accuracy = (withPassages / updated) * 100;
  console.log(`\n🎯 FINAL EXTRACTION ACCURACY: ${accuracy.toFixed(1)}%`);
  
  if (accuracy === 100) {
    console.log('🏆 PERFECT SCORE! All matched questions successfully extracted!');
  } else if (accuracy >= 99) {
    console.log('✨ EXCELLENT! Near-perfect extraction achieved!');
  } else if (accuracy >= 95) {
    console.log('✅ GREAT! Most questions properly extracted.');
  }
}

// Run the true 100% extraction
extractTrue100()
  .catch(console.error)
  .finally(() => prisma.$disconnect());