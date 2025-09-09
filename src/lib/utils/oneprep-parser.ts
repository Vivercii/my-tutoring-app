/**
 * Specialized parser for oneprep.xyz data format
 * This format has 15 tab-separated columns with HTML that spans multiple lines
 */

export function parseOneprepFormat(rawData: string): string[][] {
  const rows: string[][] = []
  const lines = rawData.split('\n')
  
  let currentRow: string[] = []
  let currentField = ''
  let fieldIndex = 0
  let inHTMLField = false
  
  // Track the expected structure
  const expectedFields = 15
  const htmlFieldIndices = [2, 8, 9, 10, 11, 14] // Columns that typically contain HTML
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // New row starts with a URL
    if (line.match(/^https?:\/\//)) {
      // Save previous row if it exists
      if (currentRow.length > 0) {
        // Ensure we have all fields
        while (currentRow.length < expectedFields) {
          currentRow.push('')
        }
        if (currentRow.length >= 13) { // Minimum valid fields
          rows.push(currentRow)
        }
      }
      
      // Start processing new row
      currentRow = []
      currentField = ''
      fieldIndex = 0
      inHTMLField = false
      
      // Split by tabs
      const fields = line.split('\t')
      
      for (let j = 0; j < fields.length; j++) {
        const field = fields[j]
        
        // Check if this is an HTML field that might span lines
        if (htmlFieldIndices.includes(fieldIndex) && field.includes('<')) {
          // Check if the HTML is complete (has closing tags)
          const hasOpenTag = (field.match(/</g) || []).length
          const hasCloseTag = (field.match(/>/g) || []).length
          
          if (hasOpenTag > hasCloseTag) {
            // HTML continues on next line
            currentField = field
            inHTMLField = true
          } else {
            // Complete HTML field
            currentRow.push(field)
            fieldIndex++
          }
        } else {
          // Regular field
          currentRow.push(field)
          fieldIndex++
        }
      }
    } else if (currentRow.length > 0) {
      // Continuation line
      if (inHTMLField) {
        // Add to current HTML field
        currentField += '\n' + line
        
        // Check if HTML is now complete
        const hasCloseTag = line.includes('>') || line.includes('/>')
        const nextFieldPattern = /\t(mcq|MULTIPLE_CHOICE|[A-D]\t|[A-D]$)/
        
        if (hasCloseTag || nextFieldPattern.test(line)) {
          // HTML field is complete
          const parts = currentField.split('\t')
          if (parts.length > 1) {
            // The field ended and new fields started on this line
            currentRow.push(parts[0])
            fieldIndex++
            
            // Process remaining parts
            for (let k = 1; k < parts.length; k++) {
              if (htmlFieldIndices.includes(fieldIndex) && parts[k].includes('<')) {
                currentField = parts[k]
                inHTMLField = true
              } else {
                currentRow.push(parts[k])
                fieldIndex++
                inHTMLField = false
              }
            }
          } else {
            currentRow.push(currentField)
            currentField = ''
            fieldIndex++
            inHTMLField = false
          }
        }
      } else if (line.includes('\t')) {
        // Line has tabs, process as fields
        const fields = line.split('\t')
        for (const field of fields) {
          if (fieldIndex < expectedFields) {
            if (htmlFieldIndices.includes(fieldIndex) && field.includes('<')) {
              const hasOpenTag = (field.match(/</g) || []).length
              const hasCloseTag = (field.match(/>/g) || []).length
              
              if (hasOpenTag > hasCloseTag) {
                currentField = field
                inHTMLField = true
              } else {
                currentRow.push(field)
                fieldIndex++
              }
            } else {
              currentRow.push(field)
              fieldIndex++
            }
          }
        }
      } else {
        // Line without tabs - likely continuation of previous field
        if (fieldIndex > 0 && fieldIndex <= expectedFields) {
          // Append to the last field
          currentRow[currentRow.length - 1] += '\n' + line
        }
      }
    }
  }
  
  // Don't forget the last row
  if (currentRow.length > 0) {
    while (currentRow.length < expectedFields) {
      currentRow.push('')
    }
    if (currentRow.length >= 13) {
      rows.push(currentRow)
    }
  }
  
  // Debug logging
  console.log(`[oneprep-parser] Parsed ${rows.length} complete rows`)
  if (rows.length > 0) {
    console.log(`[oneprep-parser] First row has ${rows[0].length} columns`)
    console.log(`[oneprep-parser] Sample URL: ${rows[0][0]?.substring(0, 40)}`)
    console.log(`[oneprep-parser] Sample Question HTML: ${rows[0][2]?.substring(0, 50)}...`)
    console.log(`[oneprep-parser] Question Type: ${rows[0][3]}`)
    console.log(`[oneprep-parser] Correct Answer: ${rows[0][12]}`)
  }
  
  return rows
}

/**
 * Alternative approach: Use regex patterns to identify field boundaries
 */
export function parseOneprepWithPatterns(rawData: string): string[][] {
  const rows: string[][] = []
  
  // Each question starts with a URL and ends before the next URL
  const questionBlocks = rawData.split(/(?=^https?:\/\/)/gm).filter(block => block.trim())
  
  for (const block of questionBlocks) {
    const row: string[] = []
    
    // Extract URL (field 0)
    const urlMatch = block.match(/^(https?:\/\/[^\t\n]+)/)
    if (!urlMatch) continue
    row.push(urlMatch[1])
    
    // The rest of the content after URL
    const afterUrl = block.substring(urlMatch[0].length)
    
    // Split by tabs but be careful with multiline fields
    const segments = afterUrl.split('\t')
    let currentField = ''
    let inMultiline = false
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim()
      
      // Field 1: Question text (plain)
      if (row.length === 1) {
        // Question text is usually plain, single line
        const lines = segment.split('\n')
        row.push(lines[0])
        
        // If there's more content, it's the start of Question HTML
        if (lines.length > 1) {
          currentField = lines.slice(1).join('\n')
          inMultiline = true
        }
      }
      // Field 2: Question HTML (can be multiline)
      else if (row.length === 2) {
        if (inMultiline) {
          currentField += '\t' + segment
          // Check if we've reached the question type field
          if (segment === 'mcq' || segment.includes('MULTIPLE_CHOICE')) {
            // Split off the question type
            const parts = currentField.split(/\t(?=mcq|MULTIPLE_CHOICE)/)
            row.push(parts[0]) // Question HTML
            row.push(parts[1] || 'mcq') // Question Type
            currentField = ''
            inMultiline = false
          }
        } else if (segment === 'mcq' || segment.includes('MULTIPLE_CHOICE')) {
          row.push('') // Empty Question HTML
          row.push(segment) // Question Type
        } else {
          currentField = segment
          inMultiline = true
        }
      }
      // Field 3: Question Type
      else if (row.length === 3) {
        if (segment === 'mcq' || segment.includes('MULTIPLE_CHOICE')) {
          row.push(segment)
        } else {
          row.push('mcq') // Default
          row.push(segment) // This is actually Choice A
        }
      }
      // Fields 4-7: Choice A-D text
      else if (row.length >= 4 && row.length <= 7) {
        row.push(segment.split('\n')[0]) // Take first line only
      }
      // Fields 8-11: Choice A-D HTML (can be multiline)
      else if (row.length >= 8 && row.length <= 11) {
        if (segment.includes('<')) {
          row.push(segment)
        } else {
          row.push('')
        }
      }
      // Field 12: Correct Answer
      else if (row.length === 12) {
        // Look for single letter A-D
        const answerMatch = segment.match(/^[A-D]/)
        if (answerMatch) {
          row.push(answerMatch[0])
        } else {
          row.push('')
        }
      }
      // Fields 13-14: Explanation text and HTML
      else if (row.length >= 13 && row.length < 15) {
        row.push(segment)
      }
    }
    
    // Ensure we have 15 fields
    while (row.length < 15) {
      row.push('')
    }
    
    // Only add valid rows
    if (row[0].startsWith('http')) {
      rows.push(row)
    }
  }
  
  return rows
}