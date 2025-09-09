import { prisma } from '../src/lib/prisma'

async function checkQuestions() {
  try {
    // First, let's see what questions look like
    const questions = await prisma.question.findMany({
      where: {
        examQuestions: {
          some: {
            module: {
              section: {
                OR: [
                  { title: { contains: 'Reading' } },
                  { title: { contains: 'English' } }
                ]
              }
            }
          }
        }
      },
      take: 5
    })
    
    console.log(`Found ${questions.length} Reading/English questions\n`)
    
    for (const q of questions) {
      console.log('=====================================')
      console.log('Question ID:', q.id)
      console.log('Question Code:', q.questionCode)
      console.log('\nQuestion Text:')
      console.log(q.questionText)
      console.log('\nPassage:')
      console.log(q.passage || 'NULL')
      console.log('=====================================\n')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkQuestions()