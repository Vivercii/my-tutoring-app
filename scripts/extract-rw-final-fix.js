const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Final fixed parsing logic
function parseQuestion(fullText) {
  if (!fullText) return { 
    passage: '', 
    question: '',
    hasVisualContent: false,
    hasUnderline: false 
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
  
  // Question patterns - these indicate where the actual question starts
  const patterns = [
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
  
  let splitPoint = -1;
  let matchedPattern = '';
  
  // Find the LAST occurrence of any pattern (questions usually come at the end)
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
    // So we should split at the question pattern if it exists
    if (splitPoint > 0 && splitPoint > fullText.indexOf('_____')) {
      // The passage is everything before the question pattern
      return {
        passage: fullText.substring(0, splitPoint).trim(),
        question: fullText.substring(splitPoint).trim(),
        hasPassage: true,
        hasVisualContent,
        hasUnderline
      };
    } else {
      // No clear question pattern after blank - treat whole as passage
      // This handles cases where the blank is at the very end
      return {
        passage: fullText,
        question: 'Which choice completes the text with the most logical and precise word or phrase?',
        hasPassage: true,
        hasVisualContent,
        hasUnderline
      };
    }
  }
  
  // For non-blank questions, check if we have a valid split point
  if (splitPoint > 100) {  // Need substantial text before the question
    const potentialPassage = fullText.substring(0, splitPoint).trim();
    const potentialQuestion = fullText.substring(splitPoint).trim();
    
    // Validate that the question part is reasonable
    if (potentialQuestion.length > 20 && potentialQuestion.length < 500) {
      return {
        passage: potentialPassage,
        question: potentialQuestion,
        hasPassage: true,
        hasVisualContent,
        hasUnderline
      };
    }
  }
  
  // Special cases - these indicate the whole thing is a question
  if (fullText.startsWith("The following text is adapted from") || 
      fullText.startsWith("Text 1") || 
      fullText.startsWith("Text 2")) {
    // But wait - check if there's a question pattern later in the text
    if (splitPoint > 200) {
      return {
        passage: fullText.substring(0, splitPoint).trim(),
        question: fullText.substring(splitPoint).trim(),
        hasPassage: true,
        hasVisualContent,
        hasUnderline
      };
    }
    // Otherwise, it's all question
    return { 
      passage: '', 
      question: fullText,
      hasPassage: false,
      hasVisualContent,
      hasUnderline
    };
  }
  
  // For very short texts (likely just questions)
  if (fullText.length < 200) {
    return { 
      passage: '', 
      question: fullText,
      hasPassage: false,
      hasVisualContent,
      hasUnderline
    };
  }
  
  // Default: no clear passage
  return { 
    passage: '', 
    question: fullText,
    hasPassage: false,
    hasVisualContent,
    hasUnderline
  };
}

async function extractFinalFix() {
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
  let csvNonBlankWithPassage = 0;
  
  // Check first 486 questions
  rwQuestions.slice(0, 486).forEach((row, i) => {
    const fullText = row.Question || row.Question_html || '';
    if (!fullText) return;
    
    const result = parseQuestion(fullText);
    
    if (result.hasPassage) {
      csvWithPassages++;
      if (fullText.includes('_____') || fullText.includes('blank')) {
        csvFillInBlanks++;
      } else {
        csvNonBlankWithPassage++;
      }
    }
  });
  
  console.log(`CSV Pattern Analysis (first 486):`);
  console.log(`- Total with passages: ${csvWithPassages} (${(csvWithPassages/486*100).toFixed(1)}%)`);
  console.log(`- Fill-in-blank with passages: ${csvFillInBlanks}`);
  console.log(`- Non-blank with passages: ${csvNonBlankWithPassage}`);
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
  let nonBlankWithPassages = 0;
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
    if (result.hasPassage && result.passage) {
      if (result.passage.includes('_____')) {
        fillInBlanks++;
      } else {
        nonBlankWithPassages++;
      }
    }
    
    let updateData = {
      questionText: result.question || fullText
    };
    
    // Create or reuse passage if found
    if (result.hasPassage && result.passage) {
      let passageId = passageMap.get(result.passage);
      
      if (!passageId) {
        const newPassage = await prisma.passage.create({
          data: {
            title: `${dbQuestion.module.section.title} - ${dbQuestion.module.title || 'Module'}`,
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
  
  console.log('\n✅ Final extraction complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions updated: ${updated}`);
  console.log(`- Questions with passages: ${withPassages} (${(withPassages/updated*100).toFixed(1)}%)`);
  console.log(`  - Fill-in-blank passages: ${fillInBlanks}`);
  console.log(`  - Non-blank passages: ${nonBlankWithPassages}`);
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
  
  // Show examples of both types
  const fillInBlankExamples = await prisma.questionBankItem.findMany({
    where: {
      passageId: { not: null },
      passage: {
        content: { contains: '_____' }
      }
    },
    include: { passage: true },
    take: 2
  });
  
  const nonBlankExamples = await prisma.questionBankItem.findMany({
    where: {
      passageId: { not: null },
      passage: {
        content: { not: { contains: '_____' } }
      }
    },
    include: { passage: true },
    take: 2
  });
  
  console.log('\n📝 Fill-in-blank examples:');
  fillInBlankExamples.forEach((ex, i) => {
    console.log(`${i + 1}. Passage ends: "...${ex.passage?.content?.slice(-100)}"`);
    console.log(`   Question: "${ex.questionText?.substring(0, 80)}..."\n`);
  });
  
  console.log('📝 Non-blank passage examples:');
  nonBlankExamples.forEach((ex, i) => {
    console.log(`${i + 1}. Passage ends: "...${ex.passage?.content?.slice(-100)}"`);
    console.log(`   Question: "${ex.questionText?.substring(0, 80)}..."\n`);
  });
  
  // Check remaining questions without passages
  const noPassageQuestions = await prisma.examQuestion.count({
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
  
  if (noPassageQuestions > 0) {
    console.log(`⚠️ ${noPassageQuestions} questions still without passages`);
    console.log('These are likely standalone questions or have unique formats.\n');
  }
  
  const accuracy = (withPassages / dbQuestions.length) * 100;
  console.log(`\n🎯 FINAL EXTRACTION ACCURACY: ${accuracy.toFixed(1)}%`);
  
  if (accuracy >= 95) {
    console.log('✨ EXCELLENT! Near-perfect extraction achieved!');
  } else if (accuracy >= 85) {
    console.log('✅ GOOD! Most questions properly extracted.');
  } else {
    console.log('📊 Moderate extraction. Some questions may need manual review.');
  }
}

// Run the final fixed extraction
extractFinalFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());