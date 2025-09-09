import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import allQuestions from '../../../../../all_88_final.json'

// Enhanced pattern-based extraction (same as v2)
function extractPassageAndQuestion(combinedText: string) {
  const questionPatterns = [
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
    'If ',
    'Given that',
    'Find the',
    'Calculate',
    'Solve for',
    'What is the value',
    'Determine',
    'Select',
    'Choose',
    'Identify',
    'Explain',
    'Describe',
  ]
  
  // Check if this is likely a math question
  const mathIndicators = ['equation', 'solve', 'calculate', 'graph', 'function', 'x =', 'y =', '\\frac', '\\sqrt', 'angle', 'triangle', 'circle']
  const isMath = mathIndicators.some(indicator => combinedText.toLowerCase().includes(indicator))
  
  if (isMath) {
    return {
      passage: '',
      question: combinedText,
      hasPassage: false
    }
  }
  
  // Try to find where the question starts
  let splitIndex = -1
  let matchedPattern = ''
  
  for (const pattern of questionPatterns) {
    const regex = new RegExp(pattern, 'i')
    const match = combinedText.match(regex)
    if (match && match.index && match.index > 20) {
      splitIndex = match.index
      matchedPattern = pattern
      break
    }
  }
  
  if (splitIndex > 0) {
    const passageContent = combinedText.substring(0, splitIndex).trim()
    const questionText = combinedText.substring(splitIndex).trim()
    
    const cleanedPassage = passageContent
      .replace(/______blank/g, '_____')
      .replace(/<span[^>]*>______<\/span><span[^>]*>blank<\/span>/g, '_____')
      .trim()
    
    return {
      passage: cleanedPassage,
      question: questionText,
      hasPassage: true
    }
  }
  
  // Check if it has a blank to fill
  if (combinedText.includes('_____') || combinedText.includes('blank')) {
    const cleanedPassage = combinedText
      .replace(/______blank/g, '_____')
      .replace(/<span[^>]*>______<\/span><span[^>]*>blank<\/span>/g, '_____')
      .trim()
    
    return {
      passage: cleanedPassage,
      question: 'Which choice completes the text with the most logical and precise word or phrase?',
      hasPassage: true
    }
  }
  
  return {
    passage: '',
    question: combinedText,
    hasPassage: false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log(`Processing ${allQuestions.length} questions...`)
    
    let updated = 0
    let passagesCreated = 0
    let errors = []
    const passageMap = new Map<string, string>()
    
    for (const q of allQuestions) {
      try {
        // First update the question with complete text
        await prisma.questionBankItem.update({
          where: { id: q.id },
          data: {
            questionText: q.new_html
          }
        })
        
        // Now extract passage and question
        const extracted = extractPassageAndQuestion(q.new_html)
        
        if (extracted.hasPassage && extracted.passage && extracted.passage.length > 30) {
          // Check if we already created this passage
          let passageId = passageMap.get(extracted.passage)
          
          if (!passageId) {
            // Create new passage
            const newPassage = await prisma.passage.create({
              data: {
                title: `Passage for Reading & Writing`,
                content: extracted.passage,
                program: 'SAT'
              }
            })
            passageId = newPassage.id
            passageMap.set(extracted.passage, passageId)
            passagesCreated++
          }
          
          // Update question with passage reference and extracted question text
          await prisma.questionBankItem.update({
            where: { id: q.id },
            data: {
              passageId: passageId,
              questionText: extracted.question
            }
          })
        }
        
        updated++
        console.log(`✓ Updated ${q.id}`)
      } catch (error: any) {
        console.error(`✗ Failed ${q.id}:`, error.message)
        errors.push({ id: q.id, error: error.message })
      }
    }
    
    return NextResponse.json({
      success: true,
      totalProcessed: allQuestions.length,
      updated,
      passagesCreated,
      errors: errors.length,
      errorDetails: errors
    })
    
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process questions',
      details: error.message
    }, { status: 500 })
  }
}