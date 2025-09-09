const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importEnhancedRW() {
  const csvPath = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module_enhanced.csv';
  
  console.log('📚 Reading enhanced CSV from:', csvPath);
  
  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`Found ${data.length} rows in enhanced CSV\n`);
  
  // Filter for English (Reading & Writing) questions
  const rwQuestions = data.filter(row => 
    row.Module && row.Module.includes('English')
  );
  
  console.log(`Found ${rwQuestions.length} English (Reading & Writing) questions\n`);
  
  // Get all Reading & Writing exam questions from database to match with CSV
  const dbExamQuestions = await prisma.examQuestion.findMany({
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
  
  console.log(`Found ${dbExamQuestions.length} Reading & Writing questions in database\n`);
  
  // If no questions in DB, we need to know which test/module to create them for
  if (dbExamQuestions.length === 0) {
    console.log('No existing Reading & Writing questions found. Creating new questions...\n');
    
    // We'll need to get the sections and modules first
    const sections = await prisma.examSection.findMany({
      where: {
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } }
        ]
      },
      include: {
        modules: true
      }
    });
    
    if (sections.length === 0) {
      console.error('❌ No Reading & Writing sections found in database. Please create the exam structure first.');
      await prisma.$disconnect();
      return;
    }
  }
  
  // Process questions
  const passageMap = new Map();
  let created = 0;
  let updated = 0;
  let withPassages = 0;
  let skipped = 0;
  
  // Match questions by index (assuming same order)
  const minLength = Math.min(dbExamQuestions.length, rwQuestions.length);
  
  for (let i = 0; i < minLength; i++) {
    const dbQuestion = dbExamQuestions[i];
    const csvRow = rwQuestions[i];
    
    // Check if we have the enhanced fields
    if (!csvRow.Question_html || !csvRow.Extracted_Question) {
      console.log(`⚠️ Row ${i} missing enhanced fields, skipping...`);
      skipped++;
      continue;
    }
    
    // For the LEFT PANEL (passage): 
    // Question_html contains everything, we'll store it as the passage
    const passageHtml = csvRow.Question_html || '';
    
    // For the RIGHT PANEL (question):
    const questionText = csvRow.Extracted_Question || '';
    
    // Create or find passage
    let passageId = null;
    
    // Only create passage if we have content
    if (passageHtml && passageHtml.trim()) {
      passageId = passageMap.get(passageHtml);
      
      if (!passageId) {
        const newPassage = await prisma.passage.create({
          data: {
            title: `${dbQuestion.module.section.title} - ${dbQuestion.module.title || 'Module'}`,
            content: passageHtml,  // Store the full HTML
            passageText: csvRow.Question || '',  // Store plain text version if available
            fullHtml: passageHtml,
            hasVisualContent: passageHtml.includes('<table') || passageHtml.includes('<svg') || passageHtml.includes('<img'),
            hasUnderline: passageHtml.includes('underline') || passageHtml.includes('<u>'),
            program: 'SAT'
          }
        });
        passageId = newPassage.id;
        passageMap.set(passageHtml, passageId);
        withPassages++;
      }
    }
    
    // Update the question with the extracted question text and passage
    await prisma.questionBankItem.update({
      where: { id: dbQuestion.question.id },
      data: {
        questionText: questionText,
        passageId: passageId,
        // Update answer choices with HTML versions
        answerChoices: [
          csvRow['Choice A_html'] || csvRow['Choice A'] || '',
          csvRow['Choice B_html'] || csvRow['Choice B'] || '',
          csvRow['Choice C_html'] || csvRow['Choice C'] || '',
          csvRow['Choice D_html'] || csvRow['Choice D'] || ''
        ],
        correctAnswer: csvRow['Correct Answer'] || '',
        explanation: csvRow['Explanation_html'] || csvRow['Explanation'] || csvRow['Explaination'] || ''
      }
    });
    
    updated++;
    
    if (updated % 50 === 0) {
      console.log(`✓ Processed ${updated} questions...`);
    }
  }
  
  // Handle any extra questions in CSV that aren't in DB yet
  if (rwQuestions.length > dbExamQuestions.length) {
    console.log(`\n⚠️ CSV has ${rwQuestions.length - dbExamQuestions.length} more questions than database`);
    console.log('These questions were not imported. Please ensure exam structure exists first.');
  }
  
  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions updated: ${updated}`);
  console.log(`- Questions skipped: ${skipped}`);
  console.log(`- Questions with passages: ${withPassages}`);
  console.log(`- Unique passages created: ${passageMap.size}`);
  
  // Final verification
  const finalCount = await prisma.questionBankItem.count({
    where: {
      passageId: { not: null }
    }
  });
  
  console.log(`\n🔍 Final verification: ${finalCount} questions have passages in database`);
  
  // Show examples
  const examples = await prisma.questionBankItem.findMany({
    where: {
      passageId: { not: null }
    },
    include: {
      passage: true
    },
    take: 3
  });
  
  console.log('\n📝 Example imports:');
  examples.forEach((ex, i) => {
    console.log(`\n${i + 1}. Question: "${ex.questionText?.substring(0, 100)}..."`);
    console.log(`   Has passage: ${ex.passageId ? 'Yes' : 'No'}`);
    if (ex.passage) {
      console.log(`   Passage HTML length: ${ex.passage.content?.length} characters`);
    }
  });
}

// Run the import
importEnhancedRW()
  .catch(console.error)
  .finally(() => prisma.$disconnect());