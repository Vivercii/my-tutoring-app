import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient, ModuleType, ModuleDifficulty } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: {
        sections: {
          include: {
            modules: {
              include: {
                questions: {
                  include: {
                    question: {
                      include: {
                        options: true
                      }
                    }
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Check if student has an assignment for this exam
    let assignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId: params.examId
        }
      }
    })

    // Create assignment if it doesn't exist
    if (!assignment) {
      assignment = await prisma.examAssignment.create({
        data: {
          studentId: session.user.id,
          examId: params.examId,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      })
    }

    // Determine which module to show based on adaptive logic
    let currentModule = null
    let availableModules = []

    for (const section of exam.sections) {
      const routingModule = section.modules.find(m => m.moduleType === ModuleType.ROUTING)
      const easyModule = section.modules.find(m => m.moduleType === ModuleType.ADAPTIVE && m.difficulty === ModuleDifficulty.EASY)
      const hardModule = section.modules.find(m => m.moduleType === ModuleType.ADAPTIVE && m.difficulty === ModuleDifficulty.HARD)
      const standardModules = section.modules.filter(m => m.moduleType === ModuleType.STANDARD)

      // If we have adaptive modules
      if (routingModule && easyModule && hardModule) {
        // Check if Module 1 is complete
        if (!assignment.module1Score) {
          // Show Module 1 (routing)
          currentModule = routingModule
          availableModules = [routingModule]
        } else {
          // Module 1 is complete, determine which Module 2 to show
          const module2 = assignment.module1Score >= 15 ? hardModule : easyModule
          currentModule = module2
          availableModules = [routingModule, module2]
        }
      } else if (standardModules.length > 0) {
        // Non-adaptive exam, show all modules
        availableModules = standardModules
        currentModule = standardModules[0]
      }
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        examType: exam.examType
      },
      assignment: {
        id: assignment.id,
        status: assignment.status,
        module1Score: assignment.module1Score,
        adaptivePath: assignment.adaptivePath,
        currentModuleId: assignment.currentModuleId || currentModule?.id
      },
      currentModule,
      availableModules,
      isAdaptive: exam.sections.some(s => 
        s.modules.some(m => m.moduleType === ModuleType.ROUTING)
      )
    })
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}