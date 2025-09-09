const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createEnhancedRWQuestions() {
  const csvPath = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module_enhanced.csv';
  
  console.log('📚 Reading enhanced CSV from:', csvPath);
  
  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`Found ${data.length} rows in enhanced CSV\n`);
  
  // Get first 486 English questions (to match our database structure)
  const rwQuestions = data.filter(row => 
    row.Module && row.Module.includes('English')
  ).slice(0, 486); // Take only first 486 to match our exam structure
  
  console.log(`Processing ${rwQuestions.length} English (Reading & Writing) questions\n`);
  
  // Get all Reading & Writing modules from database
  const modules = await prisma.examModule.findMany({
    where: {
      section: {
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } }
        ]
      }
    },
    include: {
      section: {
        include: {
          exam: true
        }
      }
    },
    orderBy: [
      { sectionId: 'asc' },
      { id: 'asc' }
    ]
  });
  
  console.log(`Found ${modules.length} Reading & Writing modules in database\n`);
  
  // Create passages map to avoid duplicates
  const passageMap = new Map();
  let created = 0;
  let withPassages = 0;
  let questionsPerModule = Math.ceil(rwQuestions.length / modules.length);
  
  // Process questions and assign to modules
  for (let i = 0; i < rwQuestions.length; i++) {
    const csvRow = rwQuestions[i];
    const moduleIndex = Math.floor(i / questionsPerModule);
    const module = modules[moduleIndex] || modules[modules.length - 1]; // Use last module if we run out
    
    // Check if we have the enhanced fields
    if (!csvRow.Extracted_Question) {
      console.log(`⚠️ Row ${i} missing Extracted_Question, using full question`);
    }
    
    // For the LEFT PANEL (passage): Question_html contains everything
    const passageHtml = csvRow.Question_html || '';
    
    // For the RIGHT PANEL (question): Use Extracted_Question
    const questionText = csvRow.Extracted_Question || csvRow.Question || '';
    
    // Create or find passage
    let passageId = null;
    
    // Only create passage if we have content
    if (passageHtml && passageHtml.trim()) {
      passageId = passageMap.get(passageHtml);
      
      if (!passageId) {
        const newPassage = await prisma.passage.create({
          data: {
            title: `${module.section.title} - ${module.title || 'Module'}`,
            content: passageHtml,  // Store the full HTML for left panel
            passageText: csvRow.Question || '',  // Store plain text version
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
    
    // Create the question
    const questionBankItem = await prisma.questionBankItem.create({
      data: {
        program: 'SAT',
        subject: 'English',
        topic: module.section.title,
        difficulty: module.difficulty || 'Medium',
        questionText: questionText,  // The extracted question for right panel
        questionType: 'MULTIPLE_CHOICE',
        points: 1,
        passageId: passageId,
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
    
    // Create the exam question linking
    await prisma.examQuestion.create({
      data: {
        moduleId: module.id,
        questionId: questionBankItem.id,
        orderNumber: (i % questionsPerModule) + 1
      }
    });
    
    created++;
    
    if (created % 50 === 0) {
      console.log(`✓ Created ${created} questions...`);
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions created: ${created}`);
  console.log(`- Questions with passages: ${withPassages}`);
  console.log(`- Unique passages created: ${passageMap.size}`);
  
  // Final verification
  const finalCount = await prisma.examQuestion.count({
    where: {
      module: {
        section: {
          OR: [
            { title: { contains: 'Reading' } },
            { title: { contains: 'Writing' } }
          ]
        }
      }
    }
  });
  
  console.log(`\n🔍 Final verification: ${finalCount} Reading & Writing questions in database`);
  
  // Show examples
  const examples = await prisma.examQuestion.findMany({
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
      question: {
        include: {
          passage: true
        }
      },
      module: {
        include: {
          section: true
        }
      }
    },
    take: 3
  });
  
  console.log('\n📝 Example questions created:');
  examples.forEach((ex, i) => {
    console.log(`\n${i + 1}. ${ex.module.section.title} - ${ex.module.title}`);
    console.log(`   Question: "${ex.question.questionText?.substring(0, 100)}..."`);
    console.log(`   Has passage: ${ex.question.passageId ? 'Yes' : 'No'}`);
    if (ex.question.passage) {
      console.log(`   Passage HTML length: ${ex.question.passage.content?.length} characters`);
      console.log(`   Has visuals: ${ex.question.passage.hasVisualContent}`);
    }
  });
}

// Run the import
createEnhancedRWQuestions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());