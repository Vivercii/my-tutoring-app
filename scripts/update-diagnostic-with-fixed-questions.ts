import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDiagnosticExam() {
  try {
    // Find the diagnostic exam
    const exam = await prisma.exam.findFirst({
      where: { 
        examType: 'DIAGNOSTIC',
        isPublished: true 
      },
      include: {
        sections: {
          include: {
            modules: true
          }
        }
      }
    })

    if (!exam) {
      console.log('No diagnostic exam found.')
      return
    }

    console.log(`Updating Diagnostic Exam: ${exam.title}`)
    
    // Get the first math module
    const mathModule = exam.sections[0].modules[0]
    
    // Get the two most recently imported questions (with fixed formatting)
    const latestQuestions = await prisma.questionBankItem.findMany({
      where: {
        questionCode: {
          startsWith: 'SAT-MATH-ACTUAL-1756897086235'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${latestQuestions.length} questions with fixed formatting`)
    
    // Get current highest order number
    const existingQuestions = await prisma.examQuestion.count({
      where: { moduleId: mathModule.id }
    })
    
    // Add the fixed questions to the module
    let order = existingQuestions + 1
    for (const question of latestQuestions) {
      // Check if question already exists in module
      const existing = await prisma.examQuestion.findFirst({
        where: {
          moduleId: mathModule.id,
          questionId: question.id
        }
      })
      
      if (!existing) {
        await prisma.examQuestion.create({
          data: {
            moduleId: mathModule.id,
            questionId: question.id,
            order: order++
          }
        })
        console.log(`  ✓ Added: ${question.questionCode}`)
      } else {
        console.log(`  ⏭ Skipped (already exists): ${question.questionCode}`)
      }
    }
    
    console.log(`\n✅ Diagnostic Exam updated with properly formatted questions!`)
    console.log(`📍 Exam ID: ${exam.id}`)
    console.log(`🔗 Test at: /dashboard/exams/${exam.id}/take`)
    console.log(`\n💡 The x² should now render correctly!`)
    
  } catch (error) {
    console.error('Error updating diagnostic exam:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  updateDiagnosticExam()
}