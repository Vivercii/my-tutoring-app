/**
 * Robust parser for oneprep.xyz data format with complex HTML
 * Handles multi-line HTML content with nested tags
 */

/**
 * Process a single oneprep question chunk into fields
 * This handles cases where tabs might be lost or converted to spaces
 */
function processOneprepQuestion(questionData: string): string[] {
  const row: string[] = []
  const lines = questionData.split('\n')
  
  // Extract URL from first line
  const urlMatch = lines[0].match(/^(https?:\/\/[^\s]+)/)
  if (!urlMatch) return []
  
  row.push(urlMatch[1]) // Field 0: URL
  
  // The rest of the first line after URL is the question text
  const afterUrl = lines[0].substring(urlMatch[1].length).trim()
  
  // Try to find where question text ends and HTML begins
  // Question text is usually a simple sentence, HTML starts with <div or <p
  const htmlStartPattern = /<(?:div|p|figure|table)/
  const htmlStartMatch = afterUrl.match(htmlStartPattern)
  
  if (htmlStartMatch && htmlStartMatch.index) {
    // Split question text from HTML
    row.push(afterUrl.substring(0, htmlStartMatch.index).trim()) // Field 1: Question text
    
    // Start building HTML from the rest
    let questionHtml = afterUrl.substring(htmlStartMatch.index)
    
    // Continue adding lines until we find "mcq"
    let foundMcq = false
    for (let i = 1; i < lines.length && !foundMcq; i++) {
      const line = lines[i]
      if (line.includes('mcq') || line.includes('MULTIPLE_CHOICE')) {
        // This line contains mcq and subsequent fields
        const mcqIndex = line.indexOf('mcq')
        if (mcqIndex > 0) {
          questionHtml += '\n' + line.substring(0, mcqIndex).trim()
        }
        row.push(questionHtml.trim()) // Field 2: Question HTML
        row.push('mcq') // Field 3: Question Type
        
        // Parse remaining fields from this and subsequent lines
        const remainingText = line.substring(mcqIndex + 3).trim()
        const remainingFields = remainingText.split(/\s{2,}|\t/) // Split by multiple spaces or tabs
        
        for (const field of remainingFields) {
          if (row.length < 15) {
            row.push(field.trim())
          }
        }
        foundMcq = true
      } else {
        questionHtml += '\n' + line
      }
    }
    
    // If we didn't find mcq, try to extract what we can
    if (!foundMcq && questionHtml) {
      row.push(questionHtml.trim())
      row.push('mcq') // Default type
    }
  } else {
    // No clear HTML start, try to parse as best we can
    row.push(afterUrl) // Assume it's all question text
    row.push('') // Empty HTML
    row.push('mcq') // Default type
  }
  
  // Ensure we have at least 15 fields
  while (row.length < 15) {
    row.push('')
  }
  
  return row
}

