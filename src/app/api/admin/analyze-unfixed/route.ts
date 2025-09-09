import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all questions in Reading & Writing sections without passages
    const readingWritingSections = await prisma.examSection.findMany({
      where: {
        OR: [
          { title: { contains: 'Reading', mode: 'insensitive' } },
          { title: { contains: 'Writing', mode: 'insensitive' } },
          { title: { contains: 'English', mode: 'insensitive' } }
        ]
      },
      include: {
        modules: {
          include: {
            questions: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    let unfixedQuestions = []
    let mathQuestions = []
    let shortQuestions = []
    let noPatternMatch = []
    
    for (const section of readingWritingSections) {
      for (const module of section.modules) {
        for (const examQuestion of module.questions) {
          const question = examQuestion.question
          
          // Skip if already has a passage
          if (question.passageId) continue
          
          // Categorize unfixed questions
          if (!question.questionText) {
            unfixedQuestions.push({
              id: question.id,
              section: section.title,
              module: module.title,
              reason: 'No question text'
            })
          } else if (question.questionText.length <= 50) {
            shortQuestions.push({
              id: question.id,
              section: section.title,
              module: module.title,
              text: question.questionText,
              length: question.questionText.length,
              reason: 'Too short (<=50 chars)'
            })
          } else {
            // Check if it's actually a math question
            const mathKeywords = ['equation', 'solve', 'calculate', 'graph', 'function', 'x =', 'y =', '\\frac', '\\sqrt']
            const isMath = mathKeywords.some(keyword => question.questionText.toLowerCase().includes(keyword))
            
            if (isMath) {
              mathQuestions.push({
                id: question.id,
                section: section.title,
                module: module.title,
                text: question.questionText.substring(0, 100),
                reason: 'Appears to be math'
              })
            } else {
              // Questions that don't match our patterns
              noPatternMatch.push({
                id: question.id,
                section: section.title,
                module: module.title,
                text: question.questionText.substring(0, 200),
                reason: 'No pattern match'
              })
            }
          }
        }
      }
    }

    // Also check Math sections to see if they have passages
    const mathSections = await prisma.examSection.findMany({
      where: {
        title: { contains: 'Math', mode: 'insensitive' }
      },
      include: {
        modules: {
          include: {
            questions: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    let mathSectionCount = 0
    for (const section of mathSections) {
      for (const module of section.modules) {
        mathSectionCount += module.questions.length
      }
    }

    return NextResponse.json({
      totalUnfixed: unfixedQuestions.length + shortQuestions.length + mathQuestions.length + noPatternMatch.length,
      breakdown: {
        noText: unfixedQuestions.length,
        tooShort: shortQuestions.length,
        likelyMath: mathQuestions.length,
        noPattern: noPatternMatch.length,
        mathSectionQuestions: mathSectionCount
      },
      samples: {
        shortQuestions: shortQuestions.slice(0, 3),
        mathQuestions: mathQuestions.slice(0, 3),
        noPatternMatch: noPatternMatch.slice(0, 5)
      }
    })
    
  } catch (error: any) {
    console.error('Error analyzing unfixed questions:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze questions',
      details: error.message
    }, { status: 500 })
  }
}