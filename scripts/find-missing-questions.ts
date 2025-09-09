import { prisma } from '@/lib/prisma'

async function findMissingQuestions() {
  try {
    console.log('[FIND-MISSING] Analyzing missing questions from batch import...')
    
    // Get all internal questions that were bulk imported
    const allInternalQuestions = await prisma.questionBankItem.findMany({
      where: { 
        isInternal: true
      },
      select: {
        id: true,
        questionText: true,
        createdAt: true,
        metadata: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`[FIND-MISSING] Total internal questions: ${allInternalQuestions.length}`)
    
    if (allInternalQuestions.length > 0) {
      console.log(`[FIND-MISSING] Sample metadata structure:`)
      console.log(JSON.stringify(allInternalQuestions[0].metadata, null, 2))
    }
    
    // Filter for batch imported questions
    const importedQuestions = allInternalQuestions.filter(q => {
      if (!q.metadata) return false
      try {
        // Parse JSON string metadata
        const metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
        return metadata.addedViaBatchImport === true
      } catch {
        return false
      }
    })
    
    console.log(`[FIND-MISSING] Found ${importedQuestions.length} imported internal questions`)
    
    // Check the metadata for import status
    let successfulImports = 0
    let failedImports = 0
    let statusCounts: Record<string, number> = {}
    
    importedQuestions.forEach((q) => {
      try {
        const metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
        if (metadata && typeof metadata === 'object' && metadata.status) {
          statusCounts[metadata.status] = (statusCounts[metadata.status] || 0) + 1
          if (metadata.status === 'INTERNAL_DRAFT') {
            successfulImports++
          } else {
            failedImports++
          }
        }
      } catch {
        failedImports++
      }
    })
    
    console.log(`[FIND-MISSING] Import status breakdown:`)
    console.log(`- Successful imports: ${successfulImports}`)
    console.log(`- Failed imports: ${failedImports}`)
    console.log(`- Status counts:`, statusCounts)
    
    // Show timestamps to understand import batches
    if (importedQuestions.length > 0) {
      const firstImport = importedQuestions[importedQuestions.length - 1].createdAt
      const lastImport = importedQuestions[0].createdAt
      console.log(`[FIND-MISSING] Import time range:`)
      console.log(`- First import: ${firstImport.toISOString()}`)
      console.log(`- Last import: ${lastImport.toISOString()}`)
      
      // Show a few examples of different batches
      console.log(`\\n[FIND-MISSING] Sample questions by time:`)
      
      // Group by creation time (rounded to nearest minute)
      const byMinute = importedQuestions.reduce((acc, q) => {
        const minute = new Date(q.createdAt)
        minute.setSeconds(0, 0)
        const key = minute.toISOString()
        if (!acc[key]) acc[key] = []
        acc[key].push(q)
        return acc
      }, {} as Record<string, typeof importedQuestions>)
      
      const minuteKeys = Object.keys(byMinute).sort().reverse()
      
      minuteKeys.slice(0, 5).forEach((minute, i) => {
        const questions = byMinute[minute]
        console.log(`${i + 1}. ${minute}: ${questions.length} questions`)
        if (questions[0]) {
          console.log(`   Sample: ${questions[0].questionText.substring(0, 80)}...`)
        }
      })
    }
    
    // Based on user's message, they expected 555 questions but only got 526
    // This suggests 29 questions failed to import
    console.log(`\\n[FIND-MISSING] Expected vs Actual:`)
    console.log(`- Expected: 555 questions`)
    console.log(`- Actually imported: ${importedQuestions.length}`)
    console.log(`- Missing: ${555 - importedQuestions.length}`)
    
    if (555 - importedQuestions.length !== 0) {
      console.log(`\\n[FIND-MISSING] The missing questions likely failed during:`)
      console.log(`1. CSV parsing - malformed data`)
      console.log(`2. AI classification - classification timeout or error`)
      console.log(`3. Database save - validation errors`)
      console.log(`\\nTo identify specific failed questions, check the batch-classify-and-save logs for errors.`)
    }
    
  } catch (error) {
    console.error('[FIND-MISSING] Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findMissingQuestions()