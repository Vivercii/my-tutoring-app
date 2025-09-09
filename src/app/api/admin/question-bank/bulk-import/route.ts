import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuestionCode } from '@/lib/utils/questionCode'
import { classifyQuestion, updateQuestionClassification } from '@/lib/utils/question-classifier'

// POST /api/admin/question-bank/bulk-import - Bulk import questions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questions } = await request.json()
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ 
        error: 'Please provide an array of questions' 
      }, { status: 400 })
    }

    // Validate all questions first
    for (const q of questions) {
      if (!q.program || !q.subject || !q.questionText || !q.questionType) {
        return NextResponse.json({ 
          error: 'Each question must have program, subject, questionText, and questionType' 
        }, { status: 400 })
      }
    }

    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      const createdQuestions = []
      
      for (const question of questions) {
        // Generate unique question code
        const questionCode = await generateQuestionCode(question.program, question.subject)
        
        const created = await tx.questionBankItem.create({
          data: {
            questionCode,
            program: question.program,
            subject: question.subject,
            topic: question.topic,
            difficulty: question.difficulty,
            questionText: question.questionText,
            questionType: question.questionType,
            points: question.points || 1,
            explanation: question.explanation,
            passageId: question.passageId,
            ...(question.questionType === 'MULTIPLE_CHOICE' && question.options && {
              options: {
                create: question.options.map((opt: any) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect || false
                }))
              }
            })
          },
          include: {
            options: true
          }
        })
        createdQuestions.push(created)
      }
      
      return createdQuestions
    })

    // Auto-classify SAT Math questions after transaction completes
    const classificationResults = []
    for (const question of result) {
      if (question.program === 'SAT' && question.subject === 'Math') {
        try {
          // Find the correct answer for classification
          let correctAnswer = undefined
          if (question.questionType === 'MULTIPLE_CHOICE' && question.options) {
            const correctOption = question.options.find((opt: any) => opt.isCorrect)
            correctAnswer = correctOption?.text
          }

          const classification = await classifyQuestion(
            question.questionText,
            question.questionType,
            correctAnswer
          )
          
          if (classification) {
            await updateQuestionClassification(question.id, classification)
            classificationResults.push({
              questionId: question.id,
              success: true,
              domain: classification.domainName,
              skill: classification.skillName
            })
            console.log(`Classified ${question.id}: ${classification.domainName} - ${classification.skillName}`)
          }
        } catch (error) {
          console.error(`Classification failed for question ${question.id}:`, error)
          classificationResults.push({
            questionId: question.id,
            success: false,
            error: 'Classification failed'
          })
        }
        
        // Add delay between classifications to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${result.length} questions`,
      questions: result,
      classifications: classificationResults
    })
  } catch (error: any) {
    console.error('Error bulk importing questions:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to import questions' 
    }, { status: 500 })
  }
}