import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/students/exams/[examId] - Get exam details for taking
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

    // Get exam with all questions
    const exam = await prisma.exam.findUnique({
      where: { 
        id: examId,
        isPublished: true
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: {
                    question: {
                      include: {
                        options: true,
                        passage: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or not available' }, { status: 404 })
    }

    // Get or create assignment
    let assignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId
        }
      }
    })

    if (!assignment) {
      assignment = await prisma.examAssignment.create({
        data: {
          studentId: session.user.id,
          examId,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      })
    } else if (assignment.status === 'COMPLETED') {
      // Check if this is a diagnostic exam that can be retaken
      if (exam.examType !== 'DIAGNOSTIC') {
        return NextResponse.json({ 
          error: 'Exam already completed',
          completedAt: assignment.completedAt 
        }, { status: 400 })
      }
      // For diagnostic exams, allow viewing completed state
    } else if (assignment.status === 'PENDING' && !assignment.startedAt) {
      // Start the exam if it was reset for retake
      assignment = await prisma.examAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      })
    }

    // Get saved answers
    const savedAnswers = await prisma.studentAnswer.findMany({
      where: {
        assignmentId: assignment.id
      }
    })

    // Format saved answers as a map
    const answersMap = savedAnswers.reduce((acc, answer) => {
      acc[answer.examQuestionId] = {
        selectedChoice: answer.submittedAnswer,
        textAnswer: answer.submittedAnswer,
        isFlagged: false
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      exam,
      assignment,
      savedAnswers: answersMap,
      timeRemaining: exam.timeLimit && assignment.startedAt ? calculateTimeRemaining(assignment.startedAt, exam.timeLimit) : null
    })
  } catch (error) {
    console.error('Error fetching exam for student:', error)
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}

function calculateTimeRemaining(startedAt: Date, timeLimitMinutes: number): number {
  const elapsed = Date.now() - startedAt.getTime()
  const totalTime = timeLimitMinutes * 60 * 1000
  const remaining = Math.max(0, totalTime - elapsed)
  return Math.floor(remaining / 1000) // Return seconds
}