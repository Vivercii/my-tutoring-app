const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Improved parsing logic with more specific patterns
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
  
  // MORE SPECIFIC patterns that are definitely questions
  const patterns = [
    "Which choice completes",
    "Which choice best describes",
    "Which choice best states",
    "Which choice best",
    "Which choice most",
    "Which finding",
    "Which quotation",
    "Which statement",
    "What is the main",  // More specific
    "What is the primary",
    "What does the underlined",
    "What does the author",
    "What function does",
    "What can most reasonably",
    "According to the text,",  // Added comma for specificity
    "According to the passage,",
    "Based on the text,",
    "Based on the passage,",
    "The passage most strongly suggests",  // More specific
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
  
  // Find the last occurrence of any pattern
  for (const pattern of patterns) {
    const index = fullText.lastIndexOf(pattern);
    if (index > splitPoint) {
      splitPoint = index;
    }
  }
  
  // IMPORTANT: Validate the split point
  // Must be at least 100 characters in (to avoid false matches)
  // AND must have substantial content before it
  if (splitPoint > 100) {
    const potentialPassage = fullText.substring(0, splitPoint).trim();
    const potentialQuestion = fullText.substring(splitPoint).trim();
    
    // Additional validation: question should be reasonable length
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
  
  // Check if it's a fill-in-the-blank question
  if (fullText.includes('_____')) {
    // For fill-in-the-blank, look for the question pattern AFTER the blank
    let questionStart = -1;
    for (const pattern of patterns) {
      const index = fullText.indexOf(pattern);
      if (index > 0 && index > fullText.indexOf('_____')) {
        questionStart = index;
        break;
      }
    }
    
    if (questionStart > 0) {
      return {
        passage: fullText.substring(0, questionStart).trim(),
        question: fullText.substring(questionStart).trim(),
        hasPassage: true,
        hasVisualContent,
        hasUnderline
      };
    } else {
      // Standard fill-in-the-blank with no explicit question
      return {
        passage: fullText,
        question: 'Which choice completes the text with the most logical and precise word or phrase?',
        hasPassage: true,
        hasVisualContent,
        hasUnderline
      };
    }
  }
  
  // Check for specific text patterns that indicate it's ALL passage
  if (fullText.startsWith("The following text") || 
      fullText.startsWith("Text 1") || 
      fullText.startsWith("Text 2")) {
    // These are definitely questions without separate passages
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
  
  // Default: treat as question without passage
  return { 
    passage: '', 
    question: fullText,
    hasPassage: false,
    hasVisualContent,
    hasUnderline
  };
}

async function extractImproved() {
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
  
  // First, let's analyze the patterns in CSV to debug
  console.log('🔍 Analyzing CSV questions for patterns...\n');
  
  let csvWithPassages = 0;
  let csvFillInBlanks = 0;
  let csvVisual = 0;
  
  const sampleNoPassage = [];
  const sampleWithPassage = [];
  
  rwQuestions.slice(0, 486).forEach((row, i) => {
    const fullText = row.Question_html || row.Question || '';
    if (!fullText) return;
    
    const result = parseQuestion(fullText);
    
    if (result.hasPassage) {
      csvWithPassages++;
      if (sampleWithPassage.length < 3) {
        sampleWithPassage.push({ index: i, result, text: fullText.substring(0, 150) });
      }
    } else {
      if (sampleNoPassage.length < 3) {
        sampleNoPassage.push({ index: i, text: fullText.substring(0, 150) });
      }
    }
    
    if (result.passage && result.passage.includes('_____')) csvFillInBlanks++;
    if (result.hasVisualContent) csvVisual++;
  });
  
  console.log(`CSV Analysis (first 486 questions):`);
  console.log(`- Questions with passages: ${csvWithPassages} (${(csvWithPassages/486*100).toFixed(1)}%)`);
  console.log(`- Fill-in-the-blank: ${csvFillInBlanks}`);
  console.log(`- Visual content: ${csvVisual}\n`);
  
  console.log('Sample questions WITH passages:');
  sampleWithPassage.forEach((s, i) => {
    console.log(`${i+1}. Row ${s.index}: "${s.text}..."`);
    console.log(`   Passage ends at: "${s.result.passage.slice(-50)}"`);
    console.log(`   Question starts: "${s.result.question.substring(0, 50)}"\n`);
  });
  
  console.log('Sample questions WITHOUT passages:');
  sampleNoPassage.forEach((s, i) => {
    console.log(`${i+1}. Row ${s.index}: "${s.text}..."\n`);
  });
  
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
  
  console.log(`\nFound ${dbQuestions.length} Reading & Writing questions in database\n`);
  
  // Delete ALL existing passages to start fresh
  const deletedAll = await prisma.passage.deleteMany({});
  console.log(`Deleted ${deletedAll.count} existing passages (full reset)\n`);
  
  // Process questions
  const passageMap = new Map();
  let updated = 0;
  let withPassages = 0;
  let fillInBlanks = 0;
  let visualQuestions = 0;
  let underlineQuestions = 0;
  
  // Match questions by index
  const minLength = Math.min(dbQuestions.length, rwQuestions.length);
  
  for (let i = 0; i < minLength; i++) {
    const dbQuestion = dbQuestions[i];
    const csvRow = rwQuestions[i];
    
    // Use both HTML and plain text
    const htmlText = csvRow.Question_html || '';
    const plainText = csvRow.Question || '';
    const fullText = htmlText || plainText;
    
    if (!fullText) continue;
    
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
  
  console.log('\n✅ Improved extraction complete!');
  console.log(`📊 Summary:`);
  console.log(`- Questions updated: ${updated}`);
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
  
  // Show examples
  const examples = await prisma.questionBankItem.findMany({
    where: {
      passageId: { not: null }
    },
    include: {
      passage: true
    },
    take: 5
  });
  
  console.log('\n📝 Example extractions:');
  examples.forEach((ex, i) => {
    console.log(`\n${i + 1}. Passage: "${ex.passage?.content?.substring(0, 100)}..."`);
    console.log(`   Question: "${ex.questionText?.substring(0, 100)}..."`);
    if (ex.passage?.hasVisualContent) console.log(`   ⚠️ Has visual content`);
    if (ex.passage?.hasUnderline) console.log(`   ⚠️ Has underlined text`);
  });
  
  // Check questions without passages
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
    console.log('Analyzing why they don\'t have passages...\n');
    
    noPassageQuestions.slice(0, 5).forEach((q, i) => {
      const text = q.question.questionText?.substring(0, 200) || '';
      console.log(`${i + 1}. ${q.module.section.title} - ${q.module.title}:`);
      console.log(`   "${text}..."\n`);
    });
  } else {
    console.log('\n✨ SUCCESS: 100% of Reading & Writing questions now have proper extraction!');
  }
  
  console.log('\n📈 Final extraction accuracy: ' + ((withPassages / dbQuestions.length) * 100).toFixed(1) + '%');
}

// Run the improved extraction
extractImproved()
  .catch(console.error)
  .finally(() => prisma.$disconnect());