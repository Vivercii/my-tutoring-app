import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const {
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      program,
      subject,
      difficulty,
      domainCode,
      skillName,
      meanImportance,
      topic
    } = await req.json()
    
    // First, find or create the domain
    let domain = await prisma.domain.findUnique({
      where: { code: domainCode }
    })
    
    if (!domain) {
      // Create domain if it doesn't exist
      domain = await prisma.domain.create({
        data: {
          code: domainCode,
          name: domainCode === 'ALG' ? 'Algebra' :
                domainCode === 'ADV' ? 'Advanced Math' :
                domainCode === 'PSA' ? 'Problem Solving & Data Analysis' :
                domainCode === 'GEO' ? 'Geometry & Trigonometry' : domainCode,
          description: `${domainCode} domain questions`
        }
      })
    }
    
    // Find or create the skill
    let skill = await prisma.skill.findFirst({
      where: {
        name: skillName,
        domainId: domain.id
      }
    })
    
    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: skillName,
          domainId: domain.id,
          meanImportance: meanImportance || 2.5,
          description: `${skillName} skill`
        }
      })
    } else if (meanImportance && skill.meanImportance !== meanImportance) {
      // Update mean importance if it's different
      skill = await prisma.skill.update({
        where: { id: skill.id },
        data: { meanImportance }
      })
    }
    
    // Create the question
    const question = await prisma.questionBankItem.create({
      data: {
        questionText,
        questionType,
        correctAnswer,
        explanation: explanation || '',
        program,
        subject,
        topic: topic || skillName,
        difficulty,
        domainId: domain.id,
        skillId: skill.id,
        isActive: true,
        points: 1,
        metadata: {
          classified: true,
          classificationConfidence: 0.9,
          addedViaProcessing: true,
          processedAt: new Date().toISOString()
        }
      }
    })
    
    // Create answer options if it's a multiple choice question
    if (questionType === 'MULTIPLE_CHOICE' && options && options.length > 0) {
      await prisma.answerOption.createMany({
        data: options.map((opt: any, index: number) => ({
          questionBankItemId: question.id,
          text: opt.text,
          isCorrect: opt.isCorrect || false,
          position: index
        }))
      })
    }
    
    // Update skill question count for the heatmap
    await prisma.skill.update({
      where: { id: skill.id },
      data: {
        questionCount: {
          increment: 1
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        domainCode,
        skillName,
        meanImportance
      }
    })
    
  } catch (error) {
    console.error('Error saving classified question:', error)
    return NextResponse.json(
      { error: 'Failed to save question' },
      { status: 500 }
    )
  }
}

// Batch save endpoint
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { questions } = await req.json()
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Invalid questions array' },
        { status: 400 }
      )
    }
    
    const results = []
    let successCount = 0
    let failCount = 0
    
    for (const questionData of questions) {
      try {
        // Use the same logic as single save
        const response = await POST(new Request(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify(questionData)
        }))
        
        if (response.ok) {
          successCount++
          const data = await response.json()
          results.push({
            ...data,
            originalIndex: questionData.originalIndex
          })
        } else {
          failCount++
          results.push({
            success: false,
            error: 'Failed to save',
            originalIndex: questionData.originalIndex
          })
        }
      } catch (error) {
        failCount++
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalIndex: questionData.originalIndex
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        total: questions.length,
        saved: successCount,
        failed: failCount
      },
      results
    })
    
  } catch (error) {
    console.error('Error in batch save:', error)
    return NextResponse.json(
      { error: 'Failed to save questions' },
      { status: 500 }
    )
  }
}