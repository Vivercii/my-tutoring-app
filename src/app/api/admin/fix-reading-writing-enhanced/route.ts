import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Enhanced extraction based on your HTML script's logic
function extractPassageAndQuestion(fullText: string) {
  if (!fullText) return { passage: '', question: '' }
  
  // Comprehensive list of question patterns from your HTML script
  const patterns = [
    "Which choice completes",
    "Which choice best describes",
    "Which choice best",
    "Which choice most",
    "Which finding",
    "Which quotation",
    "Which statement",
    "What is the",
    "What does",
    "What can",
    "What function",
    "According to",
    "Based on",
    "The passage",
    "The author",
    "The student",
    "The main",
    "How does",
    "Why does",
    "In the context",
    "The text",
    "It can most reasonably"
  ]
  
  let splitPoint = -1
  let matchedPattern = ''
  
  // Use lastIndexOf to find the last occurrence (same as HTML script)
  for (const pattern of patterns) {
    const index = fullText.lastIndexOf(pattern)
    if (index > splitPoint) {
      splitPoint = index
      matchedPattern = pattern
    }
  }
  
  // Split if we found a pattern
  if (splitPoint > 0) {
    return {
      passage: fullText.substring(0, splitPoint).trim(),
      question: fullText.substring(splitPoint).trim()
    }
  }
  
  // If no split point found, return the full text as question
  return { passage: '', question: fullText }
}

// Clean up HTML artifacts and format text
function cleanText(text: string): string {
  return text
    // Remove HTML tags but preserve content
    .replace(/<[^>]*>/g, '')
    // Clean up blank indicators
    .replace(/______blank/g, '_____')
    .replace(/blank/g, '_____')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    console.log('Starting enhanced Reading & Writing question fix...')
    console.log('User:', session.user?.email)
    
    // First, let's DELETE all existing passages for Reading & Writing questions
    // to start fresh with the new extraction logic
    const existingPassages = await prisma.passage.findMany({
      where: {
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } },
        ]
      }
    })
    
    console.log(`Found ${existingPassages.length} existing passages to delete`)
    
    // Delete existing passages
    for (const passage of existingPassages) {
      await prisma.passage.delete({
        where: { id: passage.id }
      })
    }
    
    console.log('Deleted all existing Reading & Writing passages')
    
    // Now find all questions in Reading & Writing sections
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
    let totalSkipped = 0
    const passageMap = new Map<string, string>()
    const results = []

    console.log(`Found ${readingWritingSections.length} Reading/Writing sections`)

    for (const section of readingWritingSections) {
      console.log(`\nProcessing section: ${section.title}`)
      
      for (const module of section.modules) {
        console.log(`  Module: ${module.title || 'Unnamed'}`)
        
        for (const examQuestion of module.questions) {
          const question = examQuestion.question
          totalProcessed++
          
          // Skip if no question text
          if (!question.questionText || question.questionText.length < 10) {
            console.log(`    Skipped ${question.id}: No valid question text`)
            totalSkipped++
            continue
          }
          
          // Extract passage and question using the enhanced logic
          const { passage, question: extractedQuestion } = extractPassageAndQuestion(question.questionText)
          
          // Only create passage if we extracted meaningful content
          if (passage && passage.length > 30) {
            try {
              // Check if we already created this passage
              let passageId = passageMap.get(passage)
              
              if (!passageId) {
                // Create new passage
                const newPassage = await prisma.passage.create({
                  data: {
                    title: `${section.title} - ${module.title || 'Module'}`,
                    content: passage,
                    program: question.program || 'SAT'
                  }
                })
                passageId = newPassage.id
                passageMap.set(passage, passageId)
                console.log(`    Created passage ${passageId}`)
              }
              
              // Update the question
              await prisma.questionBankItem.update({
                where: { id: question.id },
                data: {
                  passageId: passageId,
                  questionText: extractedQuestion || question.questionText
                }
              })
              
              totalFixed++
              console.log(`    ✓ Fixed question ${question.id}`)
              
              // Store example for response
              if (results.length < 5) {
                results.push({
                  questionId: question.id,
                  originalLength: question.questionText.length,
                  passageLength: passage.length,
                  questionLength: extractedQuestion.length,
                  passagePreview: passage.substring(0, 100) + '...',
                  questionPreview: extractedQuestion.substring(0, 100) + '...'
                })
              }
            } catch (error) {
              console.error(`    ✗ Error fixing question ${question.id}:`, error)
              totalSkipped++
            }
          } else {
            // No passage extracted, just clean up the question text
            try {
              const cleanedText = cleanText(question.questionText)
              
              await prisma.questionBankItem.update({
                where: { id: question.id },
                data: {
                  questionText: cleanedText,
                  passageId: null
                }
              })
              
              console.log(`    ✓ Cleaned question ${question.id} (no passage)`)
              totalFixed++
            } catch (error) {
              console.error(`    ✗ Error cleaning question ${question.id}:`, error)
              totalSkipped++
            }
          }
        }
      }
    }
    
    // Get summary statistics
    const finalStats = await prisma.passage.count({
      where: {
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } },
        ]
      }
    })
    
    const questionsWithPassages = await prisma.questionBankItem.count({
      where: {
        passageId: { not: null }
      }
    })
    
    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed,
        totalFixed,
        totalSkipped,
        passagesCreated: passageMap.size,
        totalPassagesInDB: finalStats,
        questionsWithPassages
      },
      examples: results,
      message: 'Successfully processed Reading & Writing questions with enhanced extraction'
    })
    
  } catch (error: any) {
    console.error('Error processing questions:', error)
    return NextResponse.json({ 
      error: 'Failed to process questions',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check current status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get statistics
    const totalPassages = await prisma.passage.count()
    const readingWritingPassages = await prisma.passage.count({
      where: {
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } },
        ]
      }
    })
    
    const questionsWithPassages = await prisma.questionBankItem.count({
      where: {
        passageId: { not: null }
      }
    })
    
    const totalQuestions = await prisma.questionBankItem.count()
    
    // Get sample questions with passages
    const samples = await prisma.questionBankItem.findMany({
      where: {
        passageId: { not: null }
      },
      include: {
        passage: true
      },
      take: 3
    })
    
    return NextResponse.json({
      statistics: {
        totalPassages,
        readingWritingPassages,
        questionsWithPassages,
        totalQuestions,
        percentageWithPassages: ((questionsWithPassages / totalQuestions) * 100).toFixed(2) + '%'
      },
      samples: samples.map(s => ({
        questionId: s.id,
        questionPreview: s.questionText?.substring(0, 100) + '...',
        passagePreview: s.passage?.content?.substring(0, 100) + '...',
        passageTitle: s.passage?.title
      }))
    })
  } catch (error: any) {
    console.error('Error getting status:', error)
    return NextResponse.json({ 
      error: 'Failed to get status',
      details: error.message
    }, { status: 500 })
  }
}