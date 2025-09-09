const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugExamData() {
  try {
    // The exam ID from the error
    const examId = 'cmf3v1m8e0000v6dbl8xopxja'
    
    console.log('🔍 Debugging Exam Data...\n')
    
    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            modules: {
              include: {
                questions: {
                  include: {
                    question: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            student: true
          }
        }
      }
    })
    
    if (!exam) {
      console.log('❌ Exam not found!')
      return
    }
    
    console.log('✅ Exam found:', exam.title)
    console.log('📊 Sections:', exam.sections.length)
    console.log('👥 Assignments:', exam.assignments.length)
    
    // Check assignments for test student
    const testStudentAssignment = exam.assignments.find(a => 
      a.student.email === 'student@test.com'
    )
    
    if (testStudentAssignment) {
      console.log('\n📋 Test Student Assignment:')
      console.log('  - Assignment ID:', testStudentAssignment.id)
      console.log('  - Status:', testStudentAssignment.status)
      console.log('  - Student ID:', testStudentAssignment.studentId)
      console.log('  - Student Email:', testStudentAssignment.student.email)
      
      // Check for any existing answers
      const existingAnswers = await prisma.studentAnswer.findMany({
        where: { assignmentId: testStudentAssignment.id },
        include: {
          examQuestion: {
            include: {
              question: true
            }
          }
        }
      })
      
      console.log('\n📝 Existing Answers:', existingAnswers.length)
      
      // Get first question for testing
      const firstQuestion = exam.sections[0]?.modules[0]?.questions[0]
      if (firstQuestion) {
        console.log('\n🎯 First Question:')
        console.log('  - ExamQuestion ID:', firstQuestion.id)
        console.log('  - Question ID:', firstQuestion.questionId)
        console.log('  - Question Text:', firstQuestion.question.questionText.substring(0, 100) + '...')
        
        // Check if there's an answer for this question
        const answerForFirstQuestion = existingAnswers.find(a => 
          a.examQuestionId === firstQuestion.id
        )
        
        if (answerForFirstQuestion) {
          console.log('  - Has Answer:', true)
          console.log('  - Submitted Answer:', answerForFirstQuestion.submittedAnswer)
        } else {
          console.log('  - Has Answer:', false)
        }
      }
    } else {
      console.log('\n❌ No assignment found for test student')
      console.log('Available assignments for:')
      exam.assignments.forEach(a => {
        console.log('  -', a.student.email, '(ID:', a.id, ')')
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugExamData()