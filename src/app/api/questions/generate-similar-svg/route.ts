import { NextResponse } from 'next/server'
import { detectVisualContent, extractVisualContent } from '@/lib/utils/svg-handler'
import { generateSVGVariation, generateAnswerChoices } from '@/lib/utils/svg-question-generator'

export async function POST(req: Request) {
  try {
    const { question } = await req.json()
    
    if (!question) {
      return NextResponse.json(
        { error: 'No question provided' },
        { status: 400 }
      )
    }

    // Check if question has SVG content
    const hasVisual = detectVisualContent(question.questionText)
    
    if (!hasVisual) {
      // If no SVG, fall back to text generation (could call the other API)
      return NextResponse.json(
        { error: 'This endpoint is for SVG questions only' },
        { status: 400 }
      )
    }
    
    const visualContent = extractVisualContent(question.questionText)
    
    if (!visualContent || visualContent.type !== 'svg') {
      return NextResponse.json(
        { error: 'No SVG content found in question' },
        { status: 400 }
      )
    }
    
    // Generate SVG variation
    const { newSVG, replacements } = generateSVGVariation(visualContent.originalCode)
    
    // Update question text with new SVG
    let newQuestionText = question.questionText.replace(
      visualContent.originalCode,
      newSVG
    )
    
    // Update any references to old values in the question text
    Object.entries(replacements).forEach(([oldVal, newVal]) => {
      // Replace in question text (but not in the SVG we already replaced)
      const questionPart = newQuestionText.substring(newQuestionText.indexOf('</svg>'))
      const updatedPart = questionPart.replace(
        new RegExp(`\\b${oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
        newVal
      )
      newQuestionText = newQuestionText.substring(0, newQuestionText.indexOf('</svg>')) + updatedPart
    })
    
    // Generate new answer choices if it's multiple choice
    let newOptions = question.options
    if (question.questionType === 'MULTIPLE_CHOICE' && question.correctAnswer) {
      // Determine what we're solving for
      const correctOriginal = question.correctAnswer
      const correctOption = question.options?.find((o: any) => o.letter === correctOriginal)
      
      if (correctOption) {
        // Apply replacements to get new correct answer
        let newCorrectValue = correctOption.text
        Object.entries(replacements).forEach(([oldVal, newVal]) => {
          if (correctOption.text === oldVal) {
            newCorrectValue = newVal
          }
        })
        
        // Determine question type
        const questionType = newCorrectValue.includes('°') ? 'angle' : 
                           newCorrectValue.match(/\d+\s*(cm|m|ft|in)/) ? 'length' : 
                           'calculation'
        
        // Generate new choices
        const choices = generateAnswerChoices(newCorrectValue, questionType)
        const correctIndex = choices.indexOf(newCorrectValue)
        
        newOptions = [
          { letter: 'A', text: choices[0], isCorrect: correctIndex === 0 },
          { letter: 'B', text: choices[1], isCorrect: correctIndex === 1 },
          { letter: 'C', text: choices[2], isCorrect: correctIndex === 2 },
          { letter: 'D', text: choices[3], isCorrect: correctIndex === 3 },
        ]
      }
    }
    
    const generatedQuestion = {
      questionText: newQuestionText,
      questionType: question.questionType,
      options: newOptions,
      correctAnswer: newOptions?.find((o: any) => o.isCorrect)?.letter || question.correctAnswer,
      explanation: `This question tests the same concept as the original. The values have been changed to create a new variation.`
    }
    
    return NextResponse.json({ 
      success: true, 
      generatedQuestion,
      replacements // Include for debugging
    })
    
  } catch (error) {
    console.error('Error generating similar SVG question:', error)
    return NextResponse.json(
      { error: 'Failed to generate similar question' },
      { status: 500 }
    )
  }
}