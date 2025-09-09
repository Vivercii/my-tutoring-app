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

async function importBluebookReadingTests() {
  const csvPath = '/Users/kharisyeboah/Downloads/SAT Reading with Modules - oneprep_final_EN_with_module.csv'
  
  console.log('📖 Starting Bluebook SAT Reading & Writing import...')
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
  
  console.log(`\n📊 Total questions in CSV: ${records.length}`)
  
  // Filter only Bluebook questions
  const bluebookQuestions = records.filter(row => 
    row.Module && row.Module.includes('Bluebook - SAT Practice')
  )
  
  console.log(`📚 Bluebook Reading questions: ${bluebookQuestions.length}\n`)
  
  // Process tests 1-6
  const testNumbers = [1, 2, 3, 4, 5, 6]
  
  for (const testNum of testNumbers) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📚 Processing SAT Practice Test #${testNum} - Reading & Writing`)
    console.log('='.repeat(60))
    
    // Filter questions for this test
    const testQuestions = bluebookQuestions.filter(row => 
      row.Module.includes(`SAT Practice #${testNum}`)
    )
    
    if (testQuestions.length === 0) {
      console.log(`  ⚠️  No questions found for Test #${testNum}`)
      continue
    }
    
    console.log(`  📊 Found ${testQuestions.length} questions`)
    
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
    
    console.log('\n  📋 Module Structure:')
    moduleGroups.forEach((questions, moduleName) => {
      console.log(`    - ${moduleName}: ${questions.length} questions`)
    })
    
    // Create or update exam - now as a complete SAT with both sections
    const examTitle = `SAT Practice Test #${testNum} - Complete`
    
    let exam = await prisma.exam.findFirst({
      where: { title: examTitle },
      include: {
        sections: {
          include: {
            modules: true
          },
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (!exam) {
      console.log(`\n  ✨ Creating new complete exam: ${examTitle}`)
      exam = await prisma.exam.create({
        data: {
          title: examTitle,
          description: `Official Bluebook SAT Practice Test #${testNum} - Complete Digital SAT (Math + Reading & Writing)`,
          program: Program.SAT,
          examType: ExamType.PRACTICE_TEST,
          examNumber: testNum,
          isPublished: true,
          subProgram: 'COMPLETE',
          tags: ['bluebook', 'official', 'adaptive', 'complete', 'math', 'reading'],
          timeLimit: 134, // 64 min for Reading + 70 min for Math
          sections: {
            create: [
              {
                title: 'Reading and Writing',
                order: 1
              },
              {
                title: 'Math',
                order: 2
              }
            ]
          }
        },
        include: {
          sections: {
            include: {
              modules: true
            },
            orderBy: { order: 'asc' }
          }
        }
      })
    } else {
      console.log(`\n  📝 Updating existing exam: ${examTitle}`)
      // Make sure we have both sections
      if (exam.sections.length < 2) {
        // Add Reading section if missing
        const hasReading = exam.sections.some(s => s.title.includes('Reading'))
        if (!hasReading) {
          await prisma.examSection.create({
            data: {
              title: 'Reading and Writing',
              order: 1,
              examId: exam.id
            }
          })
        }
        
        // Re-fetch exam with updated sections
        exam = await prisma.exam.findFirst({
          where: { id: exam.id },
          include: {
            sections: {
              include: {
                modules: true
              },
              orderBy: { order: 'asc' }
            }
          }
        })!
      }
    }
    
    // Get or create Reading section
    let readingSection = exam.sections.find(s => s.title.includes('Reading'))
    if (!readingSection) {
      readingSection = await prisma.examSection.create({
        data: {
          title: 'Reading and Writing',
          order: 1,
          examId: exam.id
        }
      })
    }
    
    // Process each Reading module
    for (const [moduleName, questions] of moduleGroups) {
      console.log(`\n  📦 Processing Reading ${moduleName}...`)
      
      // Determine module properties
      let moduleType: ModuleType
      let moduleDifficulty: ModuleDifficulty | null = null
      let order: number
      
      if (moduleName.includes('Module 1')) {
        moduleType = ModuleType.ROUTING
        order = 1
      } else if (moduleName.includes('Module 2')) {
        moduleType = ModuleType.ADAPTIVE
        // Use different order numbers for Easy and Hard
        if (moduleName.includes('Easy')) {
          order = 2
          moduleDifficulty = ModuleDifficulty.EASY
        } else {
          order = 3
          moduleDifficulty = ModuleDifficulty.HARD
        }
      } else {
        continue
      }
      
      // Find or create module
      let module = await prisma.examModule.findFirst({
        where: {
          sectionId: readingSection.id,
          order: order,
          difficulty: moduleDifficulty
        }
      })
      
      if (!module) {
        module = await prisma.examModule.create({
          data: {
            title: `Reading ${moduleName}`,
            order: order,
            timeLimit: 32, // 32 minutes per Reading module
            moduleType: moduleType,
            difficulty: moduleDifficulty,
            sectionId: readingSection.id
          }
        })
        console.log(`    ✅ Created module: Reading ${moduleName}`)
      } else {
        // Update existing module
        module = await prisma.examModule.update({
          where: { id: module.id },
          data: {
            title: `Reading ${moduleName}`,
            moduleType: moduleType,
            difficulty: moduleDifficulty,
            timeLimit: 32
          }
        })
        console.log(`    📝 Updated existing module: Reading ${moduleName}`)
      }
      
      // Clear existing questions for this module
      await prisma.examQuestion.deleteMany({
        where: { moduleId: module.id }
      })
      
      // Import questions for this module
      let questionOrder = 1
      let importedCount = 0
      let failedCount = 0
      
      for (const questionData of questions) {
        try {
          // Create or update question in question bank
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
              questionType: questionData['Question Type'] === 'mcq' 
                ? QuestionType.MULTIPLE_CHOICE 
                : QuestionType.SHORT_ANSWER,
              points: 1,
              explanation: questionData.Explaination_html || questionData.Explaination,
              questionCode: questionData.URL || `bluebook-reading-${testNum}-${moduleName}-${questionOrder}`,
              isActive: true,
              metadata: {
                source: 'Bluebook',
                examNumber: testNum,
                section: 'Reading and Writing',
                module: moduleName,
                originalUrl: questionData.URL
              }
            }
          })
          
          // Create answer options if MCQ
          if (questionData['Question Type'] === 'mcq') {
            const choices = [
              { label: 'A', text: questionData['Choice A_html'] || questionData['Choice A'] },
              { label: 'B', text: questionData['Choice B_html'] || questionData['Choice B'] },
              { label: 'C', text: questionData['Choice C_html'] || questionData['Choice C'] },
              { label: 'D', text: questionData['Choice D_html'] || questionData['Choice D'] },
            ].filter(choice => choice.text && choice.text.trim())
            
            // Delete existing answer options
            await prisma.answerOption.deleteMany({
              where: { questionId: questionBankItem.id }
            })
            
            // Create new answer options
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
          
          // Link question to module
          await prisma.examQuestion.create({
            data: {
              moduleId: module.id,
              questionId: questionBankItem.id,
              order: questionOrder
            }
          })
          
          importedCount++
          questionOrder++
          
          // Log progress every 5 questions
          if (importedCount % 5 === 0) {
            process.stdout.write(`      Progress: ${importedCount}/${questions.length}\r`)
          }
          
        } catch (error: any) {
          console.error(`\n      ❌ Failed question ${questionOrder}: ${error.message}`)
          failedCount++
        }
      }
      
      console.log(`\n    ✅ Imported ${importedCount}/${questions.length} questions`)
      if (failedCount > 0) {
        console.log(`    ⚠️  Failed: ${failedCount} questions`)
      }
    }
    
    // Now copy Math modules from the Math-only exam if they exist
    console.log(`\n  🔄 Checking for existing Math modules...`)
    const mathOnlyExam = await prisma.exam.findFirst({
      where: { title: `SAT Practice Test #${testNum}` },
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
        }
      }
    })
    
    if (mathOnlyExam && mathOnlyExam.sections[0]?.modules.length > 0) {
      console.log(`    📐 Found Math modules to copy`)
      
      // Get or create Math section
      let mathSection = exam.sections.find(s => s.title === 'Math')
      if (!mathSection) {
        mathSection = await prisma.examSection.create({
          data: {
            title: 'Math',
            order: 2,
            examId: exam.id
          }
        })
      }
      
      // Copy each Math module
      for (const sourceModule of mathOnlyExam.sections[0].modules) {
        // Check if module already exists
        const existingModule = await prisma.examModule.findFirst({
          where: {
            sectionId: mathSection.id,
            order: sourceModule.order,
            difficulty: sourceModule.difficulty
          }
        })
        
        if (!existingModule) {
          // Create new module
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
          
          // Copy questions
          for (const examQuestion of sourceModule.questions) {
            await prisma.examQuestion.create({
              data: {
                moduleId: newModule.id,
                questionId: examQuestion.questionId,
                order: examQuestion.order
              }
            })
          }
          
          console.log(`    ✅ Copied Math ${sourceModule.title}`)
        } else {
          console.log(`    ✓ Math ${sourceModule.title} already exists`)
        }
      }
    }
    
    console.log(`\n  🎉 SAT Practice Test #${testNum} Complete exam ready!`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 All Bluebook Reading & Writing tests imported successfully!')
  console.log('='.repeat(60))
  
  // Final summary
  const finalStats = await prisma.exam.findMany({
    where: {
      title: {
        contains: 'Complete'
      }
    },
    include: {
      sections: {
        include: {
          modules: {
            include: {
              _count: {
                select: {
                  questions: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { title: 'asc' }
  })
  
  console.log('\n📊 Final Summary - Complete SAT Exams:')
  for (const exam of finalStats) {
    console.log(`\n  ${exam.title}:`)
    for (const section of exam.sections) {
      const sectionTotal = section.modules.reduce((sum, module) => sum + module._count.questions, 0)
      console.log(`    ${section.title}: ${sectionTotal} questions`)
    }
    const totalQuestions = exam.sections.reduce((sum, section) => 
      sum + section.modules.reduce((sSum, module) => 
        sSum + module._count.questions, 0), 0)
    console.log(`    TOTAL: ${totalQuestions} questions`)
  }
}

// Run the import
importBluebookReadingTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })