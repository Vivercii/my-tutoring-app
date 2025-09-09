import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  const examCount = await prisma.exam.count()
  const questionCount = await prisma.questionBankItem.count()
  const moduleCount = await prisma.examModule.count()
  
  console.log('📊 Current database state:')
  console.log(`  📚 Exams: ${examCount}`)
  console.log(`  ❓ Questions: ${questionCount}`)
  console.log(`  📦 Modules: ${moduleCount}`)
  
  // Check for Bluebook exams specifically
  const bluebookExams = await prisma.exam.findMany({
    where: {
      title: {
        contains: 'SAT Practice Test'
      }
    },
    include: {
      sections: {
        include: {
          modules: true
        }
      }
    }
  })
  
  if (bluebookExams.length > 0) {
    console.log('\n🎯 Bluebook Exams Found:')
    bluebookExams.forEach(exam => {
      console.log(`  - ${exam.title}`)
      exam.sections.forEach(section => {
        console.log(`    Section: ${section.title}`)
        section.modules.forEach(module => {
          console.log(`      - ${module.title || 'Module ' + module.order}`)
        })
      })
    })
  } else {
    console.log('\n❌ No Bluebook exams found in database')
  }
  
  await prisma.$disconnect()
}

checkDatabase().catch(console.error)