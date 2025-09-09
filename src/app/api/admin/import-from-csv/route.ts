import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import Papa from 'papaparse'

// Extract passage and question using the same logic as your HTML script
function parseQuestion(fullText: string) {
  if (!fullText) return { passage: '', question: '' }
  
  const patterns = [
    "Which choice completes",
    "Which choice best describes",
    "Which choice best",
    "Which choice most",
    "Which finding",
    "Which quotation",
    "Which statement",
    "What is the",
    "What does",
    "What can",
    "What function",
    "According to",
    "Based on",
    "The passage",
    "The author",
    "The student",
    "The main",
    "How does",
    "Why does",
    "In the context",
    "The text",
    "It can most reasonably"
  ]
  
  let splitPoint = -1
  
  // Use lastIndexOf to find the last occurrence (matching your HTML script)
  for (const pattern of patterns) {
    const index = fullText.lastIndexOf(pattern)
    if (index > splitPoint) {
      splitPoint = index
    }
  }
  
  if (splitPoint > 0) {
    return {
      passage: fullText.substring(0, splitPoint).trim(),
      question: fullText.substring(splitPoint).trim()
    }
  }
  
  return { passage: '', question: fullText }
}

export async function POST(request: NextRequest) {
  try {
    const { csvPath } = await request.json()
    
    if (!csvPath) {
      return NextResponse.json({ error: 'CSV path required' }, { status: 400 })
    }
    
    console.log('Reading CSV from:', csvPath)
    
    // Read the CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Parse CSV
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    })
    
    console.log(`Found ${data.length} rows in CSV`)
    
    // First, delete all existing Reading & Writing passages
    const deleted = await prisma.passage.deleteMany({
      where: {
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } }
        ]
      }
    })
    
    console.log(`Deleted ${deleted.count} existing passages`)
    
    // Process each row and update questions
    let processed = 0
    let withPassages = 0
    const passageMap = new Map<string, string>()
    
    for (const row of data as any[]) {
      // Skip if no question data
      if (!row.Question && !row.Question_html) continue
      
      // Get the question URL to find it in database
      const url = row.URL
      if (!url) continue
      
      // Use HTML content if available, otherwise plain text
      const fullText = row.Question_html || row.Question
      
      // Parse the question
      const { passage, question } = parseQuestion(fullText)
      
      // Find the question in database by URL or by text content
      const dbQuestion = await prisma.questionBankItem.findFirst({
        where: {
          OR: [
            { questionText: { contains: url } },
            { questionText: { contains: fullText.substring(0, 100) } }
          ]
        }
      })
      
      if (!dbQuestion) {
        console.log(`Question not found for URL: ${url}`)
        continue
      }
      
      processed++
      
      // If we have a passage, create or reuse it
      if (passage && passage.length > 30) {
        let passageId = passageMap.get(passage)
        
        if (!passageId) {
          // Create new passage
          const newPassage = await prisma.passage.create({
            data: {
              title: `Reading & Writing Passage`,
              content: passage,
              program: 'SAT'
            }
          })
          passageId = newPassage.id
          passageMap.set(passage, passageId)
          console.log(`Created passage ${passageId}`)
        }
        
        // Update the question
        await prisma.questionBankItem.update({
          where: { id: dbQuestion.id },
          data: {
            questionText: question || fullText,
            passageId: passageId
          }
        })
        
        withPassages++
      } else {
        // Just update the question text
        await prisma.questionBankItem.update({
          where: { id: dbQuestion.id },
          data: {
            questionText: question || fullText,
            passageId: null
          }
        })
      }
      
      if (processed % 50 === 0) {
        console.log(`Processed ${processed} questions...`)
      }
    }
    
    return NextResponse.json({
      success: true,
      processed,
      withPassages,
      passagesCreated: passageMap.size,
      message: 'Successfully imported and processed questions from CSV'
    })
    
  } catch (error: any) {
    console.error('Error importing from CSV:', error)
    return NextResponse.json({ 
      error: 'Failed to import from CSV',
      details: error.message
    }, { status: 500 })
  }
}