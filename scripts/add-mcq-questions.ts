import { PrismaClient, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Find a published exam to add questions to
    const exam = await prisma.exam.findFirst({
      where: { isPublished: true },
      include: {
        sections: {
          include: {
            modules: true
          }
        }
      }
    })

    if (!exam) {
      console.log('No published exam found. Please publish an exam first.')
      return
    }

    console.log(`Adding MCQ questions to exam: ${exam.title}`)

    // Get the first section and module
    const section = exam.sections[0]
    const module = section?.modules[0]

    if (!module) {
      console.log('No module found in the exam')
      return
    }

    // Get existing questions count to determine starting order
    const existingQuestions = await prisma.examQuestion.count({
      where: { moduleId: module.id }
    })
    console.log(`Module already has ${existingQuestions} questions`)

    // Create sample MCQ questions with timestamp for uniqueness
    const timestamp = Date.now()
    const mcqQuestions = [
      {
        questionCode: `SAT-M-MCQ-${timestamp}-001`,
        questionText: 'If $x + 5 = 12$, what is the value of $2x - 3$?',
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        topic: 'Algebra',
        subtopic: 'Linear Equations',
        points: 1,
        correctAnswer: 'option2',
        options: [
          { text: '7', isCorrect: false },
          { text: '11', isCorrect: true },
          { text: '14', isCorrect: false },
          { text: '17', isCorrect: false }
        ]
      },
      {
        questionCode: `SAT-M-MCQ-${timestamp}-002`,
        questionText: 'A circle has a radius of 6 units. What is the area of the circle? (Use $\\pi \\approx 3.14$)',
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        topic: 'Geometry',
        subtopic: 'Circles',
        points: 1,
        correctAnswer: 'option3',
        options: [
          { text: '18.84 square units', isCorrect: false },
          { text: '37.68 square units', isCorrect: false },
          { text: '113.04 square units', isCorrect: true },
          { text: '226.08 square units', isCorrect: false }
        ]
      },
      {
        questionCode: `SAT-M-MCQ-${timestamp}-003`,
        questionText: 'Solve for $y$: $3y - 7 = 2y + 5$',
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        topic: 'Algebra',
        subtopic: 'Linear Equations',
        points: 1,
        correctAnswer: 'option1',
        options: [
          { text: '$y = 12$', isCorrect: true },
          { text: '$y = 2$', isCorrect: false },
          { text: '$y = -2$', isCorrect: false },
          { text: '$y = -12$', isCorrect: false }
        ]
      },
      {
        questionCode: `SAT-M-MCQ-${timestamp}-004`,
        questionText: 'What is the slope of the line passing through points $(2, 3)$ and $(6, 11)$?',
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        topic: 'Algebra',
        subtopic: 'Linear Functions',
        points: 1,
        correctAnswer: 'option2',
        options: [
          { text: '$\\frac{1}{2}$', isCorrect: false },
          { text: '$2$', isCorrect: true },
          { text: '$4$', isCorrect: false },
          { text: '$8$', isCorrect: false }
        ]
      },
      {
        questionCode: `SAT-M-MCQ-${timestamp}-005`,
        questionText: 'If $f(x) = x^2 + 3x - 4$, what is $f(2)$?',
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        topic: 'Algebra',
        subtopic: 'Functions',
        points: 1,
        correctAnswer: 'option3',
        options: [
          { text: '2', isCorrect: false },
          { text: '4', isCorrect: false },
          { text: '6', isCorrect: true },
          { text: '10', isCorrect: false }
        ]
      }
    ]

    // Add questions to the database
    let order = existingQuestions + 1
    for (const q of mcqQuestions) {
      // Create the question in the question bank
      const question = await prisma.questionBankItem.create({
        data: {
          questionCode: q.questionCode,
          questionText: q.questionText,
          questionType: q.questionType as QuestionType,
          difficulty: q.difficulty,
          topic: q.topic,
          subject: 'Math',
          program: 'SAT',
          points: q.points,
          options: {
            create: q.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect
            }))
          }
        },
        include: {
          options: true
        }
      })

      // Add question to the exam module
      await prisma.examQuestion.create({
        data: {
          moduleId: module.id,
          questionId: question.id,
          order: order++
        }
      })

      console.log(`✓ Added question: ${q.questionCode}`)
    }

    console.log(`\n✅ Successfully added ${mcqQuestions.length} MCQ questions to the exam!`)
    console.log(`Exam ID: ${exam.id}`)
    console.log(`You can now test the exam at: /dashboard/exams/${exam.id}/take`)

  } catch (error) {
    console.error('Error adding questions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()