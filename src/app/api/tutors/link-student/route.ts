import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the tutor user
    const tutorUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!tutorUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify the user is a tutor
    if (tutorUser.role !== Role.TUTOR) {
      return NextResponse.json(
        { error: 'Only tutors can link student accounts' },
        { status: 403 }
      )
    }

    // Get the invite key from the request body
    const { inviteKey } = await req.json()

    if (!inviteKey) {
      return NextResponse.json(
        { error: 'Invite key is required' },
        { status: 400 }
      )
    }

    // Find the student with this invite key
    const studentUser = await prisma.user.findUnique({
      where: { inviteKey: inviteKey.toUpperCase() }
    })

    if (!studentUser) {
      return NextResponse.json(
        { error: 'Invalid invite key' },
        { status: 404 }
      )
    }

    // Verify the user is a student
    if (studentUser.role !== Role.STUDENT) {
      return NextResponse.json(
        { error: 'This invite key does not belong to a student account' },
        { status: 400 }
      )
    }

    // Check if this tutor is already linked to this student
    const existingLink = await prisma.tutorStudent.findUnique({
      where: {
        tutorId_studentId: {
          tutorId: tutorUser.id,
          studentId: studentUser.id
        }
      }
    })

    if (existingLink) {
      return NextResponse.json(
        { error: 'You are already linked to this student' },
        { status: 409 }
      )
    }

    // Create the link between tutor and student
    const tutorStudentLink = await prisma.tutorStudent.create({
      data: {
        tutorId: tutorUser.id,
        studentId: studentUser.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            inviteKey: true,
            phoneNumber: true,
            timezone: true,
            studentProfile: {
              select: {
                program: true,
                gradeLevel: true,
                school: true,
                targetScore: true,
                currentScore: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Student account linked successfully',
      student: tutorStudentLink.student
    })
    
  } catch (error) {
    console.error('Failed to link student account:', error)
    return NextResponse.json(
      { error: 'Failed to link student account' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch all linked students for a tutor
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the tutor user
    const tutorUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!tutorUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify the user is a tutor
    if (tutorUser.role !== Role.TUTOR) {
      return NextResponse.json(
        { error: 'Only tutors can access this endpoint' },
        { status: 403 }
      )
    }

    // Get all linked students with their profiles
    const linkedStudents = await prisma.tutorStudent.findMany({
      where: { tutorId: tutorUser.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            inviteKey: true,
            phoneNumber: true,
            timezone: true,
            createdAt: true,
            studentProfile: {
              select: {
                id: true,
                program: true,
                gradeLevel: true,
                school: true,
                targetScore: true,
                currentScore: true,
                academicGoals: true,
                strengths: true,
                weaknesses: true,
                preferredSchedule: true,
                sessionLogs: {
                  orderBy: { date: 'desc' },
                  take: 5,
                  select: {
                    id: true,
                    subject: true,
                    tutorName: true,
                    date: true,
                    duration: true,
                    notes: true,
                    score: true,
                    rating: true
                  }
                },
                _count: {
                  select: {
                    sessionLogs: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      students: linkedStudents.map(link => ({
        id: link.id,
        linkedAt: link.createdAt,
        ...link.student
      }))
    })
    
  } catch (error) {
    console.error('Failed to fetch linked students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to unlink a student
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { studentId } = await req.json()

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Get the tutor user
    const tutorUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!tutorUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the link
    await prisma.tutorStudent.delete({
      where: {
        tutorId_studentId: {
          tutorId: tutorUser.id,
          studentId: studentId
        }
      }
    })

    return NextResponse.json({
      message: 'Student unlinked successfully'
    })
    
  } catch (error) {
    console.error('Failed to unlink student:', error)
    return NextResponse.json(
      { error: 'Failed to unlink student' },
      { status: 500 }
    )
  }
}