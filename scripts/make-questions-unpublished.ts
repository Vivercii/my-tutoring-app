import { prisma } from '@/lib/prisma'

async function makeQuestionsUnpublished() {
  try {
    console.log('[UNPUBLISH] Converting internal questions to unpublished questions...')
    
    // Find all internal questions from bulk import
    const internalQuestions = await prisma.questionBankItem.findMany({
      where: { 
        isInternal: true
      },
      select: {
        id: true,
        metadata: true
      }
    })
    
    console.log(`[UNPUBLISH] Found ${internalQuestions.length} internal questions to convert`)
    
    // Filter for batch imported questions
    const batchImportedQuestions = internalQuestions.filter(q => {
      if (!q.metadata) return false
      try {
        const metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
        return metadata.addedViaBatchImport === true
      } catch {
        return false
      }
    })
    
    console.log(`[UNPUBLISH] ${batchImportedQuestions.length} questions were from batch import`)
    
    if (batchImportedQuestions.length === 0) {
      console.log('[UNPUBLISH] No batch imported questions found to convert')
      return
    }
    
    // Update questions to be unpublished instead of internal
    console.log('[UNPUBLISH] Converting to unpublished questions...')
    
    const updateResult = await prisma.questionBankItem.updateMany({
      where: {
        id: {
          in: batchImportedQuestions.map(q => q.id)
        }
      },
      data: {
        isInternal: false,  // Make them visible in main list
        isActive: false     // But mark as unpublished/draft
      }
    })
    
    console.log(`[UNPUBLISH] Successfully converted ${updateResult.count} questions`)
    
    // Verify the results
    const finalCounts = await prisma.$transaction([
      prisma.questionBankItem.count({ where: { isInternal: true } }),
      prisma.questionBankItem.count({ where: { isActive: false } }),
      prisma.questionBankItem.count()
    ])
    
    console.log(`\\n[UNPUBLISH] Final counts:`)
    console.log(`- Internal questions: ${finalCounts[0]}`)
    console.log(`- Unpublished questions: ${finalCounts[1]}`)
    console.log(`- Total questions: ${finalCounts[2]}`)
    console.log(`\\nAll questions should now be visible in the main Questions list!`)
    console.log(`The bulk-imported questions will show as unpublished/draft status.`)
    
  } catch (error) {
    console.error('[UNPUBLISH] Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeQuestionsUnpublished()