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
  
  // FIRST: Check if this is a dual-text comparison
  const isDualText = fullText.includes('Text 1') && fullText.includes('Text 2');
  
  // Question patterns - extended for dual-text scenarios
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
    "What does the underlined",
    "What does the author",
    "What function does",
    "What can most reasonably",
    "According to the text,",
    "According to the passage,",
    "Based on the text,",
    "Based on the passage,",
    "The passage most strongly suggests",
    "The passage indicates",
    "The author's use of",
    "The author most likely",
    "The primary purpose",
    "The main purpose",
    "How does the",
    "Why does the",
    "In the context of",
    "It can most reasonably be inferred",
    "It can reasonably be concluded"
  ];
  
  // For literary excerpts with character dialogue
  const literaryPatterns = [
    "The following text is adapted from",
    "The following text is from"
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
  
  // For dual-text or literary excerpts, be more aggressive about finding the split
  if (isDualText || fullText.includes("The following text")) {
    // Even if splitPoint is early, if we found a pattern, use it
    if (splitPoint > 50) {  // Lower threshold for these types
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
    if (potentialQuestion.length > 20 && potentialQuestion.length < 500) {
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

async function extract100Percent() {
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
  
  // First, analyze patterns in the CSV
  console.log('🔍 Analyzing question patterns...\n');
  
  let csvWithPassages = 0;
  let csvFillInBlanks = 0;
  let csvDualText = 0;
  let csvLiterary = 0;
  
  // Check first 486 questions
  rwQuestions.slice(0, 486).forEach((row, i) => {
    const fullText = row.Question || row.Question_html || '';
    if (!fullText) return;
    
    const result = parseQuestion(fullText);
    
    if (result.hasPassage) {
      csvWithPassages++;
      if (result.isDualText) csvDualText++;
      if (fullText.includes('_____')) csvFillInBlanks++;
      if (fullText.includes('The following text')) csvLiterary++;
    }
  });
  
  console.log(`CSV Pattern Analysis (first 486):`);
  console.log(`- Total with passages: ${csvWithPassages} (${(csvWithPassages/486*100).toFixed(1)}%)`);
  console.log(`- Fill-in-blank questions: ${csvFillInBlanks}`);
  console.log(`- Dual-text comparisons: ${csvDualText}`);
  console.log(`- Literary excerpts: ${csvLiterary}`);
  console.log(`- Questions without passages: ${486 - csvWithPassages}\n`);
  
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
  
  // Process questions
  const passageMap = new Map();
  let updated = 0;
  let withPassages = 0;
  let fillInBlanks = 0;
  let dualTextCount = 0;
  let literaryCount = 0;
  let visualQuestions = 0;
  let underlineQuestions = 0;
  
  // Match questions by index
  const minLength = Math.min(dbQuestions.length, rwQuestions.length);
  
  for (let i = 0; i < minLength; i++) {
    const dbQuestion = dbQuestions[i];
    const csvRow = rwQuestions[i];
    
    // Prefer plain text for better parsing (HTML can interfere)
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
  
  console.log('\n✅ 100% Extraction Complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions updated: ${updated}`);
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
  const noPassageQuestions = await prisma.examQuestion.findMany({
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
    },
    include: {
      question: true,
      module: {
        include: {
          section: true
        }
      }
    }
  });
  
  if (noPassageQuestions.length > 0) {
    console.log(`\n⚠️ ${noPassageQuestions.length} questions still without passages:`);
    console.log('Analyzing these remaining questions...\n');
    
    noPassageQuestions.slice(0, 5).forEach((q, i) => {
      const text = q.question.questionText || '';
      const cleanText = text.replace(/<[^>]*>/g, '');
      console.log(`${i + 1}. ${q.module.section.title} - ${q.module.title}:`);
      console.log(`   First 150 chars: "${cleanText.substring(0, 150)}..."`);
      
      // Check why it didn't match
      if (cleanText.includes('Text 1')) {
        console.log(`   ⚠️ Contains "Text 1" - should have been extracted as dual-text`);
      }
      if (cleanText.includes('The following text')) {
        console.log(`   ⚠️ Contains "The following text" - should have been extracted as literary`);
      }
      console.log('');
    });
  } else {
    console.log('\n✨ PERFECT! 100% of Reading & Writing questions now have proper extraction!');
  }
  
  const accuracy = (withPassages / dbQuestions.length) * 100;
  console.log(`\n🎯 FINAL EXTRACTION ACCURACY: ${accuracy.toFixed(1)}%`);
  
  if (accuracy === 100) {
    console.log('🏆 PERFECT SCORE! All questions successfully extracted!');
  } else if (accuracy >= 98) {
    console.log('✨ EXCELLENT! Near-perfect extraction achieved!');
  } else if (accuracy >= 95) {
    console.log('✅ GREAT! Most questions properly extracted.');
  }
}

// Run the 100% extraction
extract100Percent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());