import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Simple pattern-based extraction without AI
function extractPassageAndQuestionSimple(combinedText: string) {
  // Extended list of question patterns
  const questionPatterns = [
    // Standard patterns
    'Which choice completes',
    'Which choice best',
    'Which finding',
    'Which quotation',
    'What is the main',
    'According to the',
    'Based on the',
    'The author',
    'What function',
    'Which of the following',
    'The passage',
    'The primary purpose',
    'The text',
    'In the',
    'How does',
    'Why does',
    'What does',
    // Math patterns
    'If ',
    'Given that',
    'Find the',
    'Calculate',
    'Solve for',
    'What is the value',
    'Determine',
    // Additional patterns
    'Select',
    'Choose',
    'Identify',
    'Explain',
    'Describe',
  ]
  
  // Check if this is likely a math question (no passage needed)
  const mathIndicators = ['equation', 'solve', 'calculate', 'graph', 'function', 'x =', 'y =', '\\frac', '\\sqrt', 'angle', 'triangle', 'circle']
  const isMath = mathIndicators.some(indicator => combinedText.toLowerCase().includes(indicator))
  
  if (isMath) {
    return {
      passage: '',
      question: combinedText,
      hasPassage: false,
      reason: 'Math question - no passage needed'
    }
  }
  
  // Try to find where the question starts
  let splitIndex = -1
  let matchedPattern = ''
  
  for (const pattern of questionPatterns) {
    // Case insensitive search
    const regex = new RegExp(pattern, 'i')
    const match = combinedText.match(regex)
    if (match && match.index && match.index > 20) { // Must have at least 20 chars before (minimal passage)
      splitIndex = match.index
      matchedPattern = pattern
      break
    }
  }
  
  if (splitIndex > 0) {
    const passageContent = combinedText.substring(0, splitIndex).trim()
    const questionText = combinedText.substring(splitIndex).trim()
    
    // Clean up passage
    const cleanedPassage = passageContent
      .replace(/______blank/g, '_____')
      .replace(/<span[^>]*>______<\/span><span[^>]*>blank<\/span>/g, '_____')
      .trim()
    
    return {
      passage: cleanedPassage,
      question: questionText,
      hasPassage: true,
      reason: `Pattern matched: "${matchedPattern}"`
    }
  }
  
  // Check if it has a blank to fill (common pattern)
  if (combinedText.includes('_____') || combinedText.includes('blank')) {
    // Assume the whole thing is a passage with implicit question
    const cleanedPassage = combinedText
      .replace(/______blank/g, '_____')
      .replace(/<span[^>]*>______<\/span><span[^>]*>blank<\/span>/g, '_____')
      .trim()
    
    return {
      passage: cleanedPassage,
      question: 'Which choice completes the text with the most logical and precise word or phrase?',
      hasPassage: true,
      reason: 'Fill-in-the-blank detected'
    }
  }
  
  // If we can't determine, return as-is
  return {
    passage: '',
    question: combinedText,
    hasPassage: false,
    reason: 'No clear pattern found'
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    console.log('Starting enhanced pattern-based question fix...')
    console.log('User:', session.user?.email)
    
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

    let totalProcessed = 0
    let totalFixed = 0
    let skipped = []
    const passageMap = new Map<string, string>()
    const fixedExamples = []

    console.log(`Found ${readingWritingSections.length} Reading/Writing sections`)

    for (const section of readingWritingSections) {
      console.log(`Processing section: ${section.title}`)
      
      for (const module of section.modules) {
        for (const examQuestion of module.questions) {
          const question = examQuestion.question
          
          // Skip if already has a passage
          if (question.passageId) {
            continue
          }
          
          // Skip if no question text or too short
          if (!question.questionText || question.questionText.length < 20) {
            continue
          }
          
          totalProcessed++
          
          // Use enhanced pattern extraction
          console.log(`  Processing question ${question.id}...`)
          const extracted = extractPassageAndQuestionSimple(question.questionText)
          
          if (extracted.hasPassage && extracted.passage && extracted.passage.length > 30) {
            try {
              const passageContent = extracted.passage
              
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
                console.log(`    Created new passage: ${passageId}`)
              }
              
              // Update the question with the passage reference and new question text
              await prisma.questionBankItem.update({
                where: { id: question.id },
                data: {
                  passageId: passageId,
                  questionText: extracted.question
                }
              })
              
              totalFixed++
              console.log(`    Fixed question ${question.id} - ${extracted.reason}`)
              
              // Store example for response
              if (fixedExamples.length < 5) {
                fixedExamples.push({
                  id: question.id,
                  originalText: question.questionText.substring(0, 100) + '...',
                  passage: passageContent.substring(0, 100) + '...',
                  question: extracted.question.substring(0, 100) + '...',
                  reason: extracted.reason
                })
              }
              
            } catch (error) {
              console.error(`    Error fixing question ${question.id}:`, error)
              skipped.push({
                id: question.id,
                reason: 'Database update failed',
                text: question.questionText.substring(0, 100) + '...'
              })
            }
          } else {
            console.log(`    Skipped - ${extracted.reason}`)
            skipped.push({
              id: question.id,
              reason: extracted.reason,
              text: question.questionText.substring(0, 100) + '...'
            })
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      totalProcessed,
      totalFixed,
      totalSkipped: skipped.length,
      passagesCreated: passageMap.size,
      fixedExamples,
      skippedSample: skipped.slice(0, 10)
    })
    
  } catch (error: any) {
    console.error('Error fixing questions:', error)
    return NextResponse.json({ 
      error: 'Failed to fix questions',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}