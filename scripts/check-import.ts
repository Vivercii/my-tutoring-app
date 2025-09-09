import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImport() {
  try {
    // Count all questions
    const totalCount = await prisma.questionBankItem.count()
    
    // Count internal questions
    const internalCount = await prisma.questionBankItem.count({
      where: { isInternal: true }
    })
    
    // Count active questions
    const activeCount = await prisma.questionBankItem.count({
      where: { isActive: true }
    })
    
    // Get sample internal questions with creation time
    const sampleInternal = await prisma.questionBankItem.findMany({
      where: { isInternal: true },
      take: 10,
      select: {
        id: true,
        questionText: true,
        metadata: true,
        createdAt: true,
        domain: {
          select: { name: true, code: true }
        },
        skill: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('\n=== Question Bank Import Status ===')
    console.log(`Total Questions: ${totalCount}`)
    console.log(`Internal Questions (bulk import): ${internalCount}`)
    console.log(`Active Questions: ${activeCount}`)
    
    if (sampleInternal.length > 0) {
      console.log('\n=== Sample Recently Imported Questions ===')
      sampleInternal.forEach((q, i) => {
        console.log(`\n${i + 1}. ${q.questionText.substring(0, 100)}...`)
        console.log(`   Created: ${q.createdAt.toISOString()}`)
        if (q.domain && q.skill) {
          console.log(`   Domain: ${q.domain.code} - ${q.domain.name}`)
          console.log(`   Skill: ${q.skill.name}`)
        }
        if (q.metadata && typeof q.metadata === 'object' && 'source' in q.metadata) {
          console.log(`   Source: ${(q.metadata as any).source}`)
        }
      })
    }
    
  } catch (error) {
    console.error('Error checking import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkImport()