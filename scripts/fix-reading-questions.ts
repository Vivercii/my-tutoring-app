import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixReadingWritingQuestions() {
  try {
    console.log('Starting to fix Reading & Writing questions...')
    
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

    for (const section of readingWritingSections) {
      console.log(`\nProcessing section: ${section.title}`)
      
      for (const module of section.modules) {
        console.log(`  Module: ${module.title || 'Unnamed'}`)
        
        for (const examQuestion of module.questions) {
          const question = examQuestion.question
          totalQuestions++
          
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
            'Which of the following'
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
          
          if (splitIndex > 0) {
            // Extract passage and question
            const passage = question.questionText.substring(0, splitIndex).trim()
            const questionInstruction = question.questionText.substring(splitIndex).trim()
            
            // Only update if we actually found a meaningful split
            if (passage.length > 50 && questionInstruction.length > 10) {
              console.log(`    Fixing question ${question.questionCode || question.id}`)
              console.log(`      Passage length: ${passage.length} chars`)
              console.log(`      Question: "${questionInstruction.substring(0, 50)}..."`)
              
              // Update the question
              await prisma.question.update({
                where: { id: question.id },
                data: {
                  passage: passage,
                  questionText: questionInstruction
                }
              })
              
              totalFixed++
            }
          } else if (question.questionText.includes('_____')) {
            // This is likely a fill-in-the-blank question where the entire text is the passage
            // Look for a sentence break or paragraph break before the blank
            const blankIndex = question.questionText.indexOf('_____')
            
            // Try to find where the actual question instruction might be
            // Usually it's after the passage with the blank
            const afterBlank = question.questionText.substring(blankIndex + 5).trim()
            
            // If there's text after the blank that looks like a question
            if (afterBlank.length > 0) {
              for (const pattern of questionPatterns) {
                if (afterBlank.includes(pattern)) {
                  const questionStart = question.questionText.indexOf(pattern)
                  const passage = question.questionText.substring(0, questionStart).trim()
                  const questionInstruction = question.questionText.substring(questionStart).trim()
                  
                  console.log(`    Fixing fill-in-blank question ${question.questionCode || question.id}`)
                  console.log(`      Passage with blank: ${passage.substring(0, 100)}...`)
                  console.log(`      Question: "${questionInstruction.substring(0, 50)}..."`)
                  
                  await prisma.question.update({
                    where: { id: question.id },
                    data: {
                      passage: passage,
                      questionText: questionInstruction
                    }
                  })
                  
                  totalFixed++
                  break
                }
              }
            } else {
              // The blank is at the end, assume default question
              console.log(`    Fixing fill-in-blank question ${question.questionCode || question.id} with default question`)
              
              await prisma.question.update({
                where: { id: question.id },
                data: {
                  passage: question.questionText,
                  questionText: 'Which choice completes the text with the most logical and precise word or phrase?'
                }
              })
              
              totalFixed++
            }
          }
        }
      }
    }
    
    console.log('\n=================================')
    console.log(`Total questions processed: ${totalQuestions}`)
    console.log(`Total questions fixed: ${totalFixed}`)
    console.log('=================================\n')
    
    // Show a few examples of fixed questions
    console.log('Sample of fixed questions:')
    const samples = await prisma.question.findMany({
      where: {
        passage: { not: null },
        questionText: { contains: 'Which choice' }
      },
      take: 3
    })
    
    for (const sample of samples) {
      console.log(`\nQuestion ${sample.questionCode || sample.id}:`)
      console.log(`  Passage: "${sample.passage?.substring(0, 100)}..."`)
      console.log(`  Question: "${sample.questionText?.substring(0, 100)}..."`)
    }
    
  } catch (error) {
    console.error('Error fixing questions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixReadingWritingQuestions()