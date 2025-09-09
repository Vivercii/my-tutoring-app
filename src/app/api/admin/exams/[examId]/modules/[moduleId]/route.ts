import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId, moduleId } = await params

    const module = await prisma.examModule.findUnique({
      where: { id: moduleId },
      include: {
        section: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                description: true,
                program: true
              }
            }
          }
        },
        questions: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify the module belongs to the specified exam
    if (module.section.exam.id !== examId) {
      return NextResponse.json({ error: 'Module does not belong to this exam' }, { status: 400 })
    }

    return NextResponse.json({
      module: {
        id: module.id,
        title: module.title,
        order: module.order,
        moduleType: module.moduleType,
        difficulty: module.difficulty,
        timeLimit: module.timeLimit,
        questions: module.questions.map(eq => ({
          id: eq.id,
          order: eq.order,
          question: {
            id: eq.question.id,
            questionCode: eq.question.questionCode,
            questionText: eq.question.questionText,
            questionType: eq.question.questionType,
            points: eq.question.points,
            difficulty: eq.question.difficulty,
            explanation: eq.question.explanation,
            options: eq.question.options.map(opt => ({
              id: opt.id,
              text: opt.text,
              isCorrect: opt.isCorrect
            }))
          }
        }))
      },
      section: {
        id: module.section.id,
        title: module.section.title,
        order: module.section.order
      },
      exam: module.section.exam
    })
  } catch (error) {
    console.error('Error fetching module:', error)
    return NextResponse.json({ error: 'Failed to fetch module' }, { status: 500 })
  }
}