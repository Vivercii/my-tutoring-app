const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Get some questions
    const questions = await prisma.question.findMany({
      take: 3,
      where: {
        questionText: {
          contains: "Researchers and conservationists"
        }
      }
    })
    
    console.log('Found questions:', questions.length)
    
    for (const q of questions) {
      console.log('\n=====================================')
      console.log('ID:', q.id)
      console.log('Code:', q.questionCode)
      console.log('Type:', q.questionType)
      console.log('\nFull Question Text:')
      console.log(q.questionText)
      console.log('\nPassage field:')
      console.log(q.passage || 'EMPTY')
      console.log('=====================================')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()