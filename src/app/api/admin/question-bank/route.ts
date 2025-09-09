import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuestionCode } from '@/lib/utils/questionCode'
import { classifyQuestion, updateQuestionClassification } from '@/lib/utils/question-classifier'

// GET /api/admin/question-bank - Search and filter questions from the bank
export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] API called with URL:', request.nextUrl.toString())
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const program = searchParams.get('program')
    const subject = searchParams.get('subject')
    const topic = searchParams.get('topic')
    const difficulty = searchParams.get('difficulty')
    const passageId = searchParams.get('passageId')
    const skill = searchParams.get('skill')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    
    // Build filters
    if (program) where.program = program
    if (subject) where.subject = subject
    if (topic) where.topic = topic
    if (difficulty) where.difficulty = difficulty
    if (passageId) where.passageId = passageId
    if (skill) where.skill = { name: skill }
    
    // Handle internal vs non-internal filtering and search
    const internalParam = searchParams.get('internal')
    const showInternal = internalParam === 'true'
    const showNonInternal = internalParam === 'false'
    
    // If search is provided, create search conditions
    if (search) {
      const searchFields = [
        { questionCode: { contains: search, mode: 'insensitive' } },
        { questionText: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } }
      ]
      
      if (showInternal) {
        // For internal search: combine isInternal: true with search fields
        where.AND = [
          { isInternal: true },
          { OR: searchFields }
        ]
      } else if (showNonInternal) {
        // For non-internal search: combine non-internal condition with search fields
        where.AND = [
          { NOT: { isInternal: true } },
          { OR: searchFields }
        ]
      } else {
        // No internal filter, just search all questions
        where.OR = searchFields
      }
    } else {
      // No search, just use internal filtering
      if (showInternal) {
        where.isInternal = true
      } else if (showNonInternal) {
        // For non-internal questions, use NOT to include both false and null
        where.NOT = { isInternal: true }
      }
      // If no internal parameter specified, show all questions (no filter)
    }
    
    console.log('[DEBUG] Final where clause:', JSON.stringify(where, null, 2))

    const [questions, total] = await prisma.$transaction([
      prisma.questionBankItem.findMany({
        where,
        include: {
          options: true,
          passage: true,
          domain: true,
          skill: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.questionBankItem.count({ where })
    ])

    // Parse metadata JSON strings
    const questionsWithParsedMetadata = questions.map(question => ({
      ...question,
      metadata: question.metadata ? 
        (typeof question.metadata === 'string' ? JSON.parse(question.metadata) : question.metadata) 
        : null
    }))

    console.log('[DEBUG] Returning', questions.length, 'questions, total:', total)

    return NextResponse.json({
      questions: questionsWithParsedMetadata,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('[DEBUG] Error fetching question bank:', error)
    console.error('[DEBUG] Error details:', error?.message)
    return NextResponse.json({ error: error?.message || 'Failed to fetch questions' }, { status: 500 })
  }
}

// POST /api/admin/question-bank - Create a new question in the bank
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!program || !subject || !questionText || !questionType) {
      return NextResponse.json({ 
        error: 'Program, subject, question text, and type are required' 
      }, { status: 400 })
    }

    // Generate unique question code
    const questionCode = await generateQuestionCode(program, subject)
    
    const question = await prisma.questionBankItem.create({
      data: {
        questionCode,
        program,
        subject,
        topic,
        difficulty,
        questionText,
        questionType,
        points: points || 1,
        explanation,
        passageId,
        ...(questionType === 'MULTIPLE_CHOICE' && options && options.length > 0 && {
          options: {
            create: options.map((option: { text: string; isCorrect: boolean }) => ({
              text: option.text,
              isCorrect: option.isCorrect || false
            }))
          }
        })
      },
      include: {
        options: true,
        passage: true
      }
    })

    // Auto-classify the question if it's for SAT
    if (program === 'SAT' && subject === 'Math') {
      try {
        // Find the correct answer for classification
        let correctAnswer = undefined
        if (questionType === 'MULTIPLE_CHOICE' && options) {
          const correctOption = options.find((opt: any) => opt.isCorrect)
          correctAnswer = correctOption?.text
        }

        const classification = await classifyQuestion(
          questionText,
          questionType,
          correctAnswer
        )
        
        if (classification) {
          await updateQuestionClassification(question.id, classification)
          console.log(`Successfully classified question ${question.id}: ${classification.domainName} - ${classification.skillName}`)
        }
      } catch (classificationError) {
        console.error('Classification failed for question:', question.id, classificationError)
        // Don't fail the whole request if classification fails
      }
    }

    // Fetch the updated question with classification
    const updatedQuestion = await prisma.questionBankItem.findUnique({
      where: { id: question.id },
      include: {
        options: true,
        passage: true,
        domain: true,
        skill: true
      }
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}