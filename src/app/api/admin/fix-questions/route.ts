import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For now, just check if logged in (you can re-enable admin check later)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    console.log('Starting to fix Reading & Writing questions...')
    console.log('User:', session.user?.email)
    
    // Find all questions that belong to Reading & Writing sections
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

    let totalFixed = 0
    let totalQuestions = 0
    const passageMap = new Map<string, string>() // Map passage content to passage ID

    console.log(`Found ${readingWritingSections.length} Reading/Writing sections`)

    for (const section of readingWritingSections) {
      console.log(`Processing section: ${section.title}`)
      
      for (const module of section.modules) {
        for (const examQuestion of module.questions) {
          const question = examQuestion.question
          totalQuestions++
          
          // Skip if already has a passage
          if (question.passageId) {
            console.log(`  Question ${question.id} already has a passage, skipping`)
            continue
          }
          
          if (!question.questionText) continue
          
          // Common patterns to identify where the question instruction starts
          const questionPatterns = [
            'Which choice completes the text',
            'Which choice best states',
            'Which finding, if true',
            'Which quotation from',
            'What is the main',
            'According to the text',
            'Based on the text',
            'The author most likely',
            'What function does',
            'Which of the following',
            'The passage suggests',
            'The primary purpose'
          ]
          
          // Check if this looks like a combined passage + question
          let splitIndex = -1
          let matchedPattern = ''
          
          for (const pattern of questionPatterns) {
            const index = question.questionText.indexOf(pattern)
            if (index > 0) { // Must be after some text (the passage)
              splitIndex = index
              matchedPattern = pattern
              break
            }
          }
          
          let passageContent = ''
          let questionInstruction = ''
          
          if (splitIndex > 0) {
            // Extract passage and question
            passageContent = question.questionText.substring(0, splitIndex).trim()
            questionInstruction = question.questionText.substring(splitIndex).trim()
          } else if (question.questionText.includes('_____') || question.questionText.includes('blank')) {
            // This is likely a fill-in-the-blank question
            // Look for a question pattern after the blank
            const blankIndex = Math.max(
              question.questionText.indexOf('_____'),
              question.questionText.indexOf('blank')
            )
            
            // Try to find a question pattern after the blank
            let foundQuestion = false
            for (const pattern of questionPatterns) {
              const patternIndex = question.questionText.indexOf(pattern)
              if (patternIndex > blankIndex && patternIndex > 0) {
                passageContent = question.questionText.substring(0, patternIndex).trim()
                questionInstruction = question.questionText.substring(patternIndex).trim()
                foundQuestion = true
                break
              }
            }
            
            // If no question found after blank, assume the whole thing is passage
            if (!foundQuestion) {
              passageContent = question.questionText
              questionInstruction = 'Which choice completes the text with the most logical and precise word or phrase?'
            }
          } else {
            // Skip questions that don't match our patterns
            continue
          }
          
          // Clean up the passage content
          passageContent = passageContent
            .replace(/______blank/g, '_____')
            .replace(/<span aria-hidden="true">______<\/span><span class="sr-only">blank<\/span>/g, '_____')
            .replace(/<span aria-hidden=\\"true\\">______<\/span><span class=\\"sr-only\\">blank<\/span>/g, '_____')
          
          // Only process if we have meaningful content
          if (passageContent.length > 50 && questionInstruction.length > 10) {
            try {
              // Check if we already created a passage with this content
              let passageId = passageMap.get(passageContent)
              
              if (!passageId) {
                // Create a new passage
                const newPassage = await prisma.passage.create({
                  data: {
                    title: `Passage for ${section.title} - ${module.title || 'Module'}`,
                    content: passageContent,
                    program: question.program
                  }
                })
                passageId = newPassage.id
                passageMap.set(passageContent, passageId)
                console.log(`  Created new passage: ${passageId}`)
              }
              
              // Update the question with the passage reference and new question text
              await prisma.questionBankItem.update({
                where: { id: question.id },
                data: {
                  passageId: passageId,
                  questionText: questionInstruction
                }
              })
              
              totalFixed++
              console.log(`  Fixed question ${question.id}`)
            } catch (error) {
              console.error(`  Error fixing question ${question.id}:`, error)
            }
          }
        }
      }
    }
    
    // Get some examples to verify
    const examples = await prisma.questionBankItem.findMany({
      where: {
        passageId: { not: null },
        questionText: { contains: 'Which choice' }
      },
      include: {
        passage: true
      },
      take: 3
    })
    
    return NextResponse.json({
      success: true,
      totalQuestions,
      totalFixed,
      passagesCreated: passageMap.size,
      examples: examples.map(e => ({
        id: e.id,
        passage: e.passage?.content?.substring(0, 100) + '...',
        question: e.questionText?.substring(0, 100) + '...'
      }))
    })
    
  } catch (error: any) {
    console.error('Error fixing questions:', error)
    return NextResponse.json({ 
      error: 'Failed to fix questions',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}