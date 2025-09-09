import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch scheduled sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        isAdmin: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const studentId = searchParams.get('studentId')

    let whereClause: any = {}

    // Build where clause based on user role
    if (user.role === 'PARENT') {
      // Get all student profiles linked to this parent
      const parentStudents = await prisma.parentStudent.findMany({
        where: { parentId: user.id },
        select: { studentProfileId: true }
      })
      
      const studentProfileIds = parentStudents.map(ps => ps.studentProfileId)
      
      whereClause.studentProfileId = {
        in: studentProfileIds
      }
      
      // Filter by specific student if provided
      if (studentId) {
        const studentProfile = await prisma.studentProfile.findUnique({
          where: { studentId }
        })
        
        if (studentProfile && studentProfileIds.includes(studentProfile.id)) {
          whereClause.studentProfileId = studentProfile.id
        }
      }
    } else if (user.role === 'TUTOR') {
      whereClause.tutorId = user.id
    } else if (user.role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { studentId: user.id }
      })
      
      if (studentProfile) {
        whereClause.studentProfileId = studentProfile.id
      }
    }

    // Add date filters
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const sessions = await prisma.scheduledSession.findMany({
      where: whereClause,
      include: {
        studentProfile: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            zoomLink: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching scheduled sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled sessions' },
      { status: 500 }
    )
  }
}

// POST: Book a new session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true
      }
    })

    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can book sessions' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, tutorId, startTime, endTime } = body

    // Validate required fields
    if (!studentId || !tutorId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const startDateTime = new Date(startTime)
    const endDateTime = new Date(endTime)

    // Validate dates
    if (startDateTime >= endDateTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    if (startDateTime <= new Date()) {
      return NextResponse.json({ error: 'Cannot book sessions in the past' }, { status: 400 })
    }

    // Calculate session duration in hours
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId },
      include: {
        parents: {
          where: { parentId: user.id }
        }
      }
    })

    if (!studentProfile || studentProfile.parents.length === 0) {
      return NextResponse.json({ error: 'Student not found or not linked to parent' }, { status: 404 })
    }

    // Check parent's credit balance
    const credits = await prisma.sessionCredit.findUnique({
      where: { userId: user.id }
    })

    if (!credits || credits.hours < durationHours) {
      return NextResponse.json({ 
        error: `Insufficient credits. Required: ${durationHours} hours, Available: ${credits?.hours || 0} hours` 
      }, { status: 400 })
    }

    // Verify tutor exists and get their zoom link
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      select: {
        id: true,
        name: true,
        email: true,
        zoomLink: true,
        role: true
      }
    })

    if (!tutor || tutor.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    // Check if the time slot is available (no overlapping sessions)
    const overlappingSessions = await prisma.scheduledSession.findMany({
      where: {
        tutorId,
        status: 'CONFIRMED',
        OR: [
          {
            AND: [
              { startTime: { lte: startDateTime } },
              { endTime: { gt: startDateTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endDateTime } },
              { endTime: { gte: endDateTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startDateTime } },
              { endTime: { lte: endDateTime } }
            ]
          }
        ]
      }
    })

    if (overlappingSessions.length > 0) {
      return NextResponse.json({ error: 'Time slot is not available' }, { status: 400 })
    }

    // Verify the time slot matches tutor's availability
    const dayOfWeek = startDateTime.getDay()
    const startTimeStr = `${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`
    const endTimeStr = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`

    const availability = await prisma.tutorAvailability.findFirst({
      where: {
        tutorId,
        dayOfWeek,
        startTime: { lte: startTimeStr },
        endTime: { gte: endTimeStr }
      }
    })

    if (!availability) {
      return NextResponse.json({ error: 'Selected time is outside tutor availability' }, { status: 400 })
    }

    // Create the session and update credits in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the scheduled session
      const scheduledSession = await tx.scheduledSession.create({
        data: {
          studentProfileId: studentProfile.id,
          tutorId,
          startTime: startDateTime,
          endTime: endDateTime,
          status: 'CONFIRMED',
          zoomLink: tutor.zoomLink
        },
        include: {
          studentProfile: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          tutor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Deduct credits from parent
      await tx.sessionCredit.update({
        where: { userId: user.id },
        data: {
          hours: {
            decrement: durationHours
          }
        }
      })

      // Log activity
      await tx.activity.create({
        data: {
          type: 'session_booked',
          description: `Parent ${session.user.email} booked a ${durationHours}h session for student ${studentId} with tutor ${tutor.name || tutor.email}`,
          userId: user.id
        }
      })

      return scheduledSession
    })

    return NextResponse.json({
      message: 'Session booked successfully',
      session: result
    })
  } catch (error) {
    console.error('Error booking session:', error)
    return NextResponse.json(
      { error: 'Failed to book session' },
      { status: 500 }
    )
  }
}

// PATCH: Update session status (e.g., cancel)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        isAdmin: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { sessionId, status } = body

    if (!sessionId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate status
    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get the session
    const scheduledSession = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
      include: {
        studentProfile: {
          include: {
            parents: {
              select: { parentId: true }
            }
          }
        }
      }
    })

    if (!scheduledSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check permissions
    const canModify = 
      user.isAdmin ||
      (user.role === 'PARENT' && scheduledSession.studentProfile.parents.some(p => p.parentId === user.id)) ||
      (user.role === 'TUTOR' && scheduledSession.tutorId === user.id)

    if (!canModify) {
      return NextResponse.json({ error: 'Unauthorized to modify this session' }, { status: 403 })
    }

    // If cancelling and the session hasn't started yet, refund the credits
    let creditsRefunded = 0
    if (status === 'CANCELLED' && scheduledSession.status === 'CONFIRMED' && scheduledSession.startTime > new Date()) {
      const durationHours = (scheduledSession.endTime.getTime() - scheduledSession.startTime.getTime()) / (1000 * 60 * 60)
      
      // Find the parent to refund
      const parentId = scheduledSession.studentProfile.parents[0]?.parentId
      if (parentId) {
        await prisma.sessionCredit.update({
          where: { userId: parentId },
          data: {
            hours: {
              increment: durationHours
            }
          }
        })
        creditsRefunded = durationHours
      }
    }

    // Update the session
    const updatedSession = await prisma.scheduledSession.update({
      where: { id: sessionId },
      data: { status },
      include: {
        studentProfile: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'session_updated',
        description: `User ${session.user.email} ${status.toLowerCase()} session ${sessionId}${creditsRefunded > 0 ? ` (${creditsRefunded}h refunded)` : ''}`,
        userId: user.id
      }
    })

    return NextResponse.json({
      message: `Session ${status.toLowerCase()} successfully`,
      session: updatedSession,
      creditsRefunded
    })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}