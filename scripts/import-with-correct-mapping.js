const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Extract text content from HTML
function extractTextFromHTML(html) {
  if (!html) return '';
  // Remove all HTML tags and get just the text
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract just the answer text from complex HTML
function extractAnswerText(html) {
  if (!html) return '';
  
  // Look for the actual answer text pattern
  const match = html.match(/<div class="self-center">.*?<p>(.*?)<\/p>/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Fallback to removing all HTML
  return extractTextFromHTML(html);
}

// Parse module string to get test number and module info
function parseModuleString(moduleStr) {
  if (!moduleStr) return null;
  
  // Pattern for Bluebook tests: "Bluebook - SAT Practice #X - English - Module Y"
  const bluebookMatch = moduleStr.match(/Bluebook - SAT Practice #(\d+) - English - Module (\d+)(?:\s*-\s*(Easy|Hard))?/);
  if (bluebookMatch) {
    return {
      source: 'Bluebook',
      testNumber: parseInt(bluebookMatch[1]),
      moduleNumber: parseInt(bluebookMatch[2]),
      difficulty: bluebookMatch[3] || null
    };
  }
  
  // Add patterns for other sources if needed
  return null;
}

async function importWithCorrectMapping() {
  console.log('🗑️  Deleting existing Reading & Writing questions...\n');
  
  // First, delete all ExamQuestions for Reading & Writing modules
  const deletedExamQuestions = await prisma.examQuestion.deleteMany({
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
  
  console.log(`Deleted ${deletedExamQuestions.count} exam question links\n`);
  
  // Delete all QuestionBankItems for English/Reading & Writing
  const deletedQuestions = await prisma.questionBankItem.deleteMany({
    where: {
      AND: [
        { program: 'SAT' },
        { subject: 'English' }
      ]
    }
  });
  
  console.log(`Deleted ${deletedQuestions.count} question bank items\n`);
  
  // Delete all passages for SAT
  const deletedPassages = await prisma.passage.deleteMany({
    where: {
      program: 'SAT'
    }
  });
  
  console.log(`Deleted ${deletedPassages.count} passages\n`);
  
  // Get all Reading & Writing modules from database with exam info
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
    }
  });
  
  console.log(`Found ${modules.length} Reading & Writing modules in database\n`);
  
  // Create a map for quick module lookup
  const moduleMap = new Map();
  modules.forEach(module => {
    const examNumber = module.section.exam.examNumber;
    const moduleOrder = module.order;
    const difficulty = module.difficulty; // EASY or HARD
    
    // Create key based on exam number and module order
    let key = `${examNumber}-${moduleOrder}`;
    if (difficulty) {
      key += `-${difficulty}`;
    }
    
    moduleMap.set(key, module);
  });
  
  // Also create mapping for Module 2 HARD -> Module 3 HARD
  // Since CSV has Module 2 HARD but our DB has Module 3 HARD
  modules.forEach(module => {
    const examNumber = module.section.exam.examNumber;
    if (module.order === 3 && module.difficulty === 'HARD') {
      // Map Module 2 HARD from CSV to Module 3 HARD in DB
      const alternateKey = `${examNumber}-2-HARD`;
      moduleMap.set(alternateKey, module);
    }
  });
  
  // Read and parse CSV
  const csvPath = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module_enhanced.csv';
  console.log('📚 Reading enhanced CSV from:', csvPath);
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`Found ${data.length} rows in enhanced CSV\n`);
  
  // Filter for Bluebook English questions only (our tests)
  const bluebookQuestions = data.filter(row => 
    row.Module && row.Module.includes('Bluebook') && row.Module.includes('English')
  );
  
  console.log(`Processing ${bluebookQuestions.length} Bluebook English questions\n`);
  
  // Group questions by their module
  const questionsByModule = {};
  bluebookQuestions.forEach(row => {
    const moduleInfo = parseModuleString(row.Module);
    if (!moduleInfo) return;
    
    // Create key to match with our database modules
    let key = `${moduleInfo.testNumber}-${moduleInfo.moduleNumber}`;
    if (moduleInfo.difficulty) {
      key += `-${moduleInfo.difficulty.toUpperCase()}`;
    }
    
    if (!questionsByModule[key]) {
      questionsByModule[key] = [];
    }
    questionsByModule[key].push(row);
  });
  
  // Process each module's questions
  const passageMap = new Map();
  let totalCreated = 0;
  let totalWithPassages = 0;
  
  for (const [moduleKey, questions] of Object.entries(questionsByModule)) {
    const module = moduleMap.get(moduleKey);
    
    if (!module) {
      console.log(`⚠️  No matching module found for key: ${moduleKey}, skipping ${questions.length} questions`);
      continue;
    }
    
    console.log(`\n📝 Processing ${questions.length} questions for Test ${module.section.exam.examNumber}, ${module.section.title} Module ${module.order}${module.difficulty ? ` (${module.difficulty})` : ''}`);
    
    let order = 1;
    for (const csvRow of questions) {
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
          totalWithPassages++;
        }
      }
      
      // Create the question first (without options)
      const questionBankItem = await prisma.questionBankItem.create({
        data: {
          program: 'SAT',
          subject: 'English',
          topic: module.section.title,
          difficulty: module.difficulty || 'Medium',
          questionText: questionText,  // The extracted question for right panel
          questionType: 'MULTIPLE_CHOICE',
          points: 1,
          ...(passageId ? {
            passage: {
              connect: { id: passageId }
            }
          } : {}),
          explanation: extractTextFromHTML(csvRow['Explanation_html']) || csvRow['Explanation'] || csvRow['Explaination'] || ''
        }
      });
      
      // Create answer options in batch
      const choices = [
        { label: 'A', html: csvRow['Choice A_html'], text: csvRow['Choice A'] },
        { label: 'B', html: csvRow['Choice B_html'], text: csvRow['Choice B'] },
        { label: 'C', html: csvRow['Choice C_html'], text: csvRow['Choice C'] },
        { label: 'D', html: csvRow['Choice D_html'], text: csvRow['Choice D'] }
      ];
      
      const answerData = choices.map(choice => ({
        text: choice.html ? extractAnswerText(choice.html) : (choice.text || ''),
        isCorrect: csvRow['Correct Answer'] === choice.label,
        questionId: questionBankItem.id
      }));
      
      await prisma.answerOption.createMany({
        data: answerData
      });
      
      // Create the exam question linking with proper order
      await prisma.examQuestion.create({
        data: {
          moduleId: module.id,
          questionId: questionBankItem.id,
          order: order++
        }
      });
      
      totalCreated++;
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions created: ${totalCreated}`);
  console.log(`- Questions with passages: ${totalWithPassages}`);
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
  
  // Show sample from Test 1 Module 1
  const test1Module1 = await prisma.examQuestion.findMany({
    where: {
      module: {
        section: {
          exam: {
            examNumber: 1
          },
          title: { contains: 'Reading' }
        },
        order: 1
      }
    },
    include: {
      question: {
        include: {
          passage: true,
          options: true
        }
      },
      module: {
        include: {
          section: {
            include: {
              exam: true
            }
          }
        }
      }
    },
    orderBy: {
      order: 'asc'
    },
    take: 3
  });
  
  console.log('\n📝 Sample questions from Test 1, Module 1:');
  test1Module1.forEach((ex, i) => {
    console.log(`\n${i + 1}. Order ${ex.order}:`);
    console.log(`   Question: "${ex.question.questionText?.substring(0, 80)}..."`);
    console.log(`   Has passage: ${ex.question.passageId ? 'Yes' : 'No'}`);
    if (ex.question.options && ex.question.options.length > 0) {
      const correct = ex.question.options.find(o => o.isCorrect);
      console.log(`   Correct answer: ${correct ? ['A', 'B', 'C', 'D'][ex.question.options.indexOf(correct)] : 'None'}`);
    }
  });
}

// Run the import
importWithCorrectMapping()
  .catch(console.error)
  .finally(() => prisma.$disconnect());