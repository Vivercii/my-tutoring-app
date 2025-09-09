/**
 * Parse TSV data that may contain multi-line cells (cells with newlines)
 * This handles the oneprep.xyz format where HTML content contains newlines
 */
export function parseTSVWithMultilineCells(data: string): string[][] {
  const rows: string[][] = []
  const lines = data.split('\n')
  
  let currentRow: string[] = []
  let currentCell = ''
  let cellCount = 0
  let inQuotes = false
  let expectedColumns = 15 // oneprep.xyz format has 15 columns
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // If we're starting a new row and it looks like a URL (new question)
    if (!inQuotes && line.startsWith('http')) {
      // Save previous row if it exists
      if (currentRow.length > 0 || currentCell) {
        if (currentCell) {
          currentRow.push(currentCell)
          currentCell = ''
        }
        if (currentRow.length > 0) {
          rows.push(currentRow)
        }
      }
      // Start new row
      currentRow = []
      cellCount = 0
    }
    
    // Check if this line has tabs (likely a complete or partial row)
    const tabCount = (line.match(/\t/g) || []).length
    
    if (tabCount > 0 || cellCount === 0) {
      // This line contains cell data
      const cells = line.split('\t')
      
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j]
        
        // Check if cell starts with a quote
        if (cell.startsWith('"') && !cell.endsWith('"')) {
          inQuotes = true
          currentCell = cell.substring(1) // Remove opening quote
        } else if (inQuotes && cell.endsWith('"')) {
          inQuotes = false
          currentCell += '\n' + cell.substring(0, cell.length - 1) // Remove closing quote
          currentRow.push(currentCell)
          currentCell = ''
          cellCount++
        } else if (inQuotes) {
          // We're in the middle of a quoted cell
          currentCell += '\n' + cell
        } else {
          // Normal cell or continuation
          if (j === 0 && cellCount < expectedColumns && !line.startsWith('http')) {
            // This is likely a continuation of the previous cell
            if (currentRow.length > 0) {
              currentRow[currentRow.length - 1] += '\n' + cell
            } else if (currentCell) {
              currentCell += '\n' + cell
            }
          } else {
            // This is a new cell
            if (currentCell) {
              currentRow.push(currentCell)
              currentCell = ''
            }
            currentRow.push(cell.replace(/^"|"$/g, '')) // Remove surrounding quotes if any
            cellCount++
          }
        }
      }
    } else {
      // This line is a continuation of the previous cell (no tabs)
      if (currentRow.length > 0) {
        currentRow[currentRow.length - 1] += '\n' + line
      } else if (currentCell) {
        currentCell += '\n' + line
      }
    }
    
    // Check if we have a complete row
    if (currentRow.length >= expectedColumns) {
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      cellCount = 0
    }
  }
  
  // Don't forget the last row
  if (currentCell) {
    currentRow.push(currentCell)
  }
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }
  
  return rows
}

/**
 * Parse oneprep.xyz data format with multi-line HTML cells
 * Expected format: 15 columns with HTML content that may contain newlines
 */
export function parseOneprepData(data: string): string[][] {
  const rows: string[][] = []
  
  // Split into lines but keep track of which ones belong together
  const lines = data.split('\n')
  
  let currentRow: string[] = []
  let currentCell = ''
  let inCell = false
  let cellCount = 0
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    
    // Skip empty lines at the start
    if (!line.trim() && currentRow.length === 0) continue
    
    // Check if this line starts a new question (starts with http)
    if (line.startsWith('http://') || line.startsWith('https://')) {
      // Save previous row if complete
      if (currentRow.length >= 13) {
        // Pad to 15 columns if needed
        while (currentRow.length < 15) {
          currentRow.push('')
        }
        rows.push(currentRow)
      }
      
      // Start new row - this line contains the full row with tabs
      const tabSplit = line.split('\t')
      
      // Process the tab-separated values, merging multi-line cells
      currentRow = []
      currentCell = ''
      inCell = false
      
      for (let i = 0; i < tabSplit.length; i++) {
        const cellValue = tabSplit[i]
        
        // Check if we're starting a multi-line HTML cell
        if (cellValue.includes('<') && !cellValue.includes('>')) {
          // Start of HTML that continues on next line
          currentCell = cellValue
          inCell = true
        } else if (inCell) {
          // Continue building multi-line cell
          currentCell += '\t' + cellValue
          // Check if this closes the HTML
          if (cellValue.includes('>')) {
            currentRow.push(currentCell)
            currentCell = ''
            inCell = false
          }
        } else {
          // Complete cell
          currentRow.push(cellValue)
        }
      }
      
      // If we have a cell in progress, it continues on the next line
      if (currentCell) {
        inCell = true
      }
      
    } else if (inCell || (currentRow.length > 0 && currentRow.length < 15)) {
      // This line is a continuation of the current row
      const tabSplit = line.split('\t')
      
      for (let i = 0; i < tabSplit.length; i++) {
        const cellValue = tabSplit[i]
        
        if (inCell) {
          // Add to current cell
          currentCell += '\n' + cellValue
          
          // Check if this completes the cell
          // For HTML cells, look for closing tags or next cell pattern
          if ((currentRow.length === 2 && i === tabSplit.length - 1) || // Question HTML ends
              (currentRow.length >= 4 && currentRow.length <= 11 && cellValue.includes('</')) || // Choice HTML ends
              (currentRow.length === 12 && cellValue.match(/^[A-D]$/)) || // Found correct answer
              (i > 0 && !cellValue.includes('<'))) { // Next cell doesn't have HTML
            currentRow.push(currentCell)
            currentCell = ''
            inCell = false
          }
        } else {
          // New cell
          if (cellValue.includes('<') && !cellValue.includes('</')) {
            // Start of multi-line HTML
            currentCell = cellValue
            inCell = true
          } else {
            // Complete cell
            currentRow.push(cellValue)
          }
        }
      }
    }
  }
  
  // Don't forget the last row
  if (currentRow.length >= 13) {
    while (currentRow.length < 15) {
      currentRow.push('')
    }
    rows.push(currentRow)
  }
  
  // Debug output
  console.log(`Parsed ${rows.length} questions from oneprep format`)
  if (rows.length > 0) {
    console.log('First row columns:', rows[0].length)
    console.log('Sample first row URL:', rows[0][0]?.substring(0, 50))
    console.log('Sample first row Question HTML:', rows[0][2]?.substring(0, 100))
  }
  
  return rows
}