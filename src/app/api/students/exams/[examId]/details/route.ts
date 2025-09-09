import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = await params

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            modules: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Calculate total questions and modules properly for SAT
    let totalQuestions = 0
    let totalDuration = 0
    let actualModuleCount = 0

    // For SAT exams, we need to count correctly (not including adaptive variations)
    const isSAT = exam.program === 'SAT' || exam.title?.includes('SAT')
    
    exam.sections.forEach(section => {
      let sectionQuestions = 0
      let routingModule = null
      let adaptiveModules: any[] = []
      
      section.modules.forEach(module => {
        // For SAT, separate routing and adaptive modules
        if (isSAT) {
          if (module.moduleType === 'ROUTING' || module.title?.includes('Module 1')) {
            routingModule = module
            sectionQuestions += module.questions.length
            actualModuleCount++
          } else if (module.moduleType === 'ADAPTIVE' || module.title?.includes('Module 2')) {
            adaptiveModules.push(module)
          } else {
            // Non-adaptive module
            sectionQuestions += module.questions.length
            actualModuleCount++
          }
        } else {
          // Non-SAT exam, count all modules normally
          sectionQuestions += module.questions.length
          actualModuleCount++
        }
        
        // Add module time limit if exists
        if (module.timeLimit) {
          totalDuration += module.timeLimit
        }
      })
      
      // For SAT adaptive modules, only count one (they're alternatives, not additive)
      if (isSAT && adaptiveModules.length > 0) {
        // Use the average question count from adaptive modules
        const avgAdaptiveQuestions = Math.round(
          adaptiveModules.reduce((sum, m) => sum + m.questions.length, 0) / adaptiveModules.length
        )
        sectionQuestions += avgAdaptiveQuestions
        actualModuleCount++ // Count as one module since user only takes one variant
      }
      
      totalQuestions += sectionQuestions
    })

    // Use exam timeLimit if no module time limits, or if exam has overall limit
    if (totalDuration === 0 && exam.timeLimit) {
      totalDuration = exam.timeLimit
    }

    // Format duration - the stored value seems to be in minutes already for exams
    const formatDuration = (value: number) => {
      // If value is very small (like 70 or 134), it's likely already in minutes
      // If it's large (like 8040), it's in seconds
      let minutes = value;
      
      // Check if the value seems to be in seconds (larger than typical minute values)
      if (value > 300) {
        minutes = Math.round(value / 60);
      }
      
      // For SAT exams, use standard durations if not set
      if (!value && (exam.program === 'SAT' || exam.title?.includes('SAT'))) {
        minutes = 134; // Standard full SAT duration
      }
      
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}min` : `${hours} hour${hours > 1 ? 's' : ''}`
      }
      return `${minutes} minutes`
    }

    // For complete SAT exams, ensure we show standard values
    if (isSAT && exam.title?.includes('Complete')) {
      // Standard SAT has 98 questions (54 R&W + 44 Math)
      if (totalQuestions > 98) {
        totalQuestions = 98 // Use standard count
      }
      // Standard SAT has 4 modules (2 per section)
      if (actualModuleCount !== 4) {
        actualModuleCount = 4
      }
    }

    return NextResponse.json({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: formatDuration(totalDuration),
      questionCount: totalQuestions,
      sectionCount: exam.sections.length,
      moduleCount: actualModuleCount, // Add module count
      examType: exam.examType || 'PRACTICE_TEST',
      program: exam.program
    })
  } catch (error) {
    console.error('Error fetching exam details:', error)
    return NextResponse.json({ error: 'Failed to fetch exam details' }, { status: 500 })
  }
}