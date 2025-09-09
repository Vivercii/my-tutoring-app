import { PrismaClient } from '@prisma/client'
import { processQuestionContent } from '../src/lib/utils/mathml-to-latex'

const prisma = new PrismaClient()

// Sample questions data structure matching your format
interface QuestionData {
  questionText: string
  questionHtml: string
  questionType: 'mcq' | 'short_answer'
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionAHtml?: string
  optionBHtml?: string
  optionCHtml?: string
  optionDHtml?: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  explanationHtml?: string
  topic?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
}

// Your sample questions
const sampleQuestions: QuestionData[] = [
  {
    questionText: "4, 4, 4, 4, 8, 8, 8, 13, 13\n\nWhich frequency table correctly represents the data listed?",
    questionHtml: `<p style="text-align: center;">4, 4, 4, 4, 8, 8, 8, 13, 13</p>
<p style="text-align: left;">Which frequency table correctly represents the data listed?</p>`,
    questionType: 'mcq',
    optionA: `<table border="1">
<thead>
<tr>
<th>Number</th>
<th>Frequency</th>
</tr>
</thead>
<tbody>
<tr><td>4</td><td>4</td></tr>
<tr><td>8</td><td>3</td></tr>
<tr><td>13</td><td>2</td></tr>
</tbody>
</table>`,
    optionB: `<table border="1">
<thead>
<tr>
<th>Number</th>
<th>Frequency</th>
</tr>
</thead>
<tbody>
<tr><td>4</td><td>4</td></tr>
<tr><td>3</td><td>8</td></tr>
<tr><td>2</td><td>13</td></tr>
</tbody>
</table>`,
    optionC: `<table border="1">
<thead>
<tr>
<th>Number</th>
<th>Frequency</th>
</tr>
</thead>
<tbody>
<tr><td>4</td><td>16</td></tr>
<tr><td>8</td><td>24</td></tr>
<tr><td>13</td><td>26</td></tr>
</tbody>
</table>`,
    optionD: `<table border="1">
<thead>
<tr>
<th>Number</th>
<th>Frequency</th>
</tr>
</thead>
<tbody>
<tr><td>16</td><td>4</td></tr>
<tr><td>24</td><td>8</td></tr>
<tr><td>26</td><td>13</td></tr>
</tbody>
</table>`,
    correctAnswer: 'A',
    explanation: "Choice A is correct. A frequency table lists the data value and shows the number of times each value occurs. In the data listed, the number 4 occurs four times, the number 8 occurs three times, and the number 13 occurs two times.",
    topic: 'Statistics',
    difficulty: 'EASY'
  },
  {
    questionText: "Which expression is equivalent to x² + 3x - 40?",
    questionHtml: `<p>Which expression is equivalent to <math><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>3</mn><mi>x</mi><mo>-</mo><mn>40</mn></math>?</p>`,
    questionType: 'mcq',
    optionA: "(x - 4)(x + 10)",
    optionAHtml: `<p><math><mfenced><mrow><mi>x</mi><mo>-</mo><mn>4</mn></mrow></mfenced><mfenced><mrow><mi>x</mi><mo>+</mo><mn>10</mn></mrow></mfenced></math></p>`,
    optionB: "(x - 5)(x + 8)",
    optionBHtml: `<p><math><mfenced><mrow><mi>x</mi><mo>-</mo><mn>5</mn></mrow></mfenced><mfenced><mrow><mi>x</mi><mo>+</mo><mn>8</mn></mrow></mfenced></math></p>`,
    optionC: "(x - 8)(x + 5)",
    optionCHtml: `<p><math><mfenced><mrow><mi>x</mi><mo>-</mo><mn>8</mn></mrow></mfenced><mfenced><mrow><mi>x</mi><mo>+</mo><mn>5</mn></mrow></mfenced></math></p>`,
    optionD: "(x - 10)(x + 4)",
    optionDHtml: `<p><math><mfenced><mrow><mi>x</mi><mo>-</mo><mn>10</mn></mrow></mfenced><mfenced><mrow><mi>x</mi><mo>+</mo><mn>4</mn></mrow></mfenced></math></p>`,
    correctAnswer: 'B',
    explanation: "Choice B is correct. The expression x² + 3x - 40 can be factored by finding two numbers that multiply to -40 and add to 3. These numbers are -5 and 8, so the expression factors as (x - 5)(x + 8).",
    topic: 'Algebra',
    difficulty: 'MEDIUM'
  }
]

