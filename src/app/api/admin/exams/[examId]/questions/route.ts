import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST /api/admin/exams/[examId]/questions - Create a new question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = await params
    const data = await request.json()
    const { text, type, points, options } = data

    if (!text || !type) {
      return NextResponse.json({ error: 'Question text and type are required' }, { status: 400 })
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Create question with options if it's multiple choice
    const question = await prisma.question.create({
      data: {
        text,
        type,
        points: points || 1,
        examId,
        ...(type === 'MULTIPLE_CHOICE' && options && options.length > 0 && {
          options: {
            create: options.map((option: { text: string; isCorrect: boolean }) => ({
              text: option.text,
              isCorrect: option.isCorrect || false
            }))
          }
        })
      },
      include: {
        options: true
      }
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}