import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { questionText, questionType, options, correctAnswer, count = 3 } = await req.json()
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `You are an expert SAT Math test creator. Generate ${count} EXTREMELY SIMILAR variations of the following question.

Original Question:
${questionText}

Question Type: ${questionType}
${options ? `Original Options: ${JSON.stringify(options)}` : ''}
${correctAnswer ? `Original Correct Answer: ${correctAnswer}` : ''}

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:
1. PRESERVE ALL MATHEMATICAL NOTATION:
   - Keep ALL <math>, <mn>, <mo>, <mrow>, <mfrac> tags exactly as they appear
   - Keep ALL dollar signs for inline math (e.g., $x^2$, $\\frac{1}{2}$)
   - Keep ALL LaTeX/KaTeX formatting (\\frac{}, \\sqrt{}, ^{}, _{}, etc.)
2. Only change the NUMBERS inside the math notation, nothing else
3. If it's a table question, keep the exact same HTML table structure
4. Keep the same mathematical concept, difficulty, and solution method
5. The answer choices should follow the same pattern and formatting as original
6. Generate variations that are so similar that only the numbers change
7. Maintain exact HTML formatting if present (tables, figures, etc.)
8. Keep the same context and scenario

Examples of CORRECT changes:
- If original has "<math><mn>4</mn></math>" → change to "<math><mn>6</mn></math>"
- If original has "$x^2 + 4x + 3$" → change to "$x^2 + 6x + 5$"
- If original has "\\frac{3}{4}" → change to "\\frac{5}{8}"
- Keep all formatting tags and symbols EXACTLY the same

For multiple choice, provide exactly 4 options (A, B, C, D) that follow the same pattern as the original.

Return your response as a JSON array with exactly ${count} variations:
[
  {
    "questionText": "The variation question text with only numbers changed",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"] or null for non-MC,
    "correctAnswer": "The correct answer letter",
    "explanation": "Brief explanation matching the original's style"
  }
]

Only return valid JSON, no other text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }
    
    const variations = JSON.parse(jsonMatch[0])
    
    return NextResponse.json({
      success: true,
      variations
    })
    
  } catch (error) {
    console.error('Error generating variations:', error)
    return NextResponse.json(
      { error: 'Failed to generate variations' },
      { status: 500 }
    )
  }
}