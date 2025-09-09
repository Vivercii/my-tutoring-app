const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clean up text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/______blank/g, '_____')
    .replace(/<span[^>]*>blank<\/span>/g, '_____')
    .replace(/<span[^>]*>______<\/span>/g, '_____')
    .trim();
}

// Enhanced extraction logic
function parseQuestion(fullText) {
  if (!fullText) return { passage: '', question: '' };
  
  // Clean the text first
  fullText = cleanText(fullText);
  
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
      hasPassage: true
    };
  }
  
  // Check if it's a fill-in-the-blank question
  if (fullText.includes('_____')) {
    // The whole text is the passage with a blank
    return {
      passage: fullText,
      question: 'Which choice completes the text with the most logical and precise word or phrase?',
      hasPassage: true
    };
  }
  
  // No clear passage
  return { 
    passage: '', 
    question: fullText,
    hasPassage: false
  };
}

async function fixAllReadingWriting() {
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
  
  // Process questions
  const passageMap = new Map();
  let updated = 0;
  let withPassages = 0;
  let fillInBlanks = 0;
  
  // Match questions by index (assuming they're in the same order)
  const minLength = Math.min(dbQuestions.length, rwQuestions.length);
  
  for (let i = 0; i < minLength; i++) {
    const dbQuestion = dbQuestions[i];
    const csvRow = rwQuestions[i];
    
    // Use Question field (plain text is often better for extraction)
    const fullText = csvRow.Question || csvRow.Question_html;
    if (!fullText) continue;
    
    // Parse passage and question
    const result = parseQuestion(fullText);
    
    let updateData = {
      questionText: result.question || fullText
    };
    
    // Create or reuse passage if found
    if (result.hasPassage && result.passage) {
      // Check if this is a fill-in-the-blank
      if (result.passage.includes('_____')) {
        fillInBlanks++;
      }
      
      let passageId = passageMap.get(result.passage);
      
      if (!passageId) {
        const newPassage = await prisma.passage.create({
          data: {
            title: `${dbQuestion.module.section.title} - ${dbQuestion.module.title || 'Module'}`,
            content: result.passage,
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
  
  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions updated: ${updated}`);
  console.log(`- Questions with passages: ${withPassages}`);
  console.log(`- Fill-in-the-blank questions: ${fillInBlanks}`);
  console.log(`- Unique passages created: ${passageMap.size}`);
  
  // Final verification
  const finalCount = await prisma.questionBankItem.count({
    where: {
      passageId: { not: null }
    }
  });
  
  console.log(`\n🔍 Final verification: ${finalCount} questions have passages in database`);
  
  // Show some examples
  const examples = await prisma.questionBankItem.findMany({
    where: {
      passageId: { not: null }
    },
    include: {
      passage: true
    },
    take: 3
  });
  
  console.log('\n📝 Example extractions:');
  examples.forEach((ex, i) => {
    console.log(`\n${i + 1}. Passage: "${ex.passage?.content?.substring(0, 100)}..."`);
    console.log(`   Question: "${ex.questionText?.substring(0, 100)}..."`);
  });
}

// Run the fix
fixAllReadingWriting()
  .catch(console.error)
  .finally(() => prisma.$disconnect());