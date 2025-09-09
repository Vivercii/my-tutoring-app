const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Your exact parsing logic
function parseQuestion(fullText) {
  if (!fullText) return { 
    passage: '', 
    question: '',
    hasVisualContent: false,
    hasUnderline: false 
  };
  
  // Clean the text
  fullText = fullText
    .replace(/______blank/g, '_____')
    .replace(/<span[^>]*>blank<\/span>/g, '_____')
    .replace(/<span[^>]*>______<\/span>/g, '_____')
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
  
  const patterns = [
    "Which choice completes",
    "Which choice best describes",
    "Which choice best",
    "Which choice most",
    "Which finding",
    "Which quotation",
    "Which statement",
    "What is the",
    "What does",
    "What can",
    "What function",
    "According to",
    "Based on",
    "The passage",
    "The author",
    "The student",
    "The main",
    "How does",
    "Why does",
    "In the context",
    "The text",
    "It can most reasonably"
  ];
  
  let splitPoint = -1;
  
  // Find the last occurrence of any pattern
  for (const pattern of patterns) {
    const index = fullText.lastIndexOf(pattern);
    if (index > splitPoint) {
      splitPoint = index;
    }
  }
  
  // If we found a split point and have meaningful passage content
  if (splitPoint > 50) {  // At least 50 chars for passage
    return {
      passage: fullText.substring(0, splitPoint).trim(),
      question: fullText.substring(splitPoint).trim(),
      hasPassage: true,
      hasVisualContent,
      hasUnderline
    };
  }
  
  // Check if it's a fill-in-the-blank question
  if (fullText.includes('_____')) {
    // The whole text is the passage with a blank
    return {
      passage: fullText,
      question: 'Which choice completes the text with the most logical and precise word or phrase?',
      hasPassage: true,
      hasVisualContent,
      hasUnderline
    };
  }
  
  // Check for specific math/visual indicators
  if (hasVisualContent || fullText.includes('$') || fullText.includes('\\(')) {
    return { 
      passage: '', 
      question: fullText,
      hasPassage: false,
      hasVisualContent: true,
      hasUnderline
    };
  }
  
  // No clear passage
  return { 
    passage: '', 
    question: fullText,
    hasPassage: false,
    hasVisualContent,
    hasUnderline
  };
}

async function extractComplete() {
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
  
  console.log(`Found ${dbQuestions.length} Reading & Writing questions in database`);
  console.log(`Note: We have ${rwQuestions.length} questions in CSV but only ${dbQuestions.length} in DB\n`);
  
  // Delete ALL existing passages to start fresh
  const deletedAll = await prisma.passage.deleteMany({});
  console.log(`Deleted ${deletedAll.count} existing passages (full reset)\n`);
  
  // Process questions - we'll process ALL CSV questions
  const passageMap = new Map();
  let updated = 0;
  let withPassages = 0;
  let fillInBlanks = 0;
  let visualQuestions = 0;
  let underlineQuestions = 0;
  let skipped = 0;
  
  // Process each Reading & Writing question from the database
  for (let i = 0; i < dbQuestions.length; i++) {
    const dbQuestion = dbQuestions[i];
    
    // Try to find corresponding CSV data
    // Since we have more CSV rows than DB questions, we need to find the right match
    let csvRow = null;
    let csvIndex = -1;
    
    // First try to match by position in the first 486 CSV rows
    if (i < rwQuestions.length) {
      csvRow = rwQuestions[i];
      csvIndex = i;
    }
    
    // If no CSV row found or empty, try to find by content similarity
    if (!csvRow || (!csvRow.Question && !csvRow.Question_html)) {
      // Look through all CSV rows for a match
      for (let j = 0; j < rwQuestions.length; j++) {
        const row = rwQuestions[j];
        if (row.Question || row.Question_html) {
          const csvText = (row.Question_html || row.Question || '').substring(0, 50).replace(/<[^>]*>/g, '');
          const dbText = (dbQuestion.question.questionText || '').substring(0, 50).replace(/<[^>]*>/g, '');
          
          if (csvText && dbText && csvText.includes(dbText.substring(0, 20))) {
            csvRow = row;
            csvIndex = j;
            break;
          }
        }
      }
    }
    
    if (!csvRow || (!csvRow.Question && !csvRow.Question_html)) {
      skipped++;
      console.log(`⚠️ No CSV data found for question ${i + 1}`);
      continue;
    }
    
    // Use both HTML and plain text
    const htmlText = csvRow.Question_html || '';
    const plainText = csvRow.Question || '';
    const fullText = htmlText || plainText;
    
    if (!fullText) {
      skipped++;
      continue;
    }
    
    // Parse passage and question
    const result = parseQuestion(fullText);
    
    // Track statistics
    if (result.hasVisualContent) visualQuestions++;
    if (result.hasUnderline) underlineQuestions++;
    if (result.passage && result.passage.includes('_____')) fillInBlanks++;
    
    let updateData = {
      questionText: result.question || fullText
    };
    
    // Create or reuse passage if found
    if (result.hasPassage && result.passage) {
      let passageId = passageMap.get(result.passage);
      
      if (!passageId) {
        const newPassage = await prisma.passage.create({
          data: {
            title: `${dbQuestion.module.section.title} - ${dbQuestion.module.title || 'Module'} (Q${i + 1})`,
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
  
  console.log('\n✅ Complete extraction finished!');
  console.log(`📊 Summary:`);
  console.log(`- Questions in database: ${dbQuestions.length}`);
  console.log(`- Questions in CSV: ${rwQuestions.length}`);
  console.log(`- Questions updated: ${updated}`);
  console.log(`- Questions skipped (no CSV match): ${skipped}`);
  console.log(`- Questions with passages: ${withPassages} (${(withPassages/updated*100).toFixed(1)}%)`);
  console.log(`- Fill-in-the-blank questions: ${fillInBlanks}`);
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
  
  // Check for any questions without passages
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
    console.log(`\n⚠️ ${noPassageQuestions.length} questions still without passages`);
    console.log('These might be questions that genuinely don\'t have passages (pure grammar/vocabulary questions)');
    
    // Show first few examples
    console.log('\nFirst 5 examples without passages:');
    noPassageQuestions.slice(0, 5).forEach((q, i) => {
      const text = q.question.questionText?.substring(0, 100) || '';
      console.log(`${i + 1}. ${q.module.section.title} - ${q.module.title}: "${text}..."`);
    });
  } else {
    console.log('\n✨ SUCCESS: 100% of Reading & Writing questions now have proper extraction!');
  }
  
  console.log('\n📈 Extraction accuracy: ' + ((withPassages / dbQuestions.length) * 100).toFixed(1) + '%');
}

// Run the complete extraction
extractComplete()
  .catch(console.error)
  .finally(() => prisma.$disconnect());