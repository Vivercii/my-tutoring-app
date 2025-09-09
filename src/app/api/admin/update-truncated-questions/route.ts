import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import matchedQuestions from '../../../../../matched_questions_to_update.json'

export async function POST(request: NextRequest) {
  try {
    console.log(`Updating ${matchedQuestions.length} truncated questions...`)
    
    let updated = 0
    let errors = []
    
    for (const question of matchedQuestions) {
      try {
        // Update the question with the complete text
        await prisma.questionBankItem.update({
          where: { id: question.id },
          data: {
            questionText: question.new_html // Use the HTML version which has proper formatting
          }
        })
        updated++
        console.log(`✓ Updated question ${question.id}`)
      } catch (error: any) {
        console.error(`✗ Failed to update ${question.id}:`, error.message)
        errors.push({ id: question.id, error: error.message })
      }
    }
    
    return NextResponse.json({
      success: true,
      totalProcessed: matchedQuestions.length,
      updated,
      errors: errors.length,
      errorDetails: errors
    })
    
  } catch (error: any) {
    console.error('Error updating questions:', error)
    return NextResponse.json({ 
      error: 'Failed to update questions',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}