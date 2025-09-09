import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch tutors assigned to a specific student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { studentId } = await params
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        managedStudents: {
          where: {
            studentProfile: {
              student: {
                id: studentId
              }
            }
          },
          select: {
            studentProfileId: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify parent manages this student
    if (user.role === 'PARENT' && user.managedStudents.length === 0) {
      return NextResponse.json({ error: 'You do not have access to this student' }, { status: 403 })
    }

    // Get the student with their assigned tutors
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
        tutors: {
          include: {
            tutor: {
              include: {
                tutorProfile: true,
                tutorAvailability: {
                  orderBy: [
                    { dayOfWeek: 'asc' },
                    { startTime: 'asc' }
                  ]
                }
              }
            }
          }
        }
      }
    })

    if (!student || !student.studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Format the tutors for the response
    const tutors = student.tutors.map(assignment => ({
      id: assignment.tutor.id,
      name: assignment.tutor.name,
      email: assignment.tutor.email,
      zoomLink: assignment.tutor.zoomLink,
      tutorProfile: assignment.tutor.tutorProfile,
      tutorAvailability: assignment.tutor.tutorAvailability,
      scheduledSessions: []
    }))

    // Get scheduled sessions for each tutor with this student
    for (const tutor of tutors) {
      const sessions = await prisma.scheduledSession.findMany({
        where: {
          tutorId: tutor.id,
          studentProfileId: student.studentProfile.id,
          startTime: {
            gte: new Date()
          }
        },
        select: {
          startTime: true,
          endTime: true
        }
      })
      ;(tutor as any).scheduledSessions = sessions
    }

    return NextResponse.json(tutors)
  } catch (error) {
    console.error('Error fetching student tutors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutors' },
      { status: 500 }
    )
  }
}