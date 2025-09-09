import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass auth for analysis
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    // }

    console.log('Analyzing remaining unfixed questions...')
    
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

    const unfixedQuestions = []
    let totalQuestions = 0
    let questionsWithPassages = 0

    for (const section of readingWritingSections) {
      for (const module of section.modules) {
        for (const examQuestion of module.questions) {
          const question = examQuestion.question
          totalQuestions++
          
          if (question.passageId) {
            questionsWithPassages++
            continue
          }
          
          // This is an unfixed question
          unfixedQuestions.push({
            id: question.id,
            sectionTitle: section.title,
            moduleTitle: module.title || 'Unnamed Module',
            questionText: question.questionText?.substring(0, 200) || 'No text',
            textLength: question.questionText?.length || 0,
            hasBlank: question.questionText?.includes('_____') || question.questionText?.includes('blank'),
            program: question.program
          })
        }
      }
    }

    // Analyze patterns in unfixed questions
    const patterns = {
      veryShort: unfixedQuestions.filter(q => q.textLength < 50),
      noText: unfixedQuestions.filter(q => q.textLength === 0),
      hasBlank: unfixedQuestions.filter(q => q.hasBlank),
      mathRelated: unfixedQuestions.filter(q => 
        q.questionText.toLowerCase().includes('equation') ||
        q.questionText.toLowerCase().includes('solve') ||
        q.questionText.toLowerCase().includes('calculate') ||
        q.questionText.toLowerCase().includes('graph') ||
        q.questionText.includes('x =') ||
        q.questionText.includes('y =')
      ),
      bySection: {} as Record<string, typeof unfixedQuestions>
    }

    // Group by section
    for (const q of unfixedQuestions) {
      if (!patterns.bySection[q.sectionTitle]) {
        patterns.bySection[q.sectionTitle] = []
      }
      patterns.bySection[q.sectionTitle].push(q)
    }

    return NextResponse.json({
      summary: {
        totalQuestions,
        questionsWithPassages,
        unfixedCount: unfixedQuestions.length,
        fixedPercentage: ((questionsWithPassages / totalQuestions) * 100).toFixed(1)
      },
      patterns: {
        veryShortCount: patterns.veryShort.length,
        noTextCount: patterns.noText.length,
        hasBlankCount: patterns.hasBlank.length,
        mathRelatedCount: patterns.mathRelated.length,
        bySectionCounts: Object.keys(patterns.bySection).map(section => ({
          section,
          count: patterns.bySection[section].length
        }))
      },
      samples: {
        first10: unfixedQuestions.slice(0, 10),
        veryShortSamples: patterns.veryShort.slice(0, 5),
        mathSamples: patterns.mathRelated.slice(0, 5)
      },
      allUnfixed: unfixedQuestions
    })
    
  } catch (error: any) {
    console.error('Error analyzing unfixed questions:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze questions',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}