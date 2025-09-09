import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanExams() {
  console.log('🧹 Cleaning up existing Bluebook exams...')
  
  // Delete all Bluebook Practice Test exams
  const deleted = await prisma.exam.deleteMany({
    where: {
      title: {
        contains: 'SAT Practice Test'
      }
    }
  })
  
  console.log(`✅ Deleted ${deleted.count} exams`)
  
  await prisma.$disconnect()
}

cleanExams().catch(console.error)