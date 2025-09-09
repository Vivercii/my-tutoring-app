import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/students/exams - Get available exams for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, show ALL published exams to ALL students
    // (Later you can add program-specific filtering if needed)
    const exams = await prisma.exam.findMany({
      where: {
        isPublished: true
      },
      include: {
        _count: {
          select: {
            sections: true
          }
        }
      },
      orderBy: [
        { examType: 'asc' },
        { examNumber: 'asc' },
        { updatedAt: 'desc' }
      ]
    })

    // Get existing assignments for this student
    const assignments = await prisma.examAssignment.findMany({
      where: {
        studentId: session.user.id
      },
      include: {
        exam: true
      }
    })

    // Group exams by type for better organization
    const groupedExams = exams.reduce((acc, exam) => {
      const type = exam.examType || 'CUSTOM'
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push({
        ...exam,
        assignment: assignments.find(a => a.examId === exam.id) || null
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({ 
      exams: groupedExams,
      totalExams: exams.length,
      completedCount: assignments.filter(a => a.status === 'COMPLETED').length,
      inProgressCount: assignments.filter(a => a.status === 'IN_PROGRESS').length
    })
  } catch (error) {
    console.error('Error fetching student exams:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

// POST /api/students/exams - Start an exam (create assignment)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = await request.json()

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    // Check if exam exists and is published
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!exam || !exam.isPublished) {
      return NextResponse.json({ error: 'Exam not available' }, { status: 404 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.examAssignment.findUnique({
      where: {
        studentId_examId: {
          studentId: session.user.id,
          examId
        }
      }
    })

    if (existingAssignment) {
      // Return existing assignment
      return NextResponse.json(existingAssignment)
    }

    // Create new assignment
    const assignment = await prisma.examAssignment.create({
      data: {
        studentId: session.user.id,
        examId,
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error starting exam:', error)
    return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 })
  }
}