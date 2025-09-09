/**
 * Robust parser for question bank import
 * Handles both tab and comma separated data
 * Specifically designed for oneprep.xyz format where first 2 columns are ignored
 */

import { processQuestionContent } from './mathml-to-latex'

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
  points?: number
  program?: string
  subject?: string
  topic?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface BulkImportResult {
  success: boolean
  questions: ParsedQuestion[]
  errors: string[]
  debugInfo?: {
    detectedSeparator: string
    rowCount: number
    firstRowSample?: string[]
  }
}

/**
 * Detect the separator used in the data (tab or comma)
 */
function detectSeparator(data: string): string {
  const firstLine = data.split('\n')[0] || ''
  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  
  console.log(`[robust-parser] Tab count: ${tabCount}, Comma count: ${commaCount}`)
  
  // Prefer tabs if present, otherwise use commas
  return tabCount > 0 ? '\t' : ','
}

/**
 * Parse a single row of data into question fields
 * Ignores first 2 columns (URL and plain text question)
 * Expected columns (after ignoring first 2):
 * [0] Question_html
 * [1] Question Type
 * [2-5] Choice A-D text
 * [6-9] Choice A-D HTML
 * [10] Correct Answer
 * [11] Explanation text
 * [12] Explanation HTML
 */
function parseRow(columns: string[], rowIndex: number): ParsedQuestion | null {
  // Skip first 2 columns (URL and plain text)
  const relevantColumns = columns.slice(2)
  
  if (relevantColumns.length < 11) {
    console.log(`[robust-parser] Row ${rowIndex}: Not enough columns (${relevantColumns.length} after skipping first 2)`)
    return null
  }
  
  // Extract fields from relevant columns
  const questionHtml = relevantColumns[0] || ''
  const questionType = relevantColumns[1] || 'MULTIPLE_CHOICE'
  const choiceTexts = relevantColumns.slice(2, 6) // Choices A-D - these often contain HTML tables!
  const choiceHtmls = relevantColumns.slice(6, 10) // Choices A-D HTML - may contain Alpine.js templates
  const correctAnswer = relevantColumns[10] || ''
  const explanationText = relevantColumns[11] || ''
  const explanationHtml = relevantColumns[12] || explanationText
  
  // Debug to see what we're getting
  if (rowIndex === 1) {
    console.log('[robust-parser] Debug Choice content:')
    console.log('  Choice A text column:', choiceTexts[0]?.substring(0, 100))
    console.log('  Choice A HTML column:', choiceHtmls[0]?.substring(0, 100))
  }
  
  // Skip if no question HTML
  if (!questionHtml.trim()) {
    console.log(`[robust-parser] Row ${rowIndex}: Empty question HTML`)
    return null
  }
  
  // Process question text from HTML
  const questionText = processQuestionContent(questionHtml)
  
  // Process question type based on the specific codes from oneprep
  let parsedQuestionType: ParsedQuestion['questionType'] = 'MULTIPLE_CHOICE'
  const typeUpper = questionType.toUpperCase()
  
  // Check if we have any answer choices defined
  const hasChoices = choiceTexts.some(choice => choice && choice.trim()) || 
                     choiceHtmls.some(choice => choice && choice.trim() && !choice.includes('$store.data'))
  
  // Handle specific oneprep question type codes
  if (typeUpper === 'SPR' || typeUpper === 'STUDENT_PRODUCED_RESPONSE') {
    // SPR = Student-Produced Response (open-ended, no multiple choice)
    parsedQuestionType = 'SHORT_ANSWER'
    console.log(`[robust-parser] Row ${rowIndex}: SPR question type detected (Student-Produced Response)`)
  } else if (typeUpper === 'MCQ' || typeUpper.includes('MULTIPLE') || typeUpper.includes('CHOICE')) {
    parsedQuestionType = 'MULTIPLE_CHOICE'
  } else if (typeUpper.includes('SHORT') || typeUpper.includes('GRID')) {
    parsedQuestionType = 'SHORT_ANSWER'
  } else if (typeUpper.includes('FREE') || typeUpper.includes('OPEN')) {
    parsedQuestionType = 'FREE_RESPONSE'
  } else if (typeUpper.includes('ESSAY')) {
    parsedQuestionType = 'ESSAY'
  } else if (!hasChoices) {
    // If no choices are defined and type is unclear, default to SHORT_ANSWER
    parsedQuestionType = 'SHORT_ANSWER'
    console.log(`[robust-parser] Row ${rowIndex}: No answer choices found, treating as SHORT_ANSWER`)
  }
  
  // Process options only if this is a multiple choice question
  const options: ParsedQuestion['options'] = []
  
  if (parsedQuestionType === 'MULTIPLE_CHOICE' && hasChoices) {
    const optionLetters = ['A', 'B', 'C', 'D']
    
    for (let i = 0; i < 4; i++) {
      // For oneprep data, the "Choice A/B/C/D" columns (indices 2-5) often contain the actual HTML tables
      // while "Choice A_html/B_html/C_html/D_html" (indices 6-9) contain Alpine.js templates
      
      let optionHtml = ''
      
      // Check if the HTML column contains Alpine.js code (not useful for us)
      const htmlCol = choiceHtmls[i] || ''
      const textCol = choiceTexts[i] || ''
      
      if (htmlCol.includes('$store.data') || htmlCol.includes(':class=')) {
        // This is Alpine.js template code, use the "text" column instead (which actually has HTML)
        optionHtml = textCol
      } else if (htmlCol.trim()) {
        // Use HTML column if it doesn't have Alpine.js
        optionHtml = htmlCol
      } else {
        // Fallback to text column
        optionHtml = textCol
      }
      
      if (optionHtml) {
        const optionText = processQuestionContent(optionHtml)
        options.push({
          letter: optionLetters[i],
          html: cleanHtml(optionHtml),
          text: optionText,
          isCorrect: correctAnswer.toUpperCase() === optionLetters[i]
        })
      }
    }
  } else if (parsedQuestionType !== 'MULTIPLE_CHOICE') {
    // For non-multiple choice questions, log that we're skipping options
    console.log(`[robust-parser] Row ${rowIndex}: Question type is ${parsedQuestionType}, skipping answer options`)
  }
  
  // Use HTML explanation if available, otherwise use text
  const finalExplanation = explanationHtml || explanationText
  
  return {
    questionHtml: cleanHtml(questionHtml),
    questionText,
    questionType: parsedQuestionType,
    options,
    correctAnswer: parsedQuestionType === 'SHORT_ANSWER' 
      ? processQuestionContent(correctAnswer) 
      : correctAnswer.toUpperCase(),
    explanation: processQuestionContent(finalExplanation)
  }
}

/**
 * Clean HTML content from oneprep format
 */
function cleanHtml(html: string): string {
  if (!html) return ''
  
  let cleaned = html.trim()
  
  // Remove quotes if the entire string is quoted
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }
  
  // Replace escaped quotes
  cleaned = cleaned.replace(/""/g, '"')
  
  // Remove Alpine.js directives and Vue/Alpine attributes
  cleaned = cleaned
    .replace(/:class="[^"]*"/g, '')
    .replace(/x-[a-z-]+="[^"]*"/g, '')
    .replace(/@[a-z]+="[^"]*"/g, '')
    .replace(/\$store\.[^}]+}/g, '')
  
  // Remove oneprep wrapper divs if present
  const wrapperMatch = cleaned.match(/<div class="self-center">(.*?)<\/div>/s)
  if (wrapperMatch) {
    cleaned = wrapperMatch[1]
  }
  
  // If the content starts with <figure> and contains a table, keep it as is
  // This preserves the table structure for answer choices
  if (cleaned.includes('<figure') && cleaned.includes('<table')) {
    // Just clean up any remaining Alpine/Vue artifacts
    cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '') // Remove any {{ }} templates
  }
  
  return cleaned
}

/**
 * Main parser function
 */
export function parseRobustImportData(data: string): BulkImportResult {
  const errors: string[] = []
  const questions: ParsedQuestion[] = []
  
  try {
    // Detect separator
    const separator = detectSeparator(data)
    console.log(`[robust-parser] Using separator: ${separator === '\t' ? 'TAB' : 'COMMA'}`)
    
    // Split into rows
    const rows = data.split('\n').filter(row => row.trim())
    console.log(`[robust-parser] Found ${rows.length} rows`)
    
    if (rows.length === 0) {
      errors.push('No data found in import')
      return { success: false, questions: [], errors }
    }
    
    // Check if first row is headers
    const firstRow = rows[0]
    const isHeader = firstRow.toLowerCase().includes('url') || 
                    firstRow.toLowerCase().includes('question')
    
    const startIndex = isHeader ? 1 : 0
    console.log(`[robust-parser] ${isHeader ? 'Headers detected, skipping first row' : 'No headers detected'}`)
    
    // For CSV with multiline content, use special parser
    if (separator === ',' && data.includes('",')) {
      console.log('[robust-parser] Detected CSV with quoted fields, using multiline parser')
      const csvRows = parseCSVData(data)
      
      // Process parsed CSV rows (skip header if present)
      const csvStartIndex = isHeader ? 1 : 0
      for (let i = csvStartIndex; i < csvRows.length; i++) {
        try {
          const columns = csvRows[i]
          
          // Debug first row
          if (i === csvStartIndex) {
            console.log(`[robust-parser] First data row has ${columns.length} columns`)
            console.log(`[robust-parser] Sample columns:`)
            console.log(`  Col 0 (URL): ${columns[0]?.substring(0, 50) || 'empty'}`)
            console.log(`  Col 1 (Plain text): ${columns[1]?.substring(0, 50) || 'empty'}`)
            console.log(`  Col 2 (Question HTML): ${columns[2]?.substring(0, 100) || 'empty'}`)
            console.log(`  Col 3 (Type): ${columns[3] || 'empty'}`)
            console.log(`  Col 4 (Choice A "text"): ${columns[4]?.substring(0, 80) || 'empty'}`)
            console.log(`  Col 8 (Choice A_html): ${columns[8]?.substring(0, 80) || 'empty'}`)
            console.log(`  Col 12 (Correct): ${columns[12] || 'empty'}`)
          }
          
          const parsed = parseRow(columns, i)
          if (parsed) {
            questions.push(parsed)
          } else {
            if (i < csvStartIndex + 5) {
              errors.push(`Row ${i + 1}: Could not parse question`)
            }
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
        }
      }
      
      console.log(`[robust-parser] Successfully parsed ${questions.length} questions from CSV`)
      
      return {
        success: errors.length === 0 && questions.length > 0,
        questions,
        errors: errors.slice(0, 10),
        debugInfo: {
          detectedSeparator: separator,
          rowCount: csvRows.length,
          firstRowSample: csvRows[0]?.slice(0, 5)
        }
      }
    }
    
    // Process each data row (original logic for non-CSV or simple CSV)
    for (let i = startIndex; i < rows.length; i++) {
      try {
        const row = rows[i]
        if (!row.trim()) continue
        
        // Handle CSV format with quoted fields containing commas
        let columns: string[] = []
        if (separator === ',') {
          // Parse CSV considering quoted fields
          columns = parseCSVRow(row)
        } else {
          // Simple tab split
          columns = row.split(separator)
        }
        
        // Debug first row
        if (i === startIndex) {
          console.log(`[robust-parser] First data row has ${columns.length} columns`)
          console.log(`[robust-parser] Sample columns:`)
          console.log(`  Col 0 (URL): ${columns[0]?.substring(0, 50) || 'empty'}`)
          console.log(`  Col 1 (Plain text): ${columns[1]?.substring(0, 50) || 'empty'}`)
          console.log(`  Col 2 (Question HTML): ${columns[2]?.substring(0, 100) || 'empty'}`)
          console.log(`  Col 3 (Type): ${columns[3] || 'empty'}`)
          console.log(`  Col 12 (Correct): ${columns[14] || 'empty'}`)
        }
        
        const parsed = parseRow(columns, i)
        if (parsed) {
          questions.push(parsed)
        } else {
          if (i < startIndex + 5) { // Only log errors for first few rows
            errors.push(`Row ${i + 1}: Could not parse question`)
          }
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
      }
    }
    
    console.log(`[robust-parser] Successfully parsed ${questions.length} questions`)
    
    return {
      success: errors.length === 0 && questions.length > 0,
      questions,
      errors: errors.slice(0, 10), // Limit errors shown
      debugInfo: {
        detectedSeparator: separator,
        rowCount: rows.length,
        firstRowSample: rows[0]?.split(separator).slice(0, 5)
      }
    }
    
  } catch (error) {
    errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { success: false, questions: [], errors }
  }
}

/**
 * Parse CSV data that properly handles multiline quoted fields
 */
function parseCSVData(data: string): string[][] {
  const rows: string[][] = []
  const lines = data.split('\n')
  
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let fieldCount = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // If we're not in quotes and line starts with http, it's a new row
    if (!inQuotes && line.startsWith('http')) {
      // Save previous row if complete
      if (currentRow.length >= 13) {
        rows.push(currentRow)
      }
      currentRow = []
      currentField = ''
      fieldCount = 0
    }
    
    // Process the line character by character
    let linePos = 0
    while (linePos < line.length) {
      const char = line[linePos]
      const nextChar = line[linePos + 1]
      
      if (!inQuotes && char === '"') {
        // Start of quoted field
        inQuotes = true
        linePos++
      } else if (inQuotes && char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"'
        linePos += 2
      } else if (inQuotes && char === '"') {
        // End of quoted field
        inQuotes = false
        linePos++
      } else if (!inQuotes && char === ',') {
        // End of field
        currentRow.push(currentField)
        currentField = ''
        fieldCount++
        linePos++
      } else {
        // Regular character
        currentField += char
        linePos++
      }
    }
    
    // If we're in quotes, add a newline for the multiline field
    if (inQuotes) {
      currentField += '\n'
    } else if (!inQuotes && currentField) {
      // End of line, save field if not in quotes
      currentRow.push(currentField)
      currentField = ''
      fieldCount++
    }
  }
  
  // Don't forget the last row
  if (currentRow.length >= 13) {
    rows.push(currentRow)
  }
  
  return rows
}

/**
 * Parse a CSV row considering quoted fields (single line version)
 */
function parseCSVRow(row: string): string[] {
  const columns: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    const nextChar = row[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      columns.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Don't forget the last field
  if (current || columns.length > 0) {
    columns.push(current)
  }
  
  return columns
}

export function convertToQuestionBankFormat(parsedQuestions: ParsedQuestion[], defaults: {
  program: string
  subject: string
  difficulty: string
  topic?: string
}) {
  return parsedQuestions.map((q) => ({
    program: q.program || defaults.program,
    subject: q.subject || defaults.subject,
    topic: q.topic || defaults.topic,
    difficulty: (q.difficulty || defaults.difficulty) as 'EASY' | 'MEDIUM' | 'HARD',
    questionHtml: q.questionHtml,
    questionText: q.questionText,
    questionType: q.questionType,
    points: 1,
    explanation: q.explanation,
    correctAnswer: q.correctAnswer,
    options: q.options ? q.options.map(opt => ({
      letter: opt.letter,
      html: opt.html,
      text: opt.text,
      isCorrect: opt.isCorrect
    })) : []
  }))
}