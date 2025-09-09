import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient, ModuleType, ModuleDifficulty } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { examId } = await params
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { moduleId, answers } = await req.json()

    // Get the assignment
    const assignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId: examId
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get the module details
    const module = await prisma.examModule.findUnique({
      where: { id: moduleId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        }
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Calculate score
    let correctCount = 0
    const studentAnswers = []

    for (const examQuestion of module.questions) {
      const userAnswer = answers[examQuestion.id]
      if (!userAnswer) continue

      let isCorrect = false
      
      if (examQuestion.question.questionType === 'MULTIPLE_CHOICE') {
        const correctOption = examQuestion.question.options.find(opt => opt.isCorrect)
        isCorrect = correctOption?.id === userAnswer
      } else {
        // For short answer, you might want to implement more complex checking
        isCorrect = userAnswer.toLowerCase().trim() === examQuestion.question.options[0]?.text?.toLowerCase().trim()
      }

      if (isCorrect) correctCount++

      studentAnswers.push({
        assignmentId: assignment.id,
        examQuestionId: examQuestion.id,
        submittedAnswer: userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? examQuestion.question.points : 0
      })
    }

    // Save all answers
    await prisma.studentAnswer.createMany({
      data: studentAnswers,
      skipDuplicates: true
    })

    // Handle adaptive routing
    let nextModuleId = null
    let adaptivePath = assignment.adaptivePath
    
    if (module.moduleType === ModuleType.ROUTING) {
      // This is Module 1, determine which Module 2 to route to
      const score = correctCount
      adaptivePath = score >= 15 ? ModuleDifficulty.HARD : ModuleDifficulty.EASY
      
      // Find the appropriate Module 2
      const section = await prisma.examSection.findFirst({
        where: {
          modules: {
            some: { id: moduleId }
          }
        },
        include: {
          modules: true
        }
      })
      
      if (section) {
        const nextModule = section.modules.find(
          m => m.moduleType === ModuleType.ADAPTIVE && m.difficulty === adaptivePath
        )
        nextModuleId = nextModule?.id
      }

      // Update assignment with Module 1 score and adaptive path
      await prisma.examAssignment.update({
        where: { id: assignment.id },
        data: {
          module1Score: score,
          adaptivePath,
          currentModuleId: nextModuleId
        }
      })
    } else {
      // Module 2 complete, mark exam as complete
      const totalScore = await calculateTotalScore(assignment.id)
      
      await prisma.examAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          score: totalScore,
          currentModuleId: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      moduleScore: correctCount,
      totalQuestions: module.questions.length,
      adaptivePath,
      nextModuleId,
      isComplete: !nextModuleId
    })
  } catch (error) {
    console.error('Error submitting module:', error)
    return NextResponse.json(
      { error: 'Failed to submit module' },
      { status: 500 }
    )
  }
}

async function calculateTotalScore(assignmentId: string): Promise<number> {
  const answers = await prisma.studentAnswer.findMany({
    where: { 
      assignmentId,
      isCorrect: true
    }
  })
  return answers.length
}