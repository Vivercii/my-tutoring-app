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

async function deleteAndImportEnhanced() {
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
  
  // Now import the enhanced CSV
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
    
    // Create answer options in batch using createMany for better performance
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
    
    // Create the exam question linking
    await prisma.examQuestion.create({
      data: {
        moduleId: module.id,
        questionId: questionBankItem.id,
        order: (i % questionsPerModule) + 1
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
          passage: true,
          options: true
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
    if (ex.question.options && ex.question.options.length > 0) {
      console.log(`   Answer choices: ${ex.question.options.map(o => o.text).slice(0, 2).join(', ')}...`);
      const correct = ex.question.options.find(o => o.isCorrect);
      console.log(`   Correct answer: ${correct ? ['A', 'B', 'C', 'D'][ex.question.options.indexOf(correct)] : 'None'}`);
    }
    if (ex.question.passage) {
      console.log(`   Passage HTML length: ${ex.question.passage.content?.length} characters`);
      console.log(`   Has visuals: ${ex.question.passage.hasVisualContent}`);
    }
  });
}

// Run the import
deleteAndImportEnhanced()
  .catch(console.error)
  .finally(() => prisma.$disconnect());