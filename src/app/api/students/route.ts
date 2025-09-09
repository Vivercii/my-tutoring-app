import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/students - Get all students for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        managedStudents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ students: user.managedStudents })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, program } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      )
    }

    if (!program) {
      return NextResponse.json(
        { error: 'Program selection is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create student as a User with role STUDENT
    const studentUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: `student_${Date.now()}@temp.local`, // Temporary email, will be updated when they register
        role: 'STUDENT'
      }
    })

    // Create StudentProfile
    const studentProfile = await prisma.studentProfile.create({
      data: {
        studentId: studentUser.id,
        program: program
      }
    })

    // Create ParentStudent relationship
    await prisma.parentStudent.create({
      data: {
        parentId: user.id,
        studentProfileId: studentProfile.id
      }
    })

    // Create an activity for adding a student
    await prisma.activity.create({
      data: {
        type: 'student_added',
        description: `Added ${studentUser.name} as a student`,
        userId: user.id
      }
    })

    return NextResponse.json({ student: { id: studentUser.id, name: studentUser.name, program: studentProfile.program } }, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}