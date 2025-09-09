import { PrismaClient, ModuleType, ModuleDifficulty, Program, ExamType, QuestionType } from '@prisma/client'
import { parse } from 'csv-parse'
import fs from 'fs'

const prisma = new PrismaClient()

interface CSVRow {
  URL: string
  Question: string
  Question_html: string
  'Question Type': string
  'Choice A': string
  'Choice B': string
  'Choice C': string
  'Choice D': string
  'Choice A_html': string
  'Choice B_html': string
  'Choice C_html': string
  'Choice D_html': string
  'Correct Answer': string
  Explaination: string
  Explaination_html: string
  Module: string
}

async function completeRemainingTests() {
  const csvPath = '/Users/kharisyeboah/Downloads/SAT Reading with Modules - oneprep_final_EN_with_module.csv'
  
  console.log('📖 Completing remaining SAT tests (4, 5, 6)...')
  console.log('=' + '='.repeat(60))
  
  // Read and parse CSV
  const fileContent = fs.readFileSync(csvPath, 'utf-8')
  
  const records = await new Promise<CSVRow[]>((resolve, reject) => {
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    }, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
  
  // Filter only Bluebook questions
  const bluebookQuestions = records.filter(row => 
    row.Module && row.Module.includes('Bluebook - SAT Practice')
  )
  
  // Process tests 4, 5, 6
  const testNumbers = [4, 5, 6]
  
  for (const testNum of testNumbers) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📚 Completing SAT Practice Test #${testNum}`)
    console.log('='.repeat(60))
    
    // Check existing status
    const existingExam = await prisma.exam.findFirst({
      where: { title: `SAT Practice Test #${testNum} - Complete` },
      include: {
        sections: {
          include: {
            modules: {
              include: {
                _count: { select: { questions: true } }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (existingExam) {
      const readingQuestions = existingExam.sections.find(s => s.title.includes('Reading'))?.modules.reduce((sum, m) => sum + m._count.questions, 0) || 0
      const mathQuestions = existingExam.sections.find(s => s.title === 'Math')?.modules.reduce((sum, m) => sum + m._count.questions, 0) || 0
      console.log(`  Current status: Reading=${readingQuestions}, Math=${mathQuestions}`)
      
      if (readingQuestions >= 81 && mathQuestions >= 44) {
        console.log(`  ✅ Test #${testNum} is already complete!`)
        continue
      }
    }
    
    // Filter questions for this test
    const testQuestions = bluebookQuestions.filter(row => 
      row.Module.includes(`SAT Practice #${testNum}`)
    )
    
    console.log(`  📊 Found ${testQuestions.length} Reading questions`)
    
    // Group questions by module
    const moduleGroups = new Map<string, CSVRow[]>()
    
    testQuestions.forEach(question => {
      const moduleInfo = question.Module
      
      let moduleKey: string
      if (moduleInfo.includes('Module 1')) {
        moduleKey = 'Module 1 - Routing'
      } else if (moduleInfo.includes('Module 2 - Easy')) {
        moduleKey = 'Module 2 - Easy'
      } else if (moduleInfo.includes('Module 2 - Hard')) {
        moduleKey = 'Module 2 - Hard'
      } else {
        return
      }
      
      if (!moduleGroups.has(moduleKey)) {
        moduleGroups.set(moduleKey, [])
      }
      moduleGroups.get(moduleKey)!.push(question)
    })
    
    // Create or get exam
    const examTitle = `SAT Practice Test #${testNum} - Complete`
    
    let exam = existingExam || await prisma.exam.create({
      data: {
        title: examTitle,
        description: `Official Bluebook SAT Practice Test #${testNum} - Complete Digital SAT (Math + Reading & Writing)`,
        program: Program.SAT,
        examType: ExamType.PRACTICE_TEST,
        examNumber: testNum,
        isPublished: true,
        subProgram: 'COMPLETE',
        tags: ['bluebook', 'official', 'adaptive', 'complete', 'math', 'reading'],
        timeLimit: 134,
        sections: {
          create: [
            { title: 'Reading and Writing', order: 1 },
            { title: 'Math', order: 2 }
          ]
        }
      },
      include: {
        sections: {
          include: { modules: true },
          orderBy: { order: 'asc' }
        }
      }
    })
    
    // Get Reading section
    let readingSection = exam.sections.find(s => s.title.includes('Reading'))!
    
    // Process each Reading module if needed
    for (const [moduleName, questions] of moduleGroups) {
      // Check if this module already has questions
      const moduleOrder = moduleName.includes('Module 1') ? 1 : 
                         moduleName.includes('Easy') ? 2 : 3
      const moduleDifficulty = moduleName.includes('Easy') ? ModuleDifficulty.EASY :
                               moduleName.includes('Hard') ? ModuleDifficulty.HARD : null
      
      const existingModule = await prisma.examModule.findFirst({
        where: {
          sectionId: readingSection.id,
          order: moduleOrder,
          difficulty: moduleDifficulty
        },
        include: {
          _count: { select: { questions: true } }
        }
      })
      
      if (existingModule && existingModule._count.questions >= questions.length) {
        console.log(`  ✓ Reading ${moduleName} already complete`)
        continue
      }
      
      console.log(`  📦 Processing Reading ${moduleName}...`)
      
      let module = existingModule || await prisma.examModule.create({
        data: {
          title: `Reading ${moduleName}`,
          order: moduleOrder,
          timeLimit: 32,
          moduleType: moduleName.includes('Module 1') ? ModuleType.ROUTING : ModuleType.ADAPTIVE,
          difficulty: moduleDifficulty,
          sectionId: readingSection.id
        }
      })
      
      // Clear and re-import questions
      await prisma.examQuestion.deleteMany({
        where: { moduleId: module.id }
      })
      
      let importedCount = 0
      let questionOrder = 1
      
      for (const questionData of questions) {
        try {
          const questionBankItem = await prisma.questionBankItem.upsert({
            where: {
              questionCode: questionData.URL || `bluebook-reading-${testNum}-${moduleName}-${questionOrder}`
            },
            update: {
              questionText: questionData.Question_html || questionData.Question,
              explanation: questionData.Explaination_html || questionData.Explaination,
            },
            create: {
              program: Program.SAT,
              subject: 'English',
              topic: 'Reading and Writing',
              difficulty: moduleDifficulty === ModuleDifficulty.HARD ? 'Hard' : 
                        moduleDifficulty === ModuleDifficulty.EASY ? 'Easy' : 'Medium',
              questionText: questionData.Question_html || questionData.Question,
              questionType: QuestionType.MULTIPLE_CHOICE,
              points: 1,
              explanation: questionData.Explaination_html || questionData.Explaination,
              questionCode: questionData.URL || `bluebook-reading-${testNum}-${moduleName}-${questionOrder}`,
              isActive: true,
              metadata: {
                source: 'Bluebook',
                examNumber: testNum,
                section: 'Reading and Writing',
                module: moduleName
              }
            }
          })
          
          // Create answer options
          if (questionData['Question Type'] === 'mcq') {
            await prisma.answerOption.deleteMany({
              where: { questionId: questionBankItem.id }
            })
            
            const choices = [
              { label: 'A', text: questionData['Choice A_html'] || questionData['Choice A'] },
              { label: 'B', text: questionData['Choice B_html'] || questionData['Choice B'] },
              { label: 'C', text: questionData['Choice C_html'] || questionData['Choice C'] },
              { label: 'D', text: questionData['Choice D_html'] || questionData['Choice D'] },
            ].filter(choice => choice.text && choice.text.trim())
            
            for (const choice of choices) {
              await prisma.answerOption.create({
                data: {
                  text: choice.text,
                  isCorrect: choice.label === questionData['Correct Answer'],
                  questionId: questionBankItem.id
                }
              })
            }
          }
          
          await prisma.examQuestion.create({
            data: {
              moduleId: module.id,
              questionId: questionBankItem.id,
              order: questionOrder
            }
          })
          
          importedCount++
          questionOrder++
          
          if (importedCount % 10 === 0) {
            process.stdout.write(`    Progress: ${importedCount}/${questions.length}\r`)
          }
        } catch (error: any) {
          console.error(`\n    ❌ Failed: ${error.message}`)
        }
      }
      
      console.log(`\n    ✅ Imported ${importedCount} questions`)
    }
    
    // Copy Math modules
    console.log(`\n  🔄 Adding Math modules...`)
    const mathOnlyExam = await prisma.exam.findFirst({
      where: { title: `SAT Practice Test #${testNum}` },
      include: {
        sections: {
          include: {
            modules: {
              include: {
                questions: {
                  include: { question: true }
                }
              }
            }
          }
        }
      }
    })
    
    if (mathOnlyExam && mathOnlyExam.sections[0]?.modules.length > 0) {
      let mathSection = exam.sections.find(s => s.title === 'Math')
      if (!mathSection) {
        mathSection = await prisma.examSection.create({
          data: { title: 'Math', order: 2, examId: exam.id }
        })
      }
      
      for (const sourceModule of mathOnlyExam.sections[0].modules) {
        const existingModule = await prisma.examModule.findFirst({
          where: {
            sectionId: mathSection.id,
            order: sourceModule.order,
            difficulty: sourceModule.difficulty
          }
        })
        
        if (!existingModule) {
          const newModule = await prisma.examModule.create({
            data: {
              title: sourceModule.title,
              order: sourceModule.order,
              timeLimit: sourceModule.timeLimit,
              moduleType: sourceModule.moduleType,
              difficulty: sourceModule.difficulty,
              sectionId: mathSection.id
            }
          })
          
          for (const examQuestion of sourceModule.questions) {
            await prisma.examQuestion.create({
              data: {
                moduleId: newModule.id,
                questionId: examQuestion.questionId,
                order: examQuestion.order
              }
            })
          }
          
          console.log(`    ✅ Added Math ${sourceModule.title}`)
        }
      }
    }
    
    console.log(`  🎉 Test #${testNum} complete!`)
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Final Status of All Complete Exams:')
  console.log('='.repeat(60))
  
  const allComplete = await prisma.exam.findMany({
    where: { title: { contains: 'Complete' } },
    include: {
      sections: {
        include: {
          modules: {
            include: {
              _count: { select: { questions: true } }
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { title: 'asc' }
  })
  
  for (const exam of allComplete) {
    console.log(`\n${exam.title}:`)
    let total = 0
    for (const section of exam.sections) {
      const sectionTotal = section.modules.reduce((sum, m) => sum + m._count.questions, 0)
      console.log(`  ${section.title}: ${sectionTotal} questions`)
      total += sectionTotal
    }
    console.log(`  TOTAL: ${total} questions`)
  }
}

completeRemainingTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })