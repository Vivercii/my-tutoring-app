import { PrismaClient, ModuleType, ModuleDifficulty, Program, ExamType, QuestionType } from '@prisma/client'
import { parse } from 'csv-parse'
import fs from 'fs'
import path from 'path'

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

async function importBluebookExams() {
  const csvPath = '/Users/kharisyeboah/Downloads/SAT Math with Modules - oneprep_final_MA_with_module.csv'
  
  console.log('🚀 Starting Bluebook SAT exam import...')
  
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
  
  console.log(`📊 Found ${records.length} total questions`)
  
  // Filter only Bluebook questions
  const bluebookQuestions = records.filter(row => 
    row.Module && row.Module.includes('Bluebook - SAT Practice')
  )
  
  console.log(`📚 Found ${bluebookQuestions.length} Bluebook questions`)
  
  // Group questions by exam and module
  const examStructure = new Map<string, Map<string, CSVRow[]>>()
  
  bluebookQuestions.forEach(question => {
    const moduleInfo = question.Module
    
    // Extract exam number
    const examMatch = moduleInfo.match(/SAT Practice #(\d+)/)
    if (!examMatch) return
    
    const examNum = examMatch[1]
    const examKey = `SAT Practice Test #${examNum}`
    
    // Determine module type
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
    
    if (!examStructure.has(examKey)) {
      examStructure.set(examKey, new Map())
    }
    
    const examModules = examStructure.get(examKey)!
    if (!examModules.has(moduleKey)) {
      examModules.set(moduleKey, [])
    }
    
    examModules.get(moduleKey)!.push(question)
  })
  
  console.log(`\n📋 Exam Structure:`)
  examStructure.forEach((modules, examName) => {
    console.log(`\n${examName}:`)
    modules.forEach((questions, moduleName) => {
      console.log(`  - ${moduleName}: ${questions.length} questions`)
    })
  })
  
  // Import each exam
  let totalImported = 0
  let totalFailed = 0
  
  for (const [examName, modules] of examStructure) {
    console.log(`\n📝 Importing ${examName}...`)
    
    try {
      // Create or find exam
      const examNumber = parseInt(examName.match(/#(\d+)/)?.[1] || '0')
      
      // First check if exam exists
      let exam = await prisma.exam.findFirst({
        where: {
          title: examName
        },
        include: {
          sections: true
        }
      })
      
      if (!exam) {
        exam = await prisma.exam.create({
          data: {
            title: examName,
            description: `Official Bluebook ${examName} - Digital SAT Math Section`,
            program: Program.SAT,
            examType: ExamType.PRACTICE_TEST,
            examNumber: examNumber,
            isPublished: true,
            subProgram: 'MATH',
            tags: ['bluebook', 'official', 'adaptive', 'math'],
            timeLimit: 70, // 35 minutes per module
            sections: {
              create: {
                title: 'Math',
                order: 1,
              }
            }
          },
          include: {
            sections: true
          }
        })
      }
      
      const mathSection = exam.sections[0]
      
      // Create modules for this exam
      for (const [moduleName, questions] of modules) {
        console.log(`  📦 Creating ${moduleName}...`)
        
        // Determine module properties
        let moduleType: ModuleType
        let moduleDifficulty: ModuleDifficulty | null = null
        let order: number
        
        if (moduleName.includes('Module 1')) {
          moduleType = ModuleType.ROUTING
          order = 1
        } else if (moduleName.includes('Module 2')) {
          moduleType = ModuleType.ADAPTIVE
          order = 2
          moduleDifficulty = moduleName.includes('Easy') 
            ? ModuleDifficulty.EASY 
            : ModuleDifficulty.HARD
        } else {
          continue
        }
        
        // Create or update module
        const module = await prisma.examModule.upsert({
          where: {
            sectionId_order: {
              sectionId: mathSection.id,
              order: order
            }
          },
          update: {
            title: moduleName,
            timeLimit: 35,
            moduleType: moduleType,
            difficulty: moduleDifficulty,
          },
          create: {
            title: moduleName,
            order: order,
            timeLimit: 35,
            moduleType: moduleType,
            difficulty: moduleDifficulty,
            sectionId: mathSection.id
          }
        })
        
        // Import questions for this module
        let questionOrder = 1
        let importedCount = 0
        let failedCount = 0
        
        for (const questionData of questions) {
          try {
            // First, create or find the question in the question bank
            const questionBankItem = await prisma.questionBankItem.upsert({
              where: {
                questionCode: questionData.URL || `bluebook-${examNumber}-${moduleName}-${questionOrder}`
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
                questionCode: questionData.URL || `bluebook-${examNumber}-${moduleName}-${questionOrder}`,
                isActive: true,
                metadata: {
                  source: 'Bluebook',
                  examNumber: examNumber,
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
              
              // Delete existing answer options and create new ones
              await prisma.answerOption.deleteMany({
                where: { questionId: questionBankItem.id }
              })
              
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
            await prisma.examQuestion.upsert({
              where: {
                moduleId_order: {
                  moduleId: module.id,
                  order: questionOrder
                }
              },
              update: {
                questionId: questionBankItem.id
              },
              create: {
                moduleId: module.id,
                questionId: questionBankItem.id,
                order: questionOrder
              }
            })
            
            importedCount++
            totalImported++
            questionOrder++
            
          } catch (error) {
            console.error(`    ❌ Failed to import question ${questionOrder}:`, error)
            failedCount++
            totalFailed++
          }
        }
        
        console.log(`    ✅ Imported ${importedCount}/${questions.length} questions`)
        if (failedCount > 0) {
          console.log(`    ⚠️  Failed: ${failedCount} questions`)
        }
      }
      
      console.log(`✅ Successfully imported ${examName}`)
      
    } catch (error) {
      console.error(`❌ Failed to import ${examName}:`, error)
    }
  }
  
  console.log(`\n🎉 Import complete!`)
  console.log(`   Total questions imported: ${totalImported}`)
  console.log(`   Total questions failed: ${totalFailed}`)
  console.log(`   Success rate: ${((totalImported / (totalImported + totalFailed)) * 100).toFixed(1)}%`)
}

// Run the import
importBluebookExams()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })