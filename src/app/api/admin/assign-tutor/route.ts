import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { studentId, tutorId } = await request.json()

    if (!studentId || !tutorId) {
      return NextResponse.json(
        { error: 'Student ID and Tutor ID are required' },
        { status: 400 }
      )
    }

    // Verify the student exists and is a student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { 
        id: true, 
        role: true, 
        name: true,
        email: true 
      }
    })

    if (!student || student.role !== Role.STUDENT) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    // Verify the tutor exists and is a tutor
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      select: { 
        id: true, 
        role: true,
        name: true,
        email: true 
      }
    })

    if (!tutor || tutor.role !== Role.TUTOR) {
      return NextResponse.json(
        { error: 'Invalid tutor ID' },
        { status: 400 }
      )
    }

    // Check if the relationship already exists
    const existingRelationship = await prisma.tutorStudent.findUnique({
      where: {
        tutorId_studentId: {
          tutorId: tutorId,
          studentId: studentId
        }
      }
    })

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'This student is already assigned to this tutor' },
        { status: 409 }
      )
    }

    // Create the relationship
    const relationship = await prisma.tutorStudent.create({
      data: {
        tutorId: tutorId,
        studentId: studentId
      },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Tutor assigned successfully',
      relationship: {
        id: relationship.id,
        tutor: relationship.tutor,
        student: relationship.student,
        createdAt: relationship.createdAt
      }
    })
  } catch (error) {
    console.error('Failed to assign tutor:', error)
    return NextResponse.json(
      { error: 'Failed to assign tutor' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch student's tutors
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Get all tutors assigned to this student
    const assignments = await prisma.tutorStudent.findMany({
      where: { studentId },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            timezone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      tutors: assignments.map(a => ({
        ...a.tutor,
        assignedAt: a.createdAt
      }))
    })
  } catch (error) {
    console.error('Failed to fetch student tutors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutors' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a tutor assignment
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { studentId, tutorId } = await request.json()

    if (!studentId || !tutorId) {
      return NextResponse.json(
        { error: 'Student ID and Tutor ID are required' },
        { status: 400 }
      )
    }

    // Delete the relationship
    await prisma.tutorStudent.delete({
      where: {
        tutorId_studentId: {
          tutorId: tutorId,
          studentId: studentId
        }
      }
    })

    return NextResponse.json({
      message: 'Tutor assignment removed successfully'
    })
  } catch (error) {
    console.error('Failed to remove tutor assignment:', error)
    return NextResponse.json(
      { error: 'Failed to remove tutor assignment' },
      { status: 500 }
    )
  }
}