import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/students/exams/[examId]/submit - Submit completed exam
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

    // Get assignment
    const assignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId
        }
      },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                modules: {
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
                }
              }
            }
          }
        },
        studentAnswers: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Exam already submitted',
        completedAt: assignment.completedAt 
      }, { status: 400 })
    }

    // Calculate score
    let totalQuestions = 0
    let correctAnswers = 0
    let scoredQuestions = 0

    for (const section of assignment.exam.sections) {
      for (const module of section.modules) {
        for (const examQuestion of module.questions) {
          totalQuestions++
          
          const studentAnswer = assignment.studentAnswers.find(
            a => a.examQuestionId === examQuestion.id
          )
          
          if (studentAnswer) {
            // Only score multiple choice questions with options
            if (examQuestion.question.options && examQuestion.question.options.length > 0 && studentAnswer.submittedAnswer) {
              scoredQuestions++
              
              // Find the correct answer from options
              const correctOption = examQuestion.question.options.find(option => option.isCorrect)
              // Student answer could be the option letter (A, B, C, D) or option text
              // For now, let's check if the submitted answer matches the correct option's text
              const isCorrect = correctOption && studentAnswer.submittedAnswer === correctOption.text
              
              if (isCorrect) {
                correctAnswers++
                await prisma.studentAnswer.update({
                  where: { id: studentAnswer.id },
                  data: { isCorrect: true }
                })
              } else {
                await prisma.studentAnswer.update({
                  where: { id: studentAnswer.id },
                  data: { isCorrect: false }
                })
              }
            }
          }
        }
      }
    }

    // Calculate percentage (only for questions that can be auto-scored)
    const score = scoredQuestions > 0 ? (correctAnswers / scoredQuestions) * 100 : null

    // Update assignment
    const updatedAssignment = await prisma.examAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score: score ? Math.round(score * 10) / 10 : null // Round to 1 decimal
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'exam_completed',
        description: `Completed exam: ${assignment.exam.title}`,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      results: {
        totalQuestions,
        answeredQuestions: assignment.studentAnswers.length,
        scoredQuestions,
        correctAnswers,
        score: score ? Math.round(score * 10) / 10 : null
      }
    })
  } catch (error) {
    console.error('Error submitting exam:', error)
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
  }
}