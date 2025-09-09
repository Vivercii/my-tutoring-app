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

async function fixPracticeTest2() {
  const csvPath = '/Users/kharisyeboah/Downloads/SAT Math with Modules - oneprep_final_MA_with_module.csv'
  
  console.log('🔧 Fixing SAT Practice Test #2...')
  
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
  
  // Filter only Practice Test #2 questions
  const test2Questions = records.filter(row => 
    row.Module && row.Module.includes('Bluebook - SAT Practice #2')
  )
  
  console.log(`📚 Found ${test2Questions.length} questions for Practice Test #2`)
  
  // Group questions by module
  const moduleGroups = new Map<string, CSVRow[]>()
  
  test2Questions.forEach(question => {
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
  
  console.log('\n📋 Module Structure:')
  moduleGroups.forEach((questions, moduleName) => {
    console.log(`  - ${moduleName}: ${questions.length} questions`)
  })
  
  // Get or create exam
  let exam = await prisma.exam.findFirst({
    where: { title: 'SAT Practice Test #2' },
    include: {
      sections: {
        include: {
          modules: true
        }
      }
    }
  })
  
  if (!exam) {
    console.log('Creating new exam...')
    exam = await prisma.exam.create({
      data: {
        title: 'SAT Practice Test #2',
        description: 'Official Bluebook SAT Practice Test #2 - Digital SAT Math Section',
        program: Program.SAT,
        examType: ExamType.PRACTICE_TEST,
        examNumber: 2,
        isPublished: true,
        subProgram: 'MATH',
        tags: ['bluebook', 'official', 'adaptive', 'math'],
        timeLimit: 70,
        sections: {
          create: {
            title: 'Math',
            order: 1
          }
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
  }
  
  const mathSection = exam.sections[0]
  
  // Process each module
  for (const [moduleName, questions] of moduleGroups) {
    console.log(`\n📦 Processing ${moduleName}...`)
    
    // Determine module properties
    let moduleType: ModuleType
    let moduleDifficulty: ModuleDifficulty | null = null
    let order: number
    
    if (moduleName.includes('Module 1')) {
      moduleType = ModuleType.ROUTING
      order = 1
    } else if (moduleName.includes('Module 2')) {
      moduleType = ModuleType.ADAPTIVE
      // Use different order numbers for Easy and Hard to avoid conflicts
      // But they're still Module 2 in the adaptive flow
      if (moduleName.includes('Easy')) {
        order = 2
        moduleDifficulty = ModuleDifficulty.EASY
      } else {
        order = 3  // Hard module gets order 3 to avoid conflict
        moduleDifficulty = ModuleDifficulty.HARD
      }
    } else {
      continue
    }
    
    // Find or create module
    let module = await prisma.examModule.findFirst({
      where: {
        sectionId: mathSection.id,
        order: order,
        difficulty: moduleDifficulty
      }
    })
    
    if (!module) {
      module = await prisma.examModule.create({
        data: {
          title: moduleName,
          order: order,
          timeLimit: 35,
          moduleType: moduleType,
          difficulty: moduleDifficulty,
          sectionId: mathSection.id
        }
      })
      console.log(`  ✅ Created module: ${moduleName}`)
    } else {
      // Update existing module
      module = await prisma.examModule.update({
        where: { id: module.id },
        data: {
          title: moduleName,
          moduleType: moduleType,
          difficulty: moduleDifficulty,
          timeLimit: 35
        }
      })
      console.log(`  📝 Updated existing module: ${moduleName}`)
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
            questionCode: questionData.URL || `bluebook-2-${moduleName}-${questionOrder}`
          },
          update: {
            questionText: questionData.Question_html || questionData.Question,
            explanation: questionData.Explaination_html || questionData.Explaination,
          },
          create: {
            program: Program.SAT,
            subject: 'Math',
            topic: 'SAT Math',
            difficulty: moduleDifficulty === ModuleDifficulty.HARD ? 'Hard' : 
                      moduleDifficulty === ModuleDifficulty.EASY ? 'Easy' : 'Medium',
            questionText: questionData.Question_html || questionData.Question,
            questionType: questionData['Question Type'] === 'mcq' 
              ? QuestionType.MULTIPLE_CHOICE 
              : QuestionType.SHORT_ANSWER,
            points: 1,
            explanation: questionData.Explaination_html || questionData.Explaination,
            questionCode: questionData.URL || `bluebook-2-${moduleName}-${questionOrder}`,
            isActive: true,
            metadata: {
              source: 'Bluebook',
              examNumber: 2,
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
          console.log(`    Progress: ${importedCount}/${questions.length}`)
        }
        
      } catch (error) {
        console.error(`    ❌ Failed to import question ${questionOrder}:`, error)
        failedCount++
      }
    }
    
    console.log(`  ✅ Imported ${importedCount}/${questions.length} questions`)
    if (failedCount > 0) {
      console.log(`  ⚠️  Failed: ${failedCount} questions`)
    }
  }
  
  console.log('\n🎉 SAT Practice Test #2 fixed successfully!')
}

// Run the fix
fixPracticeTest2()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })