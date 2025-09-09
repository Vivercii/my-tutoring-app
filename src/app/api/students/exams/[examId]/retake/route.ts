import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/students/exams/[examId]/retake - Reset exam for retake
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

    // Find the existing assignment
    const assignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId
        }
      },
      include: {
        exam: true,
        studentAnswers: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Allow retakes for all exams
    // Previously restricted to DIAGNOSTIC only, now allowing all exam types
    // This enables students to practice and improve their scores

    // Delete all previous answers
    if (assignment.studentAnswers.length > 0) {
      await prisma.studentAnswer.deleteMany({
        where: {
          assignmentId: assignment.id
        }
      })
    }

    // Reset the assignment
    const updatedAssignment = await prisma.examAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'PENDING',
        score: null,
        startedAt: null,
        completedAt: null
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'exam_retake',
        description: `Started retake of exam: ${assignment.exam.title}`,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment
    })
  } catch (error) {
    console.error('Error resetting exam for retake:', error)
    return NextResponse.json({ error: 'Failed to reset exam' }, { status: 500 })
  }
}