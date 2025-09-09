import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { classifyQuestionsBatch } from '@/lib/utils/question-classifier'

const BATCH_SIZE = 10 // Process 10 questions at a time

export async function POST(req: Request) {
  console.log('[BATCH-CLASSIFY] Endpoint called')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      console.log('[BATCH-CLASSIFY] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[BATCH-CLASSIFY] Admin authenticated:', session.user.email)
    
    const body = await req.json()
    const { questions } = body
    
    console.log('[BATCH-CLASSIFY] Request body keys:', Object.keys(body))
    console.log('[BATCH-CLASSIFY] Questions type:', typeof questions)
    console.log('[BATCH-CLASSIFY] Is array?:', Array.isArray(questions))
    
    if (!questions || !Array.isArray(questions)) {
      console.error('[BATCH-CLASSIFY] Invalid input - questions is not an array')
      return NextResponse.json(
        { error: 'Invalid questions array' },
        { status: 400 }
      )
    }

    console.log(`[BATCH-CLASSIFY] Starting classification for ${questions.length} questions`)
    console.log(`[BATCH-CLASSIFY] Processing in batches of ${BATCH_SIZE}`)
    console.log('[BATCH-CLASSIFY] First question sample:', questions[0] ? {
      questionText: questions[0].questionText?.substring(0, 100) + '...',
      questionType: questions[0].questionType,
      hasOptions: !!questions[0].options,
      optionsCount: questions[0].options?.length
    } : 'No questions')
    
    const results = []
    let successCount = 0
    let failCount = 0
    
    // Process questions in batches
    for (let batchStart = 0; batchStart < questions.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, questions.length)
      const batch = questions.slice(batchStart, batchEnd)
      
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(questions.length / BATCH_SIZE)
      
      console.log(`[BATCH-CLASSIFY] Processing batch ${batchNum}/${totalBatches} (questions ${batchStart + 1}-${batchEnd})`)
      
      try {
        // Step 1: Classify the entire batch with AI
        console.log(`[BATCH-CLASSIFY] Calling AI classification for batch ${batchNum}...`)
        
        const classificationsInput = batch.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          correctAnswer: q.correctAnswer || q.options?.find((o: any) => o.isCorrect)?.letter
        }))
        
        console.log(`[BATCH-CLASSIFY] Batch ${batchNum} input prepared, calling classifyQuestionsBatch...`)
        
        const classifications = await classifyQuestionsBatch(classificationsInput)
        
        console.log(`[BATCH-CLASSIFY] Batch ${batchNum} AI classification complete. Results:`, {
          totalClassified: classifications.length,
          successful: classifications.filter(c => c !== null).length,
          failed: classifications.filter(c => c === null).length
        })
        
        // Step 2: Process each classified question
        for (let i = 0; i < batch.length; i++) {
          const question = batch[i]
          const classification = classifications[i]
          const globalIndex = batchStart + i
          
          if (!classification) {
            console.log(`[BATCH-CLASSIFY] Question ${globalIndex + 1} failed classification`)
            failCount++
            results.push({
              index: globalIndex,
              success: false,
              error: 'Failed to classify'
            })
            continue
          }
          
          console.log(`[BATCH-CLASSIFY] Question ${globalIndex + 1} classified as:`, {
            domain: classification.domainCode,
            skill: classification.skillName
          })

          try {
            // Find or create domain
            let domain = await prisma.domain.findUnique({
              where: { code: classification.domainCode }
            })
            
            if (!domain) {
              domain = await prisma.domain.create({
                data: {
                  code: classification.domainCode,
                  name: classification.domainName,
                  description: `${classification.domainName} domain`
                }
              })
            }
            
            // Find or create skill
            let skill = await prisma.skill.findFirst({
              where: {
                name: classification.skillName,
                domainId: domain.id
              }
            })
            
            if (!skill) {
              skill = await prisma.skill.create({
                data: {
                  name: classification.skillName,
                  domainId: domain.id,
                  meanImportance: classification.meanImportance || 2.5,
                  description: `${classification.skillName} skill`
                }
              })
            }
            
            // Generate unique question code
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase()
            const questionCode = `SAT-MATH-${domain.code}-${timestamp}-${randomSuffix}`
            
            // Create the question - MARKED AS INTERNAL/DRAFT
            // Note: correctAnswer is stored in options for MC or as special AnswerOption for SA
            const savedQuestion = await prisma.questionBankItem.create({
              data: {
                questionCode,
                questionText: question.questionText,
                questionType: question.questionType,
                explanation: question.explanation || '',
                program: question.program || 'SAT',
                subject: question.subject || 'Math',
                topic: classification.skillName,
                difficulty: question.difficulty || 'MEDIUM',
                domainId: domain.id,
                skillId: skill.id,
                isActive: false,  // NOT ACTIVE - Internal use only
                isInternal: true, // MARKED AS INTERNAL
                points: 1,
                metadata: JSON.stringify({
                  classified: true,
                  classificationConfidence: classification.confidence || 0.9,
                  addedViaBatchImport: true,
                  importedAt: new Date().toISOString(),
                  status: 'INTERNAL_DRAFT',
                  tags: ['internal', 'draft', 'not-for-students', 'needs-review'],
                  source: 'bulk-import',
                  needsReview: true,
                  canShowToStudents: false,
                  originalCorrectAnswer: question.correctAnswer // Store in metadata for reference
                })
              }
            })
            
            // Create answer options or store correct answer
            if (question.questionType === 'MULTIPLE_CHOICE' && question.options && question.options.length > 0) {
              const correctLetter = question.correctAnswer
              await prisma.answerOption.createMany({
                data: question.options.map((opt: any, index: number) => ({
                  questionId: savedQuestion.id,
                  text: typeof opt === 'string' ? opt : (opt.text || ''),
                  isCorrect: correctLetter ? String.fromCharCode(65 + index) === correctLetter : (opt.isCorrect || false)
                }))
              })
            } else if (question.questionType === 'SHORT_ANSWER' && question.correctAnswer) {
              await prisma.answerOption.create({
                data: {
                  questionId: savedQuestion.id,
                  text: question.correctAnswer,
                  isCorrect: true
                }
              })
            }
            
            // Note: Skill question count will be updated later if needed
            
            successCount++
            results.push({
              index: globalIndex,
              success: true,
              questionId: savedQuestion.id,
              classification: {
                domain: classification.domainCode,
                skill: classification.skillName,
                importance: skill.meanImportance
              }
            })
            
          } catch (error) {
            console.error(`[BATCH-CLASSIFY] Error saving question ${globalIndex + 1}:`, error)
            console.error(`[BATCH-CLASSIFY] Question data that failed:`, {
              questionText: question.questionText?.substring(0, 100),
              questionType: question.questionType,
              correctAnswer: question.correctAnswer,
              hasOptions: !!question.options
            })
            failCount++
            results.push({
              index: globalIndex,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        
      } catch (batchError) {
        console.error(`Error processing batch:`, batchError)
        // Mark all questions in this batch as failed
        for (let i = 0; i < batch.length; i++) {
          failCount++
          results.push({
            index: batchStart + i,
            success: false,
            error: 'Batch classification failed'
          })
        }
      }
      
      // Small delay between batches to avoid rate limiting
      if (batchEnd < questions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`Batch processing complete: ${successCount} succeeded, ${failCount} failed`)
    
    return NextResponse.json({
      success: true,
      summary: {
        total: questions.length,
        succeeded: successCount,
        failed: failCount
      },
      results
    })
    
  } catch (error) {
    console.error('[BATCH-CLASSIFY] Fatal error:', error)
    console.error('[BATCH-CLASSIFY] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Failed to process questions',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}