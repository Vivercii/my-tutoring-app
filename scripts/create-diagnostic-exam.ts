import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDiagnosticExam() {
  try {
    console.log('Creating Diagnostic Exam...')
    
    // Create the diagnostic exam
    const exam = await prisma.exam.create({
      data: {
        title: 'Diagnostic Exam',
        description: 'Practice test',
        program: 'SAT',
        examType: 'DIAGNOSTIC',
        timeLimit: 180, // 3 hours
        isPublished: true,
        sections: {
          create: [
            {
              title: 'Math',
              order: 1,
              modules: {
                create: [
                  {
                    title: 'Module 1',
                    order: 1,
                    timeLimit: 35
                  },
                  {
                    title: 'Module 2',
                    order: 2,
                    timeLimit: 35
                  }
                ]
              }
            },
            {
              title: 'Reading and Writing',
              order: 2,
              modules: {
                create: [
                  {
                    title: 'Module 1',
                    order: 1,
                    timeLimit: 32
                  },
                  {
                    title: 'Module 2',
                    order: 2,
                    timeLimit: 32
                  }
                ]
              }
            }
          ]
        }
      },
      include: {
        sections: {
          include: {
            modules: true
          }
        }
      }
    })

    console.log('✅ Diagnostic Exam created successfully!')
    console.log(`Exam ID: ${exam.id}`)
    
    // Now add the existing questions to the first module
    const mathModule1 = exam.sections[0].modules[0]
    
    // Get all the questions we've already imported
    const existingQuestions = await prisma.questionBankItem.findMany({
      where: {
        program: 'SAT',
        subject: 'Math'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Get the most recent questions
    })
    
    console.log(`\nFound ${existingQuestions.length} existing questions to add`)
    
    // Add questions to the module
    let order = 1
    for (const question of existingQuestions) {
      await prisma.examQuestion.create({
        data: {
          moduleId: mathModule1.id,
          questionId: question.id,
          order: order++
        }
      })
      console.log(`  ✓ Added question: ${question.questionCode}`)
    }
    
    console.log(`\n🎉 Diagnostic Exam ready with ${existingQuestions.length} questions!`)
    console.log(`📍 Exam ID: ${exam.id}`)
    console.log(`🔗 Students can access it from: /dashboard/exams`)
    
    return exam
    
  } catch (error) {
    console.error('Error creating diagnostic exam:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  createDiagnosticExam()
}