async function bulkImportQuestions() {
  try {
    // Find a published exam to add questions to
    const exam = await prisma.exam.findFirst({
      where: { isPublished: true },
      include: {
        sections: {
          include: {
            modules: true
          }
        }
      }
    })

    if (!exam) {
      console.log('No published exam found. Please publish an exam first.')
      return
    }

    console.log(`Adding questions to exam: ${exam.title}`)

    // Get the first section and module
    const section = exam.sections[0]
    const module = section?.modules[0]

    if (!module) {
      console.log('No module found in the exam')
      return
    }

    // Get existing questions count
    const existingQuestions = await prisma.examQuestion.count({
      where: { moduleId: module.id }
    })

    const timestamp = Date.now()
    let order = existingQuestions + 1
    let successCount = 0

    for (const [index, q] of sampleQuestions.entries()) {
      try {
        // Process question text (convert MathML to LaTeX if present)
        const processedQuestionText = q.questionHtml 
          ? processQuestionContent(q.questionHtml)
          : q.questionText

        // Process options
        const options = []
        const optionLetters = ['A', 'B', 'C', 'D'] as const
        
        for (const letter of optionLetters) {
          const optionTextKey = `option${letter}` as keyof QuestionData
          const optionHtmlKey = `option${letter}Html` as keyof QuestionData
          
          const optionText = q[optionHtmlKey] 
            ? processQuestionContent(q[optionHtmlKey] as string)
            : (q[optionTextKey] as string)
          
          if (optionText) {
            options.push({
              text: optionText,
              isCorrect: letter === q.correctAnswer
            })
          }
        }

        // Process explanation
        const processedExplanation = q.explanationHtml
          ? processQuestionContent(q.explanationHtml)
          : q.explanation

        // Create question in the question bank
        const question = await prisma.questionBankItem.create({
          data: {
            questionCode: `SAT-MATH-${timestamp}-${String(index + 1).padStart(3, '0')}`,
            questionText: processedQuestionText,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: q.difficulty || 'MEDIUM',
            topic: q.topic || 'Mathematics',
            subject: 'Math',
            program: 'SAT',
            points: 1,
            explanation: processedExplanation,
            options: {
              create: options
            }
          },
          include: {
            options: true
          }
        })

        // Add question to the exam module
        await prisma.examQuestion.create({
          data: {
            moduleId: module.id,
            questionId: question.id,
            order: order++
          }
        })

        console.log(`✓ Added question ${index + 1}: ${question.questionCode}`)
        successCount++

      } catch (error) {
        console.error(`✗ Failed to add question ${index + 1}:`, error)
      }
    }

    console.log(`\n✅ Successfully imported ${successCount} of ${sampleQuestions.length} questions!`)
    console.log(`Exam ID: ${exam.id}`)
    console.log(`You can test the exam at: /dashboard/exams/${exam.id}/take`)

  } catch (error) {
    console.error('Error during bulk import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Add more questions here
export async function importFromJSON(jsonPath: string) {
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const filePath = path.resolve(jsonPath)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const questions: QuestionData[] = JSON.parse(fileContent)
    
    console.log(`Importing ${questions.length} questions from ${jsonPath}`)
    
    // Use the same import logic as above
    // ... (implementation for JSON import)
    
  } catch (error) {
    console.error('Error importing from JSON:', error)
  }
}

// Run the import
if (require.main === module) {
  bulkImportQuestions()
}