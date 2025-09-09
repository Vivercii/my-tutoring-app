import { PrismaClient } from '@prisma/client'
import { processQuestionContent } from '../src/lib/utils/mathml-to-latex'

const prisma = new PrismaClient()

// The actual questions you provided
const actualQuestions = [
  {
    // Question 1: Frequency Table
    questionText: "4, 4, 4, 4, 8, 8, 8, 13, 13\n\nWhich frequency table correctly represents the data listed?",
    questionHtml: `<div class="my-3" id="question-stem"><p style="text-align: center;"><math alttext="4"><mn>4</mn></math>, <math alttext="4"><mn>4</mn></math>, <math alttext="4"><mn>4</mn></math>, <math alttext="4"><mn>4</mn></math>, <math alttext="8"><mn>8</mn></math>, <math alttext="8"><mn>8</mn></math>, <math alttext="8"><mn>8</mn></math>, <math alttext="13"><mn>13</mn></math>, <math alttext="13"><mn>13</mn></math></p>
<p style="text-align: left;">Which frequency table correctly represents the data listed?</p></div>`,
    questionType: 'MULTIPLE_CHOICE',
    options: [
      {
        letter: 'A',
        html: `<table border="1" style="border-collapse: collapse;">
<thead>
<tr>
<th style="text-align: center;">Number</th>
<th style="text-align: center;">Frequency</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: center;"><math alttext="4"><mn>4</mn></math></td>
<td style="text-align: center;"><math alttext="4"><mn>4</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="8"><mn>8</mn></math></td>
<td style="text-align: center;"><math alttext="3"><mn>3</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="13"><mn>13</mn></math></td>
<td style="text-align: center;"><math alttext="2"><mn>2</mn></math></td>
</tr>
</tbody>
</table>`,
        isCorrect: true
      },
      {
        letter: 'B',
        html: `<table border="1" style="border-collapse: collapse;">
<thead>
<tr>
<th style="text-align: center;">Number</th>
<th style="text-align: center;">Frequency</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: center;"><math alttext="4"><mn>4</mn></math></td>
<td style="text-align: center;"><math alttext="4"><mn>4</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="3"><mn>3</mn></math></td>
<td style="text-align: center;"><math alttext="8"><mn>8</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="2"><mn>2</mn></math></td>
<td style="text-align: center;"><math alttext="13"><mn>13</mn></math></td>
</tr>
</tbody>
</table>`,
        isCorrect: false
      },
      {
        letter: 'C',
        html: `<table border="1" style="border-collapse: collapse">
<thead>
<tr>
<th style="text-align: center;">Number</th>
<th style="text-align: center;">Frequency</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: center;"><math alttext="4"><mn>4</mn></math></td>
<td style="text-align: center;"><math alttext="16"><mn>16</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="8"><mn>8</mn></math></td>
<td style="text-align: center;"><math alttext="24"><mn>24</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="13"><mn>13</mn></math></td>
<td style="text-align: center;"><math alttext="26"><mn>26</mn></math></td>
</tr>
</tbody>
</table>`,
        isCorrect: false
      },
      {
        letter: 'D',
        html: `<table border="1" style="border-collapse: collapse;">
<thead>
<tr>
<th style="text-align: center;">Number</th>
<th style="text-align: center;">Frequency</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: center;"><math alttext="16"><mn>16</mn></math></td>
<td style="text-align: center;"><math alttext="4"><mn>4</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="24"><mn>24</mn></math></td>
<td style="text-align: center;"><math alttext="8"><mn>8</mn></math></td>
</tr>
<tr>
<td style="text-align: center;"><math alttext="26"><mn>26</mn></math></td>
<td style="text-align: center;"><math alttext="13"><mn>13</mn></math></td>
</tr>
</tbody>
</table>`,
        isCorrect: false
      }
    ],
    explanation: `Choice A is correct. A frequency table is a table that lists the data value and shows the number of times the data value occurs. In the data listed, the number 4 occurs four times, the number 8 occurs three times, and the number 13 occurs two times. This corresponds to the table in choice A.

Choice B is incorrect. This table has the values for number and frequency reversed.

Choice C is incorrect because the frequency values don't represent the data listed.

Choice D is incorrect. This table represents the listed number values as the frequency values.`,
    topic: 'Statistics',
    difficulty: 'EASY'
  },
  {
    // Question 2: Factoring
    questionText: "Which expression is equivalent to x² + 3x - 40?",
    questionHtml: `<div class="my-3" id="question-stem"><p>Which expression is equivalent to <math alttext="x squared plus 3 x minus 40"><mrow>
<msup>
<mi>x</mi>
<mn>2</mn>
</msup>
<mo>+</mo>
<mrow>
<mn>3</mn>
<mi>x</mi>
</mrow>
<mo>-</mo>
<mn>40</mn>
</mrow>
</math>?</p></div>`,
    questionType: 'MULTIPLE_CHOICE',
    options: [
      {
        letter: 'A',
        html: `<p><math alttext="left parenthesis x minus 4 right parenthesis left parenthesis x plus 10 right parenthesis"><mrow>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>-</mo>
            <mn>4</mn>
        </mrow>
    </mfenced>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>+</mo>
            <mn>10</mn>
        </mrow>
    </mfenced>
</mrow>
</math></p>`,
        isCorrect: false
      },
      {
        letter: 'B',
        html: `<p><math alttext="left parenthesis x minus 5 right parenthesis left parenthesis x plus 8 right parenthesis"><mrow>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>-</mo>
            <mn>5</mn>
        </mrow>
    </mfenced>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>+</mo>
            <mn>8</mn>
        </mrow>
    </mfenced>
</mrow>
</math></p>`,
        isCorrect: true
      },
      {
        letter: 'C',
        html: `<p><math alttext="left parenthesis x minus 8 right parenthesis left parenthesis x plus 5 right parenthesis"><mrow>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>-</mo>
            <mn>8</mn>
        </mrow>
    </mfenced>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>+</mo>
            <mn>5</mn>
        </mrow>
    </mfenced>
</mrow>
</math></p>`,
        isCorrect: false
      },
      {
        letter: 'D',
        html: `<p><math alttext="left parenthesis x minus 10 right parenthesis left parenthesis x plus 4 right parenthesis"><mrow>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>-</mo>
            <mn>10</mn>
        </mrow>
    </mfenced>
    <mfenced>
        <mrow>
            <mi>x</mi>
            <mo>+</mo>
            <mn>4</mn>
        </mrow>
    </mfenced>
</mrow>
</math></p>`,
        isCorrect: false
      }
    ],
    explanation: `Choice B is correct. The given expression may be rewritten as x² + 8x - 5x - 40. Since the first two terms have a common factor of x and the last two terms have a common factor of -5, this expression may be rewritten as x(x + 8) - 5(x + 8). Since each term has a common factor of (x + 8), it may be rewritten as (x - 5)(x + 8).

Alternate approach: An expression of the form x² + bx + c can be factored if there are two values that add to give b and multiply to give c. In the given expression, b = 3 and c = -40. The values of -5 and 8 add to give 3 and multiply to give -40, so the expression can be factored as (x - 5)(x + 8).`,
    topic: 'Algebra',
    difficulty: 'MEDIUM'
  }
]

