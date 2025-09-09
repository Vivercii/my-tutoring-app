import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { detectVisualContent, extractVisualContent, analyzeSVGStructure } from '@/lib/utils/svg-handler'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { question } = await req.json()
    
    if (!question) {
      return NextResponse.json(
        { error: 'No question provided' },
        { status: 400 }
      )
    }

    // Use Gemini 2.5 Flash for faster, cheaper generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    // Check if question has visual content
    const hasVisual = detectVisualContent(question.questionText)
    const visualContent = hasVisual ? extractVisualContent(question.questionText) : null
    const svgStructure = visualContent?.type === 'svg' ? analyzeSVGStructure(visualContent.originalCode) : null

    const prompt = `You are an expert test question writer. Create a similar but unique question based on the following example. The new question should:
1. Test the same concept/skill
2. Have the same difficulty level
3. Use different numbers, scenarios, or contexts
4. Be completely original and not a direct copy
5. Follow the same format (multiple choice, short answer, etc.)
6. PRESERVE THE SAME MATHEMATICAL FORMATTING (LaTeX/KaTeX) style as the original

${hasVisual && visualContent ? `IMPORTANT: The original question contains an SVG diagram showing ${visualContent.description}.

Create a NEW SVG diagram that:
1. Tests the same geometric concept (${visualContent.extractedValues.some(v => v.type === 'angle') ? 'angles' : 'measurements'})
2. Has a similar visual structure but with completely different values
3. Uses different numbers for all angles, measurements, and variables
4. Is mathematically correct and consistent

For reference, the original diagram contained: ${visualContent.extractedValues.map(v => v.original).join(', ')}

Create your SVG with:
- Width: 300, Height: 200
- Black lines with stroke-width="2"
- Text labels with font-size="14"
- Clear geometric relationships

Example SVG structure:
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- For parallel lines with transversal -->
  <line x1="50" y1="60" x2="250" y2="60" stroke="black" stroke-width="2"/>
  <line x1="50" y1="140" x2="250" y2="140" stroke="black" stroke-width="2"/>
  <line x1="80" y1="20" x2="180" y2="180" stroke="black" stroke-width="2"/>
  <text x="85" y="55" font-size="14">65°</text>
  <text x="150" y="55" font-size="14">y</text>
</svg>

Include the complete SVG in your questionText field.
` : ''}

Original Question:
Type: ${question.questionType}
Question: ${hasVisual ? question.questionText.replace(visualContent?.originalCode || '', '[DIAGRAM HERE]') : question.questionText}
${question.questionType === 'MULTIPLE_CHOICE' ? `Options:
A) ${question.options[0]?.text || ''}
B) ${question.options[1]?.text || ''}
C) ${question.options[2]?.text || ''}
D) ${question.options[3]?.text || ''}
Correct Answer: ${question.correctAnswer}` : `Correct Answer: ${question.correctAnswer}`}
${question.explanation ? `Explanation: ${question.explanation}` : ''}

Generate a new similar question in the following JSON format:
{
  "questionText": "The new question text here (preserve LaTeX/KaTeX formatting like $ABC$, $\\angle B$, etc.)",
  "questionType": "${question.questionType}",
  "options": [
    {"letter": "A", "text": "Option A text (use $21^\\circ$ or 21° for degrees)", "isCorrect": true/false},
    {"letter": "B", "text": "Option B text", "isCorrect": true/false},
    {"letter": "C", "text": "Option C text", "isCorrect": true/false},
    {"letter": "D", "text": "Option D text", "isCorrect": true/false}
  ],
  "correctAnswer": "A, B, C, or D for multiple choice, or the answer for short answer",
  "explanation": "Explanation of the correct answer (with proper math formatting)"
}

IMPORTANT: 
- Use proper mathematical notation where appropriate
- If the original uses LaTeX/KaTeX formatting (like $ABC$ for triangle ABC), use the SAME formatting style
- CRITICAL: In JSON, backslashes must be escaped! Use \\\\ for a single backslash
  - For angle notation: use "$\\\\angle B$" not "$\\angle B$"
  - For degrees: use "$45^\\\\circ$" not "$45^\\circ$"
  - For any LaTeX command: double the backslashes
- For variables and expressions, preserve the $ delimiters for inline math
- Alternatively, you can use plain degree symbols ° without LaTeX
- Ensure the question is educationally sound
- Make sure exactly one option is marked as correct for multiple choice
- Return ONLY the JSON, no additional text`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Log raw response for debugging
    console.log('Raw AI response (first 500 chars):', text.substring(0, 500))
    
    // Clean the response to get just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', text)
      throw new Error('Invalid response format from AI')
    }
    
    // Try to parse JSON with better error handling
    let generatedQuestion
    try {
      // Remove any potential markdown code blocks
      let jsonStr = jsonMatch[0]
      // Fix common JSON issues
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      
      // Try to parse directly first
      try {
        generatedQuestion = JSON.parse(jsonStr)
      } catch (firstError) {
        // If it fails, try to fix LaTeX escaping issues
        // The AI might return improperly escaped backslashes in LaTeX
        // We need to be careful not to break valid JSON escaping
        
        // Log the error for debugging
        console.log('First parse attempt failed, trying to fix LaTeX escaping...')
        
        // Replace single backslashes in math expressions with double backslashes
        // This regex looks for patterns like $...\...$
        jsonStr = jsonStr.replace(/(\$[^$]*)\\/g, '$1\\\\')
        
        generatedQuestion = JSON.parse(jsonStr)
      }
    } catch (parseError) {
      console.error('JSON Parse error:', parseError)
      console.error('Attempted to parse:', jsonMatch[0].substring(0, 500))
      console.error('Full response was:', text)
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
    }
    
    return NextResponse.json({ 
      success: true, 
      generatedQuestion 
    })
    
  } catch (error) {
    console.error('Error generating similar question:', error)
    return NextResponse.json(
      { error: 'Failed to generate similar question' },
      { status: 500 }
    )
  }
}