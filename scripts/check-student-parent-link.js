const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStudentParentLink() {
  const studentId = 'cmf11dwhs0000v68snmzi9ct6'
  const parentEmail = 'kharis.yeboah@gmail.com' // Adjust this to the actual parent email
  
  try {
    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true
      }
    })
    
    console.log('Student found:', student ? 'Yes' : 'No')
    if (student) {
      console.log('Student name:', student.name)
      console.log('Student has profile:', student.studentProfile ? 'Yes' : 'No')
      if (student.studentProfile) {
        console.log('Student profile ID:', student.studentProfile.id)
      }
    }
    
    // Check parent
    const parent = await prisma.user.findFirst({
      where: { 
        email: parentEmail,
        role: 'PARENT'
      },
      include: {
        managedStudents: {
          include: {
            studentProfile: {
              include: {
                student: true
              }
            }
          }
        }
      }
    })
    
    console.log('\nParent found:', parent ? 'Yes' : 'No')
    if (parent) {
      console.log('Parent name:', parent.name)
      console.log('Number of managed students:', parent.managedStudents.length)
      
      parent.managedStudents.forEach((ms, index) => {
        console.log(`\nManaged Student ${index + 1}:`)
        console.log('  Student Profile ID:', ms.studentProfileId)
        console.log('  Student ID:', ms.studentProfile.student.id)
        console.log('  Student Name:', ms.studentProfile.student.name)
        console.log('  Is Primary:', ms.isPrimary)
      })
      
      // Check if specific student is linked
      const isLinked = parent.managedStudents.some(
        ms => ms.studentProfile.student.id === studentId
      )
      console.log(`\nIs student ${studentId} linked to parent:`, isLinked ? 'Yes' : 'No')
    }
    
    // Check ParentStudent link directly
    if (student?.studentProfile) {
      const parentStudentLink = await prisma.parentStudent.findFirst({
        where: {
          studentProfileId: student.studentProfile.id
        },
        include: {
          parent: true
        }
      })
      
      console.log('\nDirect ParentStudent link found:', parentStudentLink ? 'Yes' : 'No')
      if (parentStudentLink) {
        console.log('Linked to parent:', parentStudentLink.parent.email)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStudentParentLink()