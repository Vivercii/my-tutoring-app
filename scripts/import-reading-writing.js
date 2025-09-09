const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Extract passage and question using the same logic as your HTML script
function parseQuestion(fullText) {
  if (!fullText) return { passage: '', question: '' };
  
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
  
  // Use lastIndexOf to find the last occurrence
  for (const pattern of patterns) {
    const index = fullText.lastIndexOf(pattern);
    if (index > splitPoint) {
      splitPoint = index;
    }
  }
  
  if (splitPoint > 0) {
    return {
      passage: fullText.substring(0, splitPoint).trim(),
      question: fullText.substring(splitPoint).trim()
    };
  }
  
  return { passage: '', question: fullText };
}

async function importReadingWriting() {
  const csvPath = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv';
  
  console.log('📚 Reading CSV from:', csvPath);
  
  // Read CSV file
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Parse CSV
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`Found ${data.length} rows in CSV\n`);
  
  // First, find all Reading & Writing questions in the database
  const readingWritingQuestions = await prisma.examQuestion.findMany({
    where: {
      OR: [
        { module: { section: { title: { contains: 'Reading' } } } },
        { module: { section: { title: { contains: 'Writing' } } } }
      ]
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
  
  console.log(`Found ${readingWritingQuestions.length} Reading & Writing questions in database\n`);
  
  // Delete existing passages
  const deleted = await prisma.passage.deleteMany({
    where: {
      OR: [
        { title: { contains: 'Reading' } },
        { title: { contains: 'Writing' } }
      ]
    }
  });
  
  console.log(`Deleted ${deleted.count} existing passages\n`);
  
  // Create a map to track passages
  const passageMap = new Map();
  let processed = 0;
  let withPassages = 0;
  let updated = 0;
  
  // Process each CSV row
  for (const row of data) {
    // Skip if not Reading & Writing module
    if (!row.Module || (!row.Module.includes('Reading') && !row.Module.includes('Writing'))) {
      continue;
    }
    
    // Use HTML content if available, otherwise plain text
    const fullText = row.Question_html || row.Question;
    if (!fullText) continue;
    
    // Parse passage and question
    const { passage, question } = parseQuestion(fullText);
    
    // Try to find matching question in database
    // First try to match by question text similarity
    const matchingQuestion = readingWritingQuestions.find(dbQ => {
      const dbText = dbQ.question.questionText || '';
      // Check if the first 50 characters match (accounting for HTML tags)
      const cleanDbText = dbText.replace(/<[^>]*>/g, '').substring(0, 50);
      const cleanCsvText = fullText.replace(/<[^>]*>/g, '').substring(0, 50);
      return cleanDbText === cleanCsvText;
    });
    
    if (!matchingQuestion) {
      continue;
    }
    
    processed++;
    
    // Handle passage creation/reuse
    if (passage && passage.length > 30) {
      let passageId = passageMap.get(passage);
      
      if (!passageId) {
        // Create new passage
        const newPassage = await prisma.passage.create({
          data: {
            title: `${matchingQuestion.module.section.title} - ${row.Module || 'Module'}`,
            content: passage,
            program: 'SAT'
          }
        });
        passageId = newPassage.id;
        passageMap.set(passage, passageId);
        console.log(`✓ Created passage for ${matchingQuestion.module.section.title}`);
      }
      
      // Update question with passage and clean question text
      await prisma.questionBankItem.update({
        where: { id: matchingQuestion.question.id },
        data: {
          questionText: question || fullText,
          passageId: passageId
        }
      });
      
      withPassages++;
      updated++;
    } else {
      // Just update question text without passage
      await prisma.questionBankItem.update({
        where: { id: matchingQuestion.question.id },
        data: {
          questionText: fullText,
          passageId: null
        }
      });
      updated++;
    }
    
    if (processed % 50 === 0) {
      console.log(`Processed ${processed} questions...`);
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions processed: ${processed}`);
  console.log(`- Questions updated: ${updated}`);
  console.log(`- Questions with passages: ${withPassages}`);
  console.log(`- Passages created: ${passageMap.size}`);
  
  // Verify results
  const finalCount = await prisma.questionBankItem.count({
    where: {
      passageId: { not: null }
    }
  });
  
  console.log(`\n🔍 Verification: ${finalCount} questions now have passages in database`);
}

// Run the import
importReadingWriting()
  .catch(console.error)
  .finally(() => prisma.$disconnect());