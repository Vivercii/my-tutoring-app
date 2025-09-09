const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Extract passage and question using the same logic as HTML script
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

async function updateAllQuestions() {
  const csvPath = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv';
  
  console.log('📚 Reading CSV from:', csvPath);
  
  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`Found ${data.length} rows in CSV\n`);
  
  // Filter for Reading & Writing questions (they're labeled as "English" in the CSV)
  const rwQuestions = data.filter(row => 
    row.Module && row.Module.includes('English')
  );
  
  console.log(`Found ${rwQuestions.length} Reading & Writing questions in CSV\n`);
  
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
    orderBy: [
      { module: { section: { id: 'asc' } } },
      { module: { id: 'asc' } },
      { id: 'asc' }
    ]
  });
  
  console.log(`Found ${dbQuestions.length} Reading & Writing questions in database\n`);
  
  // Delete existing passages
  await prisma.passage.deleteMany({
    where: {
      OR: [
        { title: { contains: 'Reading' } },
        { title: { contains: 'Writing' } }
      ]
    }
  });
  
  console.log('Deleted existing passages\n');
  
  // Update questions sequentially (matching by order)
  const passageMap = new Map();
  let updated = 0;
  let withPassages = 0;
  
  // Process questions in order
  for (let i = 0; i < Math.min(dbQuestions.length, rwQuestions.length); i++) {
    const dbQuestion = dbQuestions[i];
    const csvRow = rwQuestions[i];
    
    // Use HTML content if available
    const fullText = csvRow.Question_html || csvRow.Question;
    if (!fullText) continue;
    
    // Parse passage and question
    const { passage, question } = parseQuestion(fullText);
    
    let updateData = {
      questionText: question || fullText,
      passageId: null
    };
    
    // Create or reuse passage if found
    if (passage && passage.length > 30) {
      let passageId = passageMap.get(passage);
      
      if (!passageId) {
        const newPassage = await prisma.passage.create({
          data: {
            title: `${dbQuestion.module.section.title} - ${csvRow.Module}`,
            content: passage,
            program: 'SAT'
          }
        });
        passageId = newPassage.id;
        passageMap.set(passage, passageId);
      }
      
      updateData.passageId = passageId;
      withPassages++;
    }
    
    // Update the question
    await prisma.questionBankItem.update({
      where: { id: dbQuestion.question.id },
      data: updateData
    });
    
    updated++;
    
    if (updated % 50 === 0) {
      console.log(`Processed ${updated} questions...`);
    }
  }
  
  console.log('\n✅ Update complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions updated: ${updated}`);
  console.log(`- Questions with passages: ${withPassages}`);
  console.log(`- Unique passages created: ${passageMap.size}`);
  
  // Verify
  const finalCount = await prisma.questionBankItem.count({
    where: {
      passageId: { not: null }
    }
  });
  
  console.log(`\n🔍 Verification: ${finalCount} total questions have passages in database`);
}

// Run the update
updateAllQuestions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());