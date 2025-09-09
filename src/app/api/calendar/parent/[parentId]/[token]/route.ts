import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateICS, sessionToStudentEvent } from '@/lib/ics-generator'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ parentId: string; token: string }> }
) {
  const params = await props.params
  const { parentId, token } = params

  try {
    // Verify the token matches the parent's calendar token
    const parent = await prisma.user.findFirst({
      where: {
        id: parentId,
        calendarToken: token,
        role: 'PARENT'
      },
      include: {
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

    if (!parent) {
      return NextResponse.json(
        { error: 'Invalid calendar link' },
        { status: 401 }
      )
    }

    // Get all student profile IDs managed by this parent
    const studentProfileIds = parent.managedStudents.map(ms => ms.studentProfileId)

    if (studentProfileIds.length === 0) {
      // Return empty calendar if no students
      const icsContent = generateICS(
        [],
        `${parent.name || 'Parent'}'s Tutoring Schedule`,
        parent.timezone || 'America/New_York'
      )
      
      return new NextResponse(icsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${parentId}-schedule.ics"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // Fetch all sessions for all managed students
    const sessions = await prisma.scheduledSession.findMany({
      where: {
        studentProfileId: {
          in: studentProfileIds
        },
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Include past 30 days
        }
      },
      include: {
        tutor: {
          include: {
            tutorProfile: true
          }
        },
        studentProfile: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Convert sessions to calendar events
    // Include student name in title for parent's view
    const events = sessions.map(session => {
      const studentName = session.studentProfile?.student?.name || 'Student'
      const event = sessionToStudentEvent(session, studentName)
      // Prepend student name to title for parent's multi-child view
      if (parent.managedStudents.length > 1) {
        event.title = `[${studentName}] ${event.title}`
      }
      return event
    })

    // Generate ICS content
    const calendarName = parent.managedStudents.length === 1 
      ? `${parent.managedStudents[0].studentProfile.student.name}'s Tutoring Schedule`
      : `${parent.name || 'Family'} Tutoring Schedule`
      
    const icsContent = generateICS(
      events,
      calendarName,
      parent.timezone || 'America/New_York'
    )

    // Return ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${parentId}-schedule.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating parent calendar:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}