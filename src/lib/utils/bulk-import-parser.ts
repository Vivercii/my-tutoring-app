import { processQuestionContent } from './mathml-to-latex'
import { parseOneprepFormatV2 } from './oneprep-parser-v2'

export interface ParsedQuestion {
  questionHtml: string
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'FREE_RESPONSE' | 'ESSAY'
  options: {
    letter: string
    html: string
    text: string
    isCorrect: boolean
  }[]
  correctAnswer: string
  explanation: string
  program?: string
  subject?: string
  topic?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface BulkImportResult {
  success: boolean
  questions: ParsedQuestion[]
  errors: string[]
}

export function parseBulkImportData(data: string): BulkImportResult {
  const errors: string[] = []
  const questions: ParsedQuestion[] = []
  
  try {
    // Check if this is oneprep data (starts with URL)
    const isOneprepData = data.trim().startsWith('http')
    
    let rows: string[][] = []
    
    if (isOneprepData) {
      console.log('Detected oneprep.xyz data format, using specialized parser')
      // Use the specialized parser for oneprep data with multiline cells
      const dataRows = parseOneprepFormatV2(data)
      
      // Add headers
      const headers = ['URL', 'Question', 'Question_html', 'Question Type', 
                      'Choice A', 'Choice B', 'Choice C', 'Choice D',
                      'Choice A_html', 'Choice B_html', 'Choice C_html', 'Choice D_html',
                      'Correct Answer', 'Explaination', 'Explaination_html']
      rows = [headers, ...dataRows]
      
      console.log(`Parsed ${dataRows.length} questions from oneprep format`)
    } else {
      // Regular TSV parsing for other formats
      const textRows = data.split('\n').filter(row => row.trim())
      if (textRows.length === 0) {
        errors.push('No data found in import')
        return { success: false, questions: [], errors }
      }
      rows = textRows.map(row => row.split('\t'))
    }
    
    // Get headers from first row
    const headers = rows[0]
    
    // Map headers to indices based on oneprep.xyz format
    // Expected format: URL, Question, Question_html, Question Type, Choice A, Choice B, Choice C, Choice D, 
    //                  Choice A_html, Choice B_html, Choice C_html, Choice D_html, Correct Answer, Explaination, Explaination_html
    
    // Common header variations and their mappings
    const headerMappings: Record<string, string> = {
      'URL': 'URL',
      'Question': 'Question Text',
      'Question_html': 'Question HTML',
      'Question html': 'Question HTML',
      'Question Type': 'Question Type',
      'Choice A': 'Choice A Text',
      'Choice B': 'Choice B Text', 
      'Choice C': 'Choice C Text',
      'Choice D': 'Choice D Text',
      'Choice A_html': 'Option A HTML',
      'Choice B_html': 'Option B HTML',
      'Choice C_html': 'Option C HTML',
      'Choice D_html': 'Option D HTML',
      'Option A_html': 'Option A HTML',
      'Option B_html': 'Option B HTML',
      'Option C_html': 'Option C HTML',
      'Option D_html': 'Option D HTML',
      'Correct Answer': 'Correct Answer',
      'Explanation': 'Explanation',
      'Explaination': 'Explanation',
      'Explaination_html': 'Explanation HTML',
      'Explanation_html': 'Explanation HTML'
    }
    
    // Find column indices with flexible header matching
    const columnIndices: Record<string, number> = {}
    headers.forEach((header, index) => {
      // Direct match
      columnIndices[header] = index
      // Mapped match
      if (headerMappings[header]) {
        columnIndices[headerMappings[header]] = index
      }
    })
    
    // Debug log to see what headers we found
    console.log('Found headers:', headers)
    console.log('Column indices:', columnIndices)
    
    // For oneprep.xyz format, we expect specific columns
    // If first column is URL, we're dealing with the oneprep format
    const isOneprepFormat = headers[0] === 'URL'
    
    if (isOneprepFormat) {
      console.log('Detected oneprep.xyz format')
      // For oneprep format, map columns by position
      // Expected: URL(0), Question(1), Question_html(2), Question Type(3), 
      //           Choice A(4), Choice B(5), Choice C(6), Choice D(7),
      //           Choice A_html(8), Choice B_html(9), Choice C_html(10), Choice D_html(11),
      //           Correct Answer(12), Explaination(13), Explaination_html(14)
    }
    
    // Required headers (check both original and alternatives)
    // We need at least one of these question columns
    const hasQuestionColumn = columnIndices['Question HTML'] !== undefined || 
                             columnIndices['Question_html'] !== undefined ||
                             columnIndices['Question html'] !== undefined ||
                             (isOneprepFormat && headers.length > 2)
    
    const hasQuestionType = columnIndices['Question Type'] !== undefined || (isOneprepFormat && headers.length > 3)
    const hasCorrectAnswer = columnIndices['Correct Answer'] !== undefined || (isOneprepFormat && headers.length > 12)
    
    if (!hasQuestionColumn) {
      errors.push(`Missing question column. Found headers: ${headers.join(', ')}`)
      return { success: false, questions: [], errors }
    }
    if (!hasQuestionType) {
      errors.push(`Missing Question Type column. Found headers: ${headers.join(', ')}`)
      return { success: false, questions: [], errors }
    }
    if (!hasCorrectAnswer) {
      errors.push(`Missing Correct Answer column. Found headers: ${headers.join(', ')}`)
      return { success: false, questions: [], errors }
    }
    
    // Process each row (skip header row)
    for (let i = 1; i < rows.length; i++) {
      try {
        const columns = rows[i]
        
        // Debug logging for the first few rows
        if (i <= 3) {
          console.log(`Row ${i} columns count:`, columns.length)
          console.log(`Row ${i} sample data:`)
          console.log(`  URL: ${columns[0]?.substring(0, 40) || 'empty'}`)
          console.log(`  Question text: ${columns[1]?.substring(0, 40) || 'empty'}`)
          console.log(`  Question HTML: ${columns[2]?.substring(0, 60) || 'empty'}`)
          console.log(`  Question type: ${columns[3] || 'empty'}`)
          console.log(`  Correct answer: ${columns[12] || 'empty'}`)
        }
        
        // Skip rows that don't have enough columns
        if (columns.length < 12) {
          console.log(`Row ${i} skipped - only ${columns.length} columns`)
          continue
        }
        
        // Extract data based on format
        let questionHtml = ''
        let questionType = 'MULTIPLE_CHOICE'
        
        if (isOneprepFormat) {
          // For oneprep format, use fixed column positions
          questionHtml = columns[2] || '' // Question_html is column 2
          questionType = columns[3] || 'MULTIPLE_CHOICE' // Question Type is column 3
          
          // Debug first question
          if (i === 1) {
            console.log('First question HTML:', questionHtml.substring(0, 100))
            console.log('First question type:', questionType)
          }
        } else {
          // For other formats, try different column names
          if (columnIndices['Question HTML'] !== undefined) {
            questionHtml = columns[columnIndices['Question HTML']] || ''
          } else if (columnIndices['Question_html'] !== undefined) {
            questionHtml = columns[columnIndices['Question_html']] || ''
          } else if (columnIndices['Question html'] !== undefined) {
            questionHtml = columns[columnIndices['Question html']] || ''
          }
          questionType = columns[columnIndices['Question Type']] || 'MULTIPLE_CHOICE'
        }
        
        // Extract options and other data
        let optionA = '', optionB = '', optionC = '', optionD = ''
        let correctAnswer = ''
        let explanation = ''
        
        if (isOneprepFormat) {
          // For oneprep format, use fixed column positions
          // HTML options are in columns 8-11 (Choice A_html through Choice D_html)
          optionA = columns[8] || ''   // Choice A_html
          optionB = columns[9] || ''   // Choice B_html
          optionC = columns[10] || ''  // Choice C_html
          optionD = columns[11] || ''  // Choice D_html
          correctAnswer = columns[12] || '' // Correct Answer
          // Use plain text explanation (column 13) or HTML (column 14)
          explanation = columns[13] || columns[14] || ''
        } else {
          // For other formats, check which columns exist
          if (columnIndices['Option A HTML'] !== undefined) {
            optionA = columns[columnIndices['Option A HTML']] || ''
          } else if (columnIndices['Choice A_html'] !== undefined) {
            optionA = columns[columnIndices['Choice A_html']] || ''
          } else if (columnIndices['Choice A'] !== undefined) {
            optionA = columns[columnIndices['Choice A']] || ''
          }
          
          if (columnIndices['Option B HTML'] !== undefined) {
            optionB = columns[columnIndices['Option B HTML']] || ''
          } else if (columnIndices['Choice B_html'] !== undefined) {
            optionB = columns[columnIndices['Choice B_html']] || ''
          } else if (columnIndices['Choice B'] !== undefined) {
            optionB = columns[columnIndices['Choice B']] || ''
          }
          
          if (columnIndices['Option C HTML'] !== undefined) {
            optionC = columns[columnIndices['Option C HTML']] || ''
          } else if (columnIndices['Choice C_html'] !== undefined) {
            optionC = columns[columnIndices['Choice C_html']] || ''
          } else if (columnIndices['Choice C'] !== undefined) {
            optionC = columns[columnIndices['Choice C']] || ''
          }
          
          if (columnIndices['Option D HTML'] !== undefined) {
            optionD = columns[columnIndices['Option D HTML']] || ''
          } else if (columnIndices['Choice D_html'] !== undefined) {
            optionD = columns[columnIndices['Choice D_html']] || ''
          } else if (columnIndices['Choice D'] !== undefined) {
            optionD = columns[columnIndices['Choice D']] || ''
          }
          
          correctAnswer = columns[columnIndices['Correct Answer']] || ''
          
          if (columnIndices['Explanation'] !== undefined) {
            explanation = columns[columnIndices['Explanation']] || ''
          } else if (columnIndices['Explanation HTML'] !== undefined) {
            explanation = columns[columnIndices['Explanation HTML']] || ''
          } else if (columnIndices['Explaination'] !== undefined) {
            explanation = columns[columnIndices['Explaination']] || ''
          } else if (columnIndices['Explaination_html'] !== undefined) {
            explanation = columns[columnIndices['Explaination_html']] || ''
          }
        }
        
        // Optional columns
        const program = columnIndices['Program'] !== undefined ? columns[columnIndices['Program']] : undefined
        const subject = columnIndices['Subject'] !== undefined ? columns[columnIndices['Subject']] : undefined
        const topic = columnIndices['Topic'] !== undefined ? columns[columnIndices['Topic']] : undefined
        const difficulty = columnIndices['Difficulty'] !== undefined ? columns[columnIndices['Difficulty']] as any : undefined
        
        if (!questionHtml || questionHtml.trim() === '') {
          const col2Preview = columns[2] ? String(columns[2]).substring(0, 30) : 'empty'
          errors.push(`Row ${i}: Missing question HTML (${columns.length} columns found, column 2: "${col2Preview}")`)
          continue
        }
        
        // Convert MathML to LaTeX in question text
        const questionText = processQuestionContent(questionHtml)
        
        // Process options
        const options = []
        const optionLetters = ['A', 'B', 'C', 'D']
        const optionHtmls = [optionA, optionB, optionC, optionD]
        
        for (let j = 0; j < optionLetters.length; j++) {
          if (optionHtmls[j]) {
            // Clean up HTML from oneprep.xyz format
            let cleanedHtml = optionHtmls[j]
            
            // Extract actual content from oneprep.xyz wrapper divs
            const contentMatch = cleanedHtml.match(/<div class="self-center">(.*?)<\/div>/s)
            if (contentMatch) {
              cleanedHtml = contentMatch[1]
            }
            
            // Remove Alpine.js attributes and TailwindCSS classes from tables
            cleanedHtml = cleanedHtml
              .replace(/x-[a-z-]+="[^"]*"/g, '') // Remove Alpine.js attributes
              .replace(/:class="[^"]*"/g, '') // Remove Alpine :class
              .replace(/@[a-z]+="[^"]*"/g, '') // Remove Alpine @ handlers
              .replace(/class="[^"]*"/g, '') // Remove all class attributes
              .replace(/style="[^"]*"/g, '') // Remove inline styles for now
              .replace(/aria-[a-z-]+="[^"]*"/g, '') // Remove aria attributes
              .replace(/role="[^"]*"/g, '') // Remove role attributes
              .replace(/scope="[^"]*"/g, '') // Remove scope attributes
              .replace(/<figure[^>]*>/g, '') // Remove figure tags
              .replace(/<\/figure>/g, '')
              .trim()
            
            const optionText = processQuestionContent(cleanedHtml)
            options.push({
              letter: optionLetters[j],
              html: cleanedHtml,
              text: optionText,
              isCorrect: correctAnswer.toUpperCase() === optionLetters[j]
            })
          }
        }
        
        // Determine question type
        let parsedQuestionType: ParsedQuestion['questionType'] = 'MULTIPLE_CHOICE'
        const typeUpper = questionType.toUpperCase()
        if (typeUpper === 'MCQ' || typeUpper.includes('MULTIPLE') || typeUpper.includes('CHOICE')) {
          parsedQuestionType = 'MULTIPLE_CHOICE'
        } else if (typeUpper.includes('SHORT')) {
          parsedQuestionType = 'SHORT_ANSWER'
        } else if (typeUpper.includes('FREE')) {
          parsedQuestionType = 'FREE_RESPONSE'
        } else if (typeUpper.includes('ESSAY')) {
          parsedQuestionType = 'ESSAY'
        }
        
        questions.push({
          questionHtml,
          questionText,
          questionType: parsedQuestionType,
          options,
          correctAnswer,
          explanation,
          program,
          subject,
          topic,
          difficulty
        })
        
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      questions,
      errors
    }
    
  } catch (error) {
    errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { success: false, questions: [], errors }
  }
}

export function convertToQuestionBankFormat(parsedQuestions: ParsedQuestion[], defaults: {
  program: string
  subject: string
  difficulty: string
  topic?: string
}) {
  return parsedQuestions.map((q, index) => ({
    program: q.program || defaults.program,
    subject: q.subject || defaults.subject,
    topic: q.topic || defaults.topic,
    difficulty: q.difficulty || defaults.difficulty,
    questionText: q.questionText,
    questionType: q.questionType,
    points: 1,
    explanation: q.explanation,
    options: q.options.map(opt => ({
      text: opt.text,
      isCorrect: opt.isCorrect
    }))
  }))
}

// Sample template for users to understand the format
export const BULK_IMPORT_TEMPLATE = `Question_html\tQuestion Type\tChoice A_html\tChoice B_html\tChoice C_html\tChoice D_html\tCorrect Answer\tExplaination
<p>What is 2 + 2?</p>\tMULTIPLE_CHOICE\t<p>3</p>\t<p>4</p>\t<p>5</p>\t<p>6</p>\tB\tThe sum of 2 + 2 equals 4.`

export const BULK_IMPORT_INSTRUCTIONS = `
Import Format Instructions:
1. Data should be tab-separated (TSV format)
2. First row must contain headers
3. Required columns (flexible naming supported):
   - Question HTML (or Question_html, Question html)
   - Question Type
   - Option/Choice A-D HTML (or Choice A_html, Option A_html, etc.)
   - Correct Answer
   - Explanation (or Explaination, Explaination_html)
4. Optional columns: Program, Subject, Topic, Difficulty
5. Question Type can be: MULTIPLE_CHOICE, SHORT_ANSWER, FREE_RESPONSE, or ESSAY (or mcq which converts to MULTIPLE_CHOICE)
6. Correct Answer should be A, B, C, or D for multiple choice
7. HTML and MathML content is supported and will be converted appropriately
8. You can copy directly from oneprep.xyz or spreadsheet applications like Excel or Google Sheets
`