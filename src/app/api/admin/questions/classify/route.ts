import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { classifyQuestion, updateQuestionClassification } from '@/lib/utils/question-classifier'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { questionId, questionText, questionType, correctAnswer } = await req.json()
    
    // Classify the question
    const classification = await classifyQuestion(questionText, questionType, correctAnswer)
    
    if (!classification) {
      return NextResponse.json(
        { error: 'Could not classify question' },
        { status: 400 }
      )
    }
    
    // If questionId provided, update the question
    if (questionId) {
      const updated = await updateQuestionClassification(questionId, classification)
      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update question' },
          { status: 500 }
        )
      }
    }
    
    // Get the mean importance for the skill
    let meanImportance = 2.5 // Default
    if (classification) {
      const skill = await prisma.skill.findFirst({
        where: {
          name: classification.skillName,
          domain: {
            code: classification.domainCode
          }
        }
      })
      if (skill && skill.meanImportance) {
        meanImportance = skill.meanImportance
      }
    }
    
    return NextResponse.json({
      success: true,
      classification: {
        ...classification,
        meanImportance
      }
    })
    
  } catch (error) {
    console.error('Error in classify endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to classify question' },
      { status: 500 }
    )
  }
}

// Batch classification endpoint
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { questionIds } = await req.json()
    
    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: 'Invalid question IDs' },
        { status: 400 }
      )
    }
    
    // Get questions
    const questions = await prisma.questionBankItem.findMany({
      where: {
        id: { in: questionIds }
      }
    })
    
    const results = []
    let successCount = 0
    let failCount = 0
    
    for (const question of questions) {
      const classification = await classifyQuestion(
        question.questionText,
        question.questionType,
        undefined // We'd need to get correct answer from options
      )
      
      if (classification) {
        const updated = await updateQuestionClassification(question.id, classification)
        if (updated) {
          successCount++
          results.push({
            questionId: question.id,
            success: true,
            classification
          })
        } else {
          failCount++
          results.push({
            questionId: question.id,
            success: false,
            error: 'Failed to update'
          })
        }
      } else {
        failCount++
        results.push({
          questionId: question.id,
          success: false,
          error: 'Could not classify'
        })
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        total: questions.length,
        success: successCount,
        failed: failCount
      },
      results
    })
    
  } catch (error) {
    console.error('Error in batch classify endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to classify questions' },
      { status: 500 }
    )
  }
}