export function parseOneprepFormatV2(rawData: string): string[][] {
  const rows: string[][] = []
  
  // First, let's check what delimiter is being used
  const firstLine = rawData.split('\n')[0] || ''
  const hasRealTabs = firstLine.includes('\t')
  
  console.log(`[oneprep-parser-v2] First line sample: "${firstLine.substring(0, 100)}"`)
  console.log(`[oneprep-parser-v2] Has real tabs: ${hasRealTabs}`)
  
  // If no tabs, the data might have been corrupted during paste
  // Try to detect if spaces are being used as delimiters
  if (!hasRealTabs && firstLine.includes('http')) {
    console.log(`[oneprep-parser-v2] No tabs detected. Data may need manual re-formatting.`)
    
    // Try a different approach - look for the pattern of oneprep data
    // URL [space/tab] Question text [space/tab] Question HTML...
    
    // For now, let's try to parse assuming the data structure we know
    const lines = rawData.split('\n')
    let currentQuestion: string[] = []
    let inQuestion = false
    
    for (const line of lines) {
      if (line.startsWith('http')) {
        // Save previous question if exists
        if (currentQuestion.length > 0) {
          // Process the accumulated question data
          const processedRow = processOneprepQuestion(currentQuestion.join('\n'))
          if (processedRow.length >= 13) {
            rows.push(processedRow)
          }
        }
        // Start new question
        currentQuestion = [line]
        inQuestion = true
      } else if (inQuestion) {
        currentQuestion.push(line)
      }
    }
    
    // Don't forget last question
    if (currentQuestion.length > 0) {
      const processedRow = processOneprepQuestion(currentQuestion.join('\n'))
      if (processedRow.length >= 13) {
        rows.push(processedRow)
      }
    }
    
    console.log(`[oneprep-parser-v2] Parsed ${rows.length} questions without tabs`)
    return rows
  }
  
  // Original tab-based parsing
  // Each question starts with a URL on a new line
  // Split by URLs but keep the URL in each chunk
  const questionChunks = rawData.split(/(?=^https?:\/\/)/gm).filter(chunk => chunk.trim())
  
  console.log(`[oneprep-parser-v2] Found ${questionChunks.length} question chunks`)
  
  for (let chunkIndex = 0; chunkIndex < questionChunks.length; chunkIndex++) {
    const chunk = questionChunks[chunkIndex]
    
    // Find the first line with the URL and initial fields
    const lines = chunk.split('\n')
    const firstLine = lines[0]
    
    // The first line should have URL and question text
    const firstLineFields = firstLine.split('\t')
    
    if (firstLineFields.length < 3) {
      console.log(`[oneprep-parser-v2] Chunk ${chunkIndex}: First line has only ${firstLineFields.length} fields`)
      console.log(`[oneprep-parser-v2] First field: "${firstLineFields[0]?.substring(0, 50)}"`)
      console.log(`[oneprep-parser-v2] Trying alternative parsing...`)
      
      // Try to parse the entire chunk as one question
      const processedRow = processOneprepQuestion(chunk)
      if (processedRow.length >= 13) {
        rows.push(processedRow)
      }
      continue
    }
    
    const row: string[] = []
    
    // Field 0: URL
    row.push(firstLineFields[0])
    
    // Field 1: Question text (plain)
    row.push(firstLineFields[1] || '')
    
    // Field 2: Question HTML (complex, multi-line)
    // This starts in firstLineFields[2] and continues until we find "mcq"
    let questionHtml = firstLineFields[2] || ''
    let currentLineIndex = 1
    let foundQuestionType = false
    
    // If the first line already has "mcq" in a later field, we know where HTML ends
    const mcqIndex = firstLineFields.findIndex(f => f === 'mcq' || f === 'MULTIPLE_CHOICE')
    if (mcqIndex > 2) {
      // Question HTML is complete in firstLineFields[2]
      row.push(questionHtml)
      
      // Field 3: Question Type
      row.push(firstLineFields[mcqIndex])
      
      // Process remaining fields from first line
      for (let i = mcqIndex + 1; i < firstLineFields.length && row.length < 15; i++) {
        row.push(firstLineFields[i] || '')
      }
      foundQuestionType = true
    } else {
      // Question HTML spans multiple lines
      // Continue reading lines until we find one with "mcq"
      while (currentLineIndex < lines.length && !foundQuestionType) {
        const line = lines[currentLineIndex]
        
        // Check if this line contains "mcq" (question type)
        if (line.includes('\tmcq') || line.includes('mcq\t')) {
          // This line has the rest of the fields
          const lineFields = line.split('\t')
          
          // Find where mcq appears
          const mcqFieldIndex = lineFields.findIndex(f => f === 'mcq' || f === 'MULTIPLE_CHOICE')
          
          if (mcqFieldIndex >= 0) {
            // Everything before mcq is part of question HTML
            if (mcqFieldIndex > 0) {
              questionHtml += '\n' + lineFields.slice(0, mcqFieldIndex).join('\t')
            }
            
            row.push(questionHtml)
            row.push('mcq') // Question type
            
            // Add remaining fields from this line
            for (let i = mcqFieldIndex + 1; i < lineFields.length && row.length < 15; i++) {
              row.push(lineFields[i] || '')
            }
            foundQuestionType = true
          } else {
            // mcq is in the line but not as a separate field, keep as part of HTML
            questionHtml += '\n' + line
          }
        } else {
          // This line is part of question HTML
          questionHtml += '\n' + line
        }
        currentLineIndex++
      }
      
      // If we didn't find question type, this chunk is invalid
      if (!foundQuestionType) {
        console.log(`[oneprep-parser-v2] Chunk ${chunkIndex}: Could not find question type, skipping`)
        continue
      }
    }
    
    // Continue processing remaining lines for other fields if needed
    while (currentLineIndex < lines.length && row.length < 15) {
      const line = lines[currentLineIndex]
      const lineFields = line.split('\t')
      
      for (const field of lineFields) {
        if (row.length < 15) {
          row.push(field || '')
        }
      }
      currentLineIndex++
    }
    
    // Ensure we have exactly 15 fields
    while (row.length < 15) {
      row.push('')
    }
    
    // Validate the row has essential fields
    if (row[0].startsWith('http') && row[2]) {
      rows.push(row.slice(0, 15)) // Only keep first 15 fields
      
      if (chunkIndex === 0) {
        console.log(`[oneprep-parser-v2] First question parsed:`)
        console.log(`  URL: ${row[0].substring(0, 50)}`)
        console.log(`  Question text: ${row[1].substring(0, 50)}`)
        console.log(`  Question HTML length: ${row[2].length} chars`)
        console.log(`  Question type: ${row[3]}`)
        console.log(`  Correct answer: ${row[12]}`)
      }
    }
  }
  
  console.log(`[oneprep-parser-v2] Successfully parsed ${rows.length} questions`)
  return rows
}

