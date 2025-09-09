import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaClient } from '@prisma/client'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const prisma = new PrismaClient()

interface ClassificationResult {
  domainCode: string
  domainName: string
  skillName: string
  confidence: number
  meanImportance?: number
  reasoning?: string
}

/**
 * Classify a question into domain and skill using AI
 */
export async function classifyQuestion(
  questionText: string,
  questionType?: string,
  correctAnswer?: string
): Promise<ClassificationResult | null> {
  try {
    // Get all domains and skills for reference
    const domains = await prisma.domain.findMany({
      include: {
        skills: {
          orderBy: { meanImportance: 'desc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Build domain/skill reference for the AI
    const domainSkillReference = domains.map(domain => ({
      code: domain.code,
      name: domain.name,
      skills: domain.skills.map(skill => ({
        name: skill.name,
        importance: skill.meanImportance
      }))
    }))

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `You are an expert SAT Math question classifier. Classify the following question into the appropriate domain and skill.

QUESTION:
${questionText}
${questionType ? `Type: ${questionType}` : ''}
${correctAnswer ? `Correct Answer: ${correctAnswer}` : ''}

AVAILABLE DOMAINS AND SKILLS:
${JSON.stringify(domainSkillReference, null, 2)}

CLASSIFICATION GUIDELINES:
1. ALGEBRA (ALG): Linear equations, inequalities, systems of linear equations
2. ADVANCED MATH (ADV): Quadratics, polynomials, exponentials, functions, radicals
3. PROBLEM-SOLVING AND DATA ANALYSIS (PSA): Rates, ratios, percents, statistics, probability, data interpretation
4. GEOMETRY AND TRIGONOMETRY (GEO): Area, volume, triangles, circles, trigonometry, Pythagorean theorem

Analyze the question carefully and return ONLY a JSON object in this format:
{
  "domainCode": "ALG|ADV|PSA|GEO",
  "domainName": "Full domain name",
  "skillName": "Exact skill name from the list",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this classification was chosen"
}

IMPORTANT: The skillName must EXACTLY match one of the skills in the provided list.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in classification response')
      return null
    }
    
    try {
      const classification = JSON.parse(jsonMatch[0]) as ClassificationResult
      
      // Validate the classification
      const domain = domains.find(d => d.code === classification.domainCode)
      if (!domain) {
        console.error(`Invalid domain code: ${classification.domainCode}`)
        return null
      }
      
      const skill = domain.skills.find(s => s.name === classification.skillName)
      if (!skill) {
        console.error(`Skill "${classification.skillName}" not found in domain ${domain.name}`)
        // Try to find the closest match
        const closestSkill = findClosestSkill(classification.skillName, domain.skills)
        if (closestSkill) {
          classification.skillName = closestSkill.name
          console.log(`Using closest match: ${closestSkill.name}`)
        } else {
          return null
        }
      }
      
      return classification
    } catch (error) {
      console.error('Error parsing classification JSON:', error)
      return null
    }
    
  } catch (error) {
    console.error('Error classifying question:', error)
    return null
  }
}

/**
 * Find the closest matching skill name using simple string similarity
 */
function findClosestSkill(targetName: string, skills: any[]): any | null {
  const target = targetName.toLowerCase()
  let bestMatch = null
  let bestScore = 0
  
  for (const skill of skills) {
    const skillName = skill.name.toLowerCase()
    // Simple substring matching
    if (skillName.includes(target) || target.includes(skillName)) {
      return skill
    }
    
    // Calculate similarity score (percentage of matching words)
    const targetWords = target.split(/\s+/)
    const skillWords = skillName.split(/\s+/)
    const matchingWords = targetWords.filter(word => 
      skillWords.some(sw => sw.includes(word) || word.includes(sw))
    )
    const score = matchingWords.length / targetWords.length
    
    if (score > bestScore && score > 0.5) {
      bestScore = score
      bestMatch = skill
    }
  }
  
  return bestMatch
}

/**
 * Batch classify multiple questions
 */
export async function classifyQuestions(
  questions: Array<{
    questionText: string
    questionType?: string
    correctAnswer?: string
  }>
): Promise<(ClassificationResult | null)[]> {
  const results: (ClassificationResult | null)[] = []
  
  // Process in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize)
    const batchPromises = batch.map(q => 
      classifyQuestion(q.questionText, q.questionType, q.correctAnswer)
    )
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Add a small delay between batches
    if (i + batchSize < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * Update a question with its classification
 */
export async function updateQuestionClassification(
  questionId: string,
  classification: ClassificationResult
): Promise<boolean> {
  try {
    // Find the domain
    const domain = await prisma.domain.findFirst({
      where: { code: classification.domainCode }
    })
    
    if (!domain) {
      console.error(`Domain not found: ${classification.domainCode}`)
      return false
    }
    
    // Find the skill
    const skill = await prisma.skill.findFirst({
      where: {
        domainId: domain.id,
        name: classification.skillName
      }
    })
    
    if (!skill) {
      console.error(`Skill not found: ${classification.skillName} in domain ${domain.name}`)
      return false
    }
    
    // Update the question
    await prisma.questionBankItem.update({
      where: { id: questionId },
      data: {
        domainId: domain.id,
        skillId: skill.id
      }
    })
    
    return true
  } catch (error) {
    console.error('Error updating question classification:', error)
    return false
  }
}

/**
 * Classify multiple questions in a single batch
 */
export async function classifyQuestionsBatch(
  questions: Array<{
    questionText: string
    questionType?: string
    correctAnswer?: string
  }>
): Promise<(ClassificationResult | null)[]> {
  console.log(`[CLASSIFIER-BATCH] Starting batch classification for ${questions.length} questions`)
  
  try {
    // Get all domains and skills for reference
    console.log('[CLASSIFIER-BATCH] Fetching domains and skills from database...')
    const domains = await prisma.domain.findMany({
      include: {
        skills: {
          orderBy: { meanImportance: 'desc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    console.log(`[CLASSIFIER-BATCH] Found ${domains.length} domains with skills`)
    
    // Build domain/skill reference for the AI
    const domainSkillReference = domains.map(domain => ({
      code: domain.code,
      name: domain.name,
      skills: domain.skills.map(skill => ({
        name: skill.name,
        importance: skill.meanImportance
      }))
    }))

    console.log('[CLASSIFIER-BATCH] Initializing Gemini AI model...')
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    console.log('[CLASSIFIER-BATCH] Building AI prompt...')
    const prompt = `You are an expert SAT Math question classifier. Classify the following ${questions.length} questions into appropriate domains and skills.

AVAILABLE DOMAINS AND SKILLS:
${JSON.stringify(domainSkillReference, null, 2)}

QUESTIONS TO CLASSIFY:
${questions.map((q, i) => `
Question ${i + 1}:
${q.questionText}
Type: ${q.questionType || 'Unknown'}
${q.correctAnswer ? `Answer: ${q.correctAnswer}` : ''}
`).join('\n---\n')}

INSTRUCTIONS:
1. For each question, identify the PRIMARY mathematical concept being tested
2. Match it to the most appropriate domain (ALG, ADV, PSA, or GEO)
3. Match it to the most specific skill within that domain
4. Use the exact skill names from the list provided

Return ONLY a JSON array with ${questions.length} objects, one for each question in order:
[
  {
    "domainCode": "ALG",
    "domainName": "Algebra",
    "skillName": "exact skill name from list",
    "meanImportance": importance value,
    "confidence": 0.95,
    "reasoning": "brief explanation"
  },
  ...
]`

    console.log('[CLASSIFIER-BATCH] Calling Gemini AI for classification...')
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    console.log('[CLASSIFIER-BATCH] AI Response received, length:', response.length)
    console.log('[CLASSIFIER-BATCH] First 500 chars of response:', response.substring(0, 500))
    
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[CLASSIFIER-BATCH] Failed to extract JSON from AI response')
      console.error('[CLASSIFIER-BATCH] Full response:', response)
      return questions.map(() => null)
    }
    
    console.log('[CLASSIFIER-BATCH] JSON extracted successfully')
    
    try {
      const classifications = JSON.parse(jsonMatch[0]) as ClassificationResult[]
      
      // Validate and enhance each classification
      return classifications.map((classification, index) => {
        if (!classification || !classification.domainCode || !classification.skillName) {
          console.error(`Invalid classification for question ${index + 1}`)
          return null
        }
        
        // Find the domain
        const domain = domains.find(d => d.code === classification.domainCode)
        if (!domain) {
          console.error(`Domain not found: ${classification.domainCode}`)
          return null
        }
        
        // Find the skill and its importance
        const skill = domain.skills.find(s => 
          s.name.toLowerCase() === classification.skillName.toLowerCase()
        )
        
        if (skill) {
          classification.meanImportance = skill.meanImportance
        }
        
        return classification
      })
    } catch (parseError) {
      console.error('Failed to parse batch classification JSON:', parseError)
      return questions.map(() => null)
    }
    
  } catch (error) {
    console.error('[CLASSIFIER-BATCH] Error during classification:', error)
    console.error('[CLASSIFIER-BATCH] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: error?.constructor?.name
    })
    return questions.map(() => null)
  }
}