async function importActualQuestions() {
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

    console.log(`\nAdding questions to exam: ${exam.title}`)
    console.log('=' + '='.repeat(50))

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

    for (const [index, q] of actualQuestions.entries()) {
      try {
        console.log(`\n📝 Processing Question ${index + 1}...`)
        
        // Process question text (convert MathML to LaTeX)
        const processedQuestionText = processQuestionContent(q.questionHtml)
        console.log(`   Question: ${processedQuestionText.substring(0, 50)}...`)

        // Process options - keep tables as HTML but convert math
        const options = []
        for (const opt of q.options) {
          // For tables, we'll keep the HTML structure but convert the math inside
          let processedText = opt.html
          
          // Convert MathML to LaTeX within the table
          processedText = processedText.replace(/<math[^>]*>(.*?)<\/math>/gis, (match, content) => {
            // Simple conversion for numbers
            const cleaned = content.replace(/<mn>(\d+)<\/mn>/g, '$1')
              .replace(/<mi>([a-zA-Z])<\/mi>/g, '$1')
              .replace(/<[^>]+>/g, '')
              .trim()
            return `$${cleaned}$`
          })
          
          options.push({
            text: processedText,
            isCorrect: opt.isCorrect
          })
        }
        
        console.log(`   Options: ${options.length} choices processed`)

        // Create question in the question bank
        const question = await prisma.questionBankItem.create({
          data: {
            questionCode: `SAT-MATH-ACTUAL-${timestamp}-${String(index + 1).padStart(3, '0')}`,
            questionText: processedQuestionText,
            questionType: q.questionType,
            difficulty: q.difficulty || 'MEDIUM',
            topic: q.topic || 'Mathematics',
            subject: 'Math',
            program: 'SAT',
            points: 1,
            explanation: q.explanation,
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

        console.log(`   ✅ Success! Added as: ${question.questionCode}`)
        console.log(`   Topic: ${q.topic}, Difficulty: ${q.difficulty}`)
        successCount++

      } catch (error) {
        console.error(`   ❌ Failed to add question ${index + 1}:`, error)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`\n🎉 Successfully imported ${successCount} of ${actualQuestions.length} questions!`)
    console.log(`📍 Exam ID: ${exam.id}`)
    console.log(`🔗 Test URL: /dashboard/exams/${exam.id}/take`)
    console.log(`\n💡 The questions include:`)
    console.log(`   - Frequency tables with proper formatting`)
    console.log(`   - Mathematical expressions with LaTeX rendering`)
    console.log(`   - Full explanations for each answer`)

  } catch (error) {
    console.error('Error during import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
if (require.main === module) {
  importActualQuestions()
}