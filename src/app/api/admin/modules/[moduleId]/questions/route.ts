import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST /api/admin/modules/[moduleId]/questions - Link questions from bank to module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { moduleId } = await params
    const data = await request.json()
    const { questionIds } = data // Array of question IDs from the bank

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Question IDs are required' }, { status: 400 })
    }

    // Get the highest order number for existing questions in the module
    const lastQuestion = await prisma.examQuestion.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' }
    })

    let currentOrder = lastQuestion ? lastQuestion.order + 1 : 1

    // Create exam questions linking bank items to the module
    const examQuestions = await prisma.$transaction(
      questionIds.map((questionId: string) => {
        const order = currentOrder++
        return prisma.examQuestion.create({
          data: {
            moduleId,
            questionId,
            order
          },
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        })
      })
    )

    return NextResponse.json(examQuestions)
  } catch (error) {
    console.error('Error linking questions:', error)
    return NextResponse.json({ error: 'Failed to link questions' }, { status: 500 })
  }
}

// DELETE /api/admin/modules/[moduleId]/questions/[examQuestionId] - Remove a question from module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { moduleId } = await params
    const searchParams = request.nextUrl.searchParams
    const examQuestionId = searchParams.get('examQuestionId')

    if (!examQuestionId) {
      return NextResponse.json({ error: 'Exam question ID is required' }, { status: 400 })
    }

    await prisma.examQuestion.delete({
      where: { 
        id: examQuestionId,
        moduleId // Ensure the question belongs to this module
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing question:', error)
    return NextResponse.json({ error: 'Failed to remove question' }, { status: 500 })
  }
}

// PUT /api/admin/modules/[moduleId]/questions/reorder - Reorder questions in module
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { moduleId } = await params
    const data = await request.json()
    const { questionOrders } = data // Array of { id, order } objects

    if (!questionOrders || !Array.isArray(questionOrders)) {
      return NextResponse.json({ error: 'Question orders are required' }, { status: 400 })
    }

    // Update all question orders in a transaction
    await prisma.$transaction(
      questionOrders.map(({ id, order }: { id: string; order: number }) =>
        prisma.examQuestion.update({
          where: { id, moduleId },
          data: { order }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering questions:', error)
    return NextResponse.json({ error: 'Failed to reorder questions' }, { status: 500 })
  }
}