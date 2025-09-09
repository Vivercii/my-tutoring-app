import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { classifyQuestion, updateQuestionClassification } from '@/lib/utils/question-classifier'

// GET /api/admin/question-bank/[questionId] - Get a single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params

    const question = await prisma.questionBankItem.findUnique({
      where: { id: questionId },
      include: {
        options: true,
        passage: true,
        _count: {
          select: { examQuestions: true }
        }
      }
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error('Error fetching question:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}

// PUT /api/admin/question-bank/[questionId] - Update a question
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
    const {
      program,
      subject,
      topic,
      difficulty,
      questionText,
      questionType,
      points,
      explanation,
      passageId,
      options
    } = data

    // Update the question
    const question = await prisma.questionBankItem.update({
      where: { id: questionId },
      data: {
        ...(program !== undefined && { program }),
        ...(subject !== undefined && { subject }),
        ...(topic !== undefined && { topic }),
        ...(difficulty !== undefined && { difficulty }),
        ...(questionText !== undefined && { questionText }),
        ...(questionType !== undefined && { questionType }),
        ...(points !== undefined && { points }),
        ...(explanation !== undefined && { explanation }),
        ...(passageId !== undefined && { passageId })
      }
    })

    // If options are provided and it's a multiple choice question, update them
    if (questionType === 'MULTIPLE_CHOICE' && options !== undefined) {
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

    // Auto-classify the question if it's for SAT Math and text was updated
    if ((program === 'SAT' || question.program === 'SAT') && 
        (subject === 'Math' || question.subject === 'Math') &&
        questionText !== undefined) {
      try {
        // Find the correct answer for classification
        let correctAnswer = undefined
        if (question.questionType === 'MULTIPLE_CHOICE') {
          const updatedOptions = await prisma.answerOption.findMany({
            where: { questionId }
          })
          const correctOption = updatedOptions.find((opt: any) => opt.isCorrect)
          correctAnswer = correctOption?.text
        }

        const classification = await classifyQuestion(
          question.questionText,
          question.questionType,
          correctAnswer
        )
        
        if (classification) {
          await updateQuestionClassification(question.id, classification)
          console.log(`Re-classified question ${question.id}: ${classification.domainName} - ${classification.skillName}`)
        }
      } catch (classificationError) {
        console.error('Classification failed for question:', question.id, classificationError)
        // Don't fail the whole request if classification fails
      }
    }

    // Fetch the updated question with all relations
    const updatedQuestion = await prisma.questionBankItem.findUnique({
      where: { id: questionId },
      include: {
        options: true,
        passage: true,
        domain: true,
        skill: true,
        _count: {
          select: { examQuestions: true }
        }
      }
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

// DELETE /api/admin/question-bank/[questionId] - Delete a question
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

    // Check if question is used in any exams
    const question = await prisma.questionBankItem.findUnique({
      where: { id: questionId },
      include: {
        _count: {
          select: { examQuestions: true }
        }
      }
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (question._count.examQuestions > 0) {
      return NextResponse.json({ 
        error: `Cannot delete question that is used in ${question._count.examQuestions} exam(s)` 
      }, { status: 400 })
    }

    await prisma.questionBankItem.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}