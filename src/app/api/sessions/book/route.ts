import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

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
        role: true,
        credits: true,
        managedStudents: {
          include: {
            studentProfile: {
              include: {
                student: true
              }
            }
          }
        }
      }
    })

    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can book sessions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      tutorId,
      studentProfileId,
      startTime,
      endTime,
      subject,
      notes
    } = body

    // Validate that the parent manages this student
    const managedStudent = user.managedStudents.find(
      ms => ms.studentProfileId === studentProfileId
    )

    if (!managedStudent) {
      return NextResponse.json({ error: 'You do not manage this student' }, { status: 403 })
    }

    // Check if parent has enough credits
    const sessionDuration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60)
    if (!user.credits || user.credits.hours < sessionDuration) {
      return NextResponse.json({ error: 'Insufficient session credits' }, { status: 400 })
    }

    // Check for conflicts with existing sessions
    const existingSession = await prisma.scheduledSession.findFirst({
      where: {
        OR: [
          {
            tutorId,
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            tutorId,
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          },
          {
            studentProfileId,
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            studentProfileId,
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          }
        ]
      }
    })

    if (existingSession) {
      return NextResponse.json({ error: 'Time slot conflicts with existing session' }, { status: 400 })
    }

    // Get tutor info for Zoom link
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      select: {
        name: true,
        email: true,
        zoomLink: true
      }
    })

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    // Create the session
    const scheduledSession = await prisma.scheduledSession.create({
      data: {
        tutorId,
        studentProfileId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'CONFIRMED',
        zoomLink: tutor.zoomLink || `https://zoom.us/j/${Date.now()}`, // Use tutor's zoom link or generate placeholder
        notes: notes || `${subject} tutoring session`
      },
      include: {
        tutor: {
          select: {
            name: true,
            email: true
          }
        },
        studentProfile: {
          include: {
            student: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Deduct credits from parent's account
    await prisma.$transaction([
      prisma.sessionCredit.update({
        where: { userId: user.id },
        data: {
          hours: {
            decrement: sessionDuration
          },
          totalUsed: {
            increment: sessionDuration
          }
        }
      }),
      prisma.hourTransaction.create({
        data: {
          type: 'USAGE',
          hours: -sessionDuration,
          balanceBefore: user.credits.hours,
          balanceAfter: user.credits.hours - sessionDuration,
          description: `Session booked with ${tutor.name} for ${managedStudent.studentProfile.student.name}`,
          sessionId: scheduledSession.id,
          userId: user.id,
          creditId: user.credits.id
        }
      })
    ])

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'session_booked',
        description: `Session booked with ${tutor.name} for ${managedStudent.studentProfile.student.name}`,
        userId: user.id
      }
    })

    // TODO: Send confirmation emails to parent, student, and tutor

    return NextResponse.json({
      message: 'Session booked successfully',
      session: scheduledSession
    })
  } catch (error) {
    console.error('Error booking session:', error)
    return NextResponse.json(
      { error: 'Failed to book session' },
      { status: 500 }
    )
  }
}

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
        studentProfile: true,
        managedStudents: {
          select: {
            studentProfileId: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let sessions

    // If student, get their sessions
    if (user.role === 'STUDENT' && user.studentProfile) {
      sessions = await prisma.scheduledSession.findMany({
        where: {
          studentProfileId: user.studentProfile.id,
          startTime: {
            gte: new Date()
          }
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              tutorProfile: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      })
    } 
    // If parent, get sessions for all their students
    else if (user.role === 'PARENT') {
      const studentProfileIds = user.managedStudents.map(ms => ms.studentProfileId)
      
      sessions = await prisma.scheduledSession.findMany({
        where: {
          studentProfileId: {
            in: studentProfileIds
          },
          startTime: {
            gte: new Date()
          }
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              tutorProfile: true
            }
          },
          studentProfile: {
            include: {
              student: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      })
    }
    // If tutor, get their teaching sessions
    else if (user.role === 'TUTOR') {
      sessions = await prisma.scheduledSession.findMany({
        where: {
          tutorId: user.id,
          startTime: {
            gte: new Date()
          }
        },
        include: {
          studentProfile: {
            include: {
              student: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      })
    }

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}