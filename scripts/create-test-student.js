const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestStudent() {
  try {
    // Check if student already exists
    const existingStudent = await prisma.user.findUnique({
      where: { email: 'student@test.com' }
    })

    if (existingStudent) {
      console.log('Test student already exists')
      return
    }

    // Create test student
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        name: 'Test Student',
        hashedPassword,
        role: 'STUDENT',
        isActive: true
      }
    })

    console.log('Test student created successfully!')
    console.log('Email: student@test.com')
    console.log('Password: password123')
    
  } catch (error) {
    console.error('Error creating test student:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestStudent()