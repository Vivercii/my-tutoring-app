const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  // Get first exam's first module questions
  const questions = await prisma.examQuestion.findMany({
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
    take: 10
  });
  
  console.log(`Found ${questions.length} questions in Test 1, Reading Module 1:\n`);
  questions.forEach((q, i) => {
    console.log(`${i+1}. Order: ${q.order}`);
    console.log(`   Question: "${q.question.questionText?.substring(0, 80)}..."`);
    console.log(`   Has passage: ${q.question.passageId ? 'Yes' : 'No'}`);
    if (q.question.passage) {
      console.log(`   Passage preview: "${q.question.passage.content?.substring(0, 60)}..."`);
    }
    if (q.question.options && q.question.options.length > 0) {
      const correct = q.question.options.find(o => o.isCorrect);
      console.log(`   Correct answer: ${correct ? ['A', 'B', 'C', 'D'][q.question.options.indexOf(correct)] : 'None'}`);
    }
    console.log();
  });
  
  // Also check total questions per module
  const modules = await prisma.examModule.findMany({
    where: {
      section: {
        exam: {
          examNumber: 1
        },
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } }
        ]
      }
    },
    include: {
      _count: {
        select: { questions: true }
      },
      section: true
    },
    orderBy: [
      { sectionId: 'asc' },
      { order: 'asc' }
    ]
  });
  
  console.log('\nQuestions per module in Test 1:');
  modules.forEach(m => {
    console.log(`${m.section.title} - Module ${m.order}: ${m._count.questions} questions`);
  });
}

checkOrder()
  .catch(console.error)
  .finally(() => prisma.$disconnect());