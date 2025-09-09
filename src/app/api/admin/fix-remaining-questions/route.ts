import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

async function extractPassageAndQuestion(combinedText: string) {
  const prompt = `
You are an expert at analyzing SAT Reading & Writing questions. 
Given the following combined text, please separate it into:
1. The passage or context (if any)
2. The actual question or instruction

Text to analyze:
${combinedText}

Please respond in JSON format:
{
  "passage": "the passage text or empty string if no passage",
  "question": "the question or instruction text",
  "hasPassage": true/false
}

Rules:
- If the text contains a fill-in-the-blank passage (with _____ or blank), the entire passage including the blank is the "passage"
- The question is typically the instruction like "Which choice completes..." or "What is the main idea..."
- If there's no clear passage (just a standalone question), set hasPassage to false
- Clean up any HTML artifacts but preserve the blank markers
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (error) {
    console.error('AI extraction error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    console.log('Starting AI-powered question fix...')
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
    let errors = []
    const passageMap = new Map<string, string>()

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
          
          // Use AI to extract passage and question
          console.log(`  Processing question ${question.id} with AI...`)
          const extracted = await extractPassageAndQuestion(question.questionText)
          
          if (!extracted) {
            errors.push({
              id: question.id,
              reason: 'AI extraction failed'
            })
            continue
          }
          
          if (extracted.hasPassage && extracted.passage && extracted.passage.length > 30) {
            try {
              // Clean up the passage content
              const passageContent = extracted.passage
                .replace(/______blank/g, '_____')
                .replace(/<span aria-hidden=\"true\">______<\/span><span class=\"sr-only\">blank<\/span>/g, '_____')
                .trim()
              
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
              console.log(`    Fixed question ${question.id}`)
              
              // Add a small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100))
              
            } catch (error) {
              console.error(`    Error fixing question ${question.id}:`, error)
              errors.push({
                id: question.id,
                reason: 'Database update failed'
              })
            }
          } else {
            console.log(`    Skipped - no passage detected or too short`)
          }
        }
      }
    }
    
    // Get some examples to verify
    const examples = await prisma.questionBankItem.findMany({
      where: {
        passageId: { not: null },
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      include: {
        passage: true
      },
      take: 3
    })
    
    return NextResponse.json({
      success: true,
      totalProcessed,
      totalFixed,
      passagesCreated: passageMap.size,
      errors: errors.slice(0, 10), // First 10 errors
      examples: examples.map(e => ({
        id: e.id,
        passage: e.passage?.content?.substring(0, 100) + '...',
        question: e.questionText?.substring(0, 100) + '...'
      }))
    })
    
  } catch (error: any) {
    console.error('Error fixing questions with AI:', error)
    return NextResponse.json({ 
      error: 'Failed to fix questions',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}