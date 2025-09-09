import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST /api/students/exams/[examId]/answers - Save answer for a question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const examId = resolvedParams.examId
    const body = await request.json()
    const { questionId, selectedChoice, textAnswer } = body

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 })
    }

    // Get assignment
    const assignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Exam already completed' }, { status: 400 })
    }
    
    // Find the ExamQuestion record
    const examQuestion = await prisma.examQuestion.findFirst({
      where: {
        module: {
          section: {
            examId: examId
          }
        },
        questionId: questionId
      }
    })
    
    if (!examQuestion) {
      return NextResponse.json({ error: 'Exam question not found' }, { status: 404 })
    }

    // Save or update answer
    const existingAnswer = await prisma.studentAnswer.findUnique({
      where: {
        assignmentId_examQuestionId: {
          assignmentId: assignment.id,
          examQuestionId: examQuestion.id
        }
      }
    })

    // Prepare the answer value (selectedChoice for MCQ, textAnswer for free response)
    const submittedAnswer = selectedChoice || textAnswer || ''

    let answer
    if (existingAnswer) {
      answer = await prisma.studentAnswer.update({
        where: {
          id: existingAnswer.id
        },
        data: {
          submittedAnswer
        }
      })
    } else {
      answer = await prisma.studentAnswer.create({
        data: {
          assignmentId: assignment.id,
          examQuestionId: examQuestion.id,
          submittedAnswer
        }
      })
    }

    // Note: ExamAssignment doesn't have updatedAt field
    // We could update the startedAt if it's not set
    if (!assignment.startedAt) {
      await prisma.examAssignment.update({
        where: { id: assignment.id },
        data: { startedAt: new Date() }
      })
    }

    return NextResponse.json(answer)
  } catch (error) {
    console.error('Error saving answer:', error)
    console.error('Request body was:', { questionId, selectedChoice, textAnswer, assignmentId })
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }
}

// GET /api/students/exams/[examId]/answers - Get all saved answers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const examId = resolvedParams.examId

    // Get assignment
    const assignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get all saved answers with the related examQuestion
    const answers = await prisma.studentAnswer.findMany({
      where: {
        assignmentId: assignment.id
      },
      include: {
        examQuestion: true
      }
    })

    // Format as a map with questionId as key
    const answersMap = answers.reduce((acc, answer) => {
      acc[answer.examQuestion.questionId] = answer.submittedAnswer
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(answersMap)
  } catch (error) {
    console.error('Error fetching answers:', error)
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
  }
}