import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/questions/[questionId] - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params
    const data = await request.json()
    const { text, type, points, options } = data

    // First, update the question
    const updatedQuestion = await prisma.questionBankItem.update({
      where: { id: questionId },
      data: {
        ...(text !== undefined && { questionText: text }),
        ...(type !== undefined && { questionType: type }),
        ...(points !== undefined && { points })
      }
    })

    // If options are provided and it's a multiple choice question, update them
    if (type === 'MULTIPLE_CHOICE' && options !== undefined) {
      // Delete existing options
      await prisma.answerOption.deleteMany({
        where: { questionId }
      })

      // Create new options
      if (options.length > 0) {
        await prisma.answerOption.createMany({
          data: options.map((option: { text: string; isCorrect: boolean }) => ({
            questionId,
            text: option.text,
            isCorrect: option.isCorrect || false
          }))
        })
      }
    }

    // Fetch the updated question with options
    const question = await prisma.questionBankItem.findUnique({
      where: { id: questionId },
      include: {
        options: true
      }
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

// DELETE /api/admin/questions/[questionId] - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params

    await prisma.questionBankItem.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}