/**
 * Clean and process option HTML from oneprep format
 */
function cleanOptionHtml(html: string): string {
  if (!html) return ''
  
  // Remove oneprep wrapper divs if present
  let cleaned = html
  const contentMatch = cleaned.match(/<div class="self-center">(.*?)<\/div>/s)
  if (contentMatch) {
    cleaned = contentMatch[1]
  }
  
  return cleaned.trim()
}

/**
 * Alternative approach using state machine for more precise parsing
 */
export function parseOneprepStateMachine(rawData: string): string[][] {
  const rows: string[][] = []
  const lines = rawData.split('\n')
  
  let currentRow: string[] = []
  let currentField = ''
  let state: 'START' | 'IN_QUESTION_HTML' | 'AFTER_QUESTION_HTML' | 'IN_CHOICE_HTML' | 'COMPLETE' = 'START'
  let htmlDepth = 0 // Track HTML tag nesting depth
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    
    if (state === 'START') {
      // Looking for a line that starts with URL
      if (line.match(/^https?:\/\//)) {
        // Save previous row if exists
        if (currentRow.length >= 13) {
          while (currentRow.length < 15) currentRow.push('')
          rows.push(currentRow)
        }
        
        // Start new row
        currentRow = []
        currentField = ''
        
        const fields = line.split('\t')
        
        // Field 0: URL
        currentRow.push(fields[0])
        
        // Field 1: Question text
        currentRow.push(fields[1] || '')
        
        // Field 2: Start of Question HTML
        if (fields[2]) {
          currentField = fields[2]
          // Count opening and closing tags
          const openTags = (currentField.match(/<[^/>][^>]*>/g) || []).length
          const closeTags = (currentField.match(/<\/[^>]+>/g) || []).length
          htmlDepth = openTags - closeTags
          
          if (htmlDepth > 0 || !fields[3]) {
            state = 'IN_QUESTION_HTML'
          } else {
            // HTML is complete
            currentRow.push(currentField)
            currentField = ''
            
            // Process remaining fields
            for (let i = 3; i < fields.length && currentRow.length < 15; i++) {
              currentRow.push(fields[i] || '')
            }
            
            if (currentRow.length >= 15) {
              state = 'COMPLETE'
            } else {
              state = 'AFTER_QUESTION_HTML'
            }
          }
        } else {
          state = 'IN_QUESTION_HTML'
        }
      }
    } else if (state === 'IN_QUESTION_HTML') {
      // Building up question HTML
      if (line.includes('\tmcq') || line.includes('\tMULTIPLE_CHOICE')) {
        // Found the end of question HTML
        const parts = line.split(/\t(?=mcq|MULTIPLE_CHOICE)/)
        
        // Add the part before mcq to HTML
        if (parts[0]) {
          currentField += '\n' + parts[0]
        }
        
        // Save question HTML
        currentRow.push(currentField)
        currentField = ''
        
        // Parse the rest of the line starting with mcq
        const remainingFields = parts[1].split('\t')
        for (const field of remainingFields) {
          if (currentRow.length < 15) {
            currentRow.push(field || '')
          }
        }
        
        state = currentRow.length >= 15 ? 'COMPLETE' : 'AFTER_QUESTION_HTML'
      } else {
        // Still in question HTML
        currentField += '\n' + line
        
        // Update HTML depth
        const openTags = (line.match(/<[^/>][^>]*>/g) || []).length
        const closeTags = (line.match(/<\/[^>]+>/g) || []).length
        htmlDepth += openTags - closeTags
        
        // Check if HTML might be complete based on closing tags
        if (htmlDepth <= 0 && line.includes('</div>')) {
          // Next line might have mcq
          // Don't change state yet, let next iteration handle it
        }
      }
    } else if (state === 'AFTER_QUESTION_HTML') {
      // Collecting remaining fields
      const fields = line.split('\t')
      for (const field of fields) {
        if (currentRow.length < 15) {
          currentRow.push(field || '')
        }
      }
      
      if (currentRow.length >= 15) {
        state = 'COMPLETE'
      }
    } else if (state === 'COMPLETE') {
      // Wait for next question URL
      if (line.match(/^https?:\/\//)) {
        // Process this line as a new question
        state = 'START'
        lineIndex-- // Reprocess this line
      }
    }
  }
  
  // Don't forget the last row
  if (currentRow.length >= 13) {
    while (currentRow.length < 15) currentRow.push('')
    rows.push(currentRow)
  }
  
  console.log(`[oneprep-state-machine] Parsed ${rows.length} questions`)
  return rows
}