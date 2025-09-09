import { prisma } from '@/lib/prisma'

/**
 * Generate a unique question code based on program and subject
 * Format: PROGRAM-SUBJECT-NUMBER (e.g., SAT-M-001234, ACT-R-005678)
 */
export async function generateQuestionCode(program: string, subject: string): Promise<string> {
  // Get subject abbreviation
  const subjectMap: Record<string, string> = {
    'Math': 'M',
    'Reading': 'R',
    'Writing': 'W',
    'Science': 'S',
    'English': 'E'
  }
  
  const subjectCode = subjectMap[subject] || subject.substring(0, 1).toUpperCase()
  const programCode = program.toUpperCase()
  
  // Find the highest existing number for this program-subject combination
  const pattern = `${programCode}-${subjectCode}-%`
  
  const lastQuestion = await prisma.questionBankItem.findFirst({
    where: {
      questionCode: {
        startsWith: `${programCode}-${subjectCode}-`
      }
    },
    orderBy: {
      questionCode: 'desc'
    }
  })
  
  let nextNumber = 1
  
  if (lastQuestion && lastQuestion.questionCode) {
    // Extract the number from the last code
    const matches = lastQuestion.questionCode.match(/(\d+)$/)
    if (matches) {
      nextNumber = parseInt(matches[1]) + 1
    }
  }
  
  // Format with leading zeros (6 digits)
  const formattedNumber = nextNumber.toString().padStart(6, '0')
  
  return `${programCode}-${subjectCode}-${formattedNumber}`
}

/**
 * Parse a question code to extract its components
 */
export function parseQuestionCode(code: string): {
  program: string
  subject: string
  number: number
} | null {
  const matches = code.match(/^([A-Z]+)-([A-Z])-(\d+)$/)
  
  if (!matches) return null
  
  return {
    program: matches[1],
    subject: matches[2],
    number: parseInt(matches[3])
  }
}