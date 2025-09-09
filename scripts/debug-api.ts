import { prisma } from '@/lib/prisma'

async function debugAPI() {
  try {
    console.log('[DEBUG-API] Testing question-bank API query...')
    
    // Simulate the API query
    const where: any = {}
    
    // Add internal/non-internal conditions
    const showInternal = false
    if (showInternal) {
      where.isInternal = true
    } else {
      // For non-internal, use NOT equals true (which includes false and null)
      where.NOT = {
        isInternal: true
      }
    }
    
    console.log('[DEBUG-API] Where clause:', JSON.stringify(where, null, 2))
    
    const questions = await prisma.questionBankItem.findMany({
      where,
      include: {
        options: true,
        passage: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('[DEBUG-API] Query successful!')
    console.log('[DEBUG-API] Found', questions.length, 'questions')
    
    if (questions.length > 0) {
      console.log('[DEBUG-API] Sample question:')
      console.log('- ID:', questions[0].id)
      console.log('- Question:', questions[0].questionText.substring(0, 100) + '...')
      console.log('- isInternal:', questions[0].isInternal)
      console.log('- Options count:', questions[0].options?.length || 0)
    }
    
  } catch (error) {
    console.error('[DEBUG-API] Error:', error)
    console.error('[DEBUG-API] Error message:', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    await prisma.$disconnect()
  }
}

debugAPI()