import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateICS, sessionToStudentEvent } from '@/lib/ics-generator'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ studentId: string; token: string }> }
) {
  const params = await props.params
  const { studentId, token } = params

  try {
    // Verify the token matches the student's calendar token
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        calendarToken: token,
        role: 'STUDENT'
      },
      include: {
        studentProfile: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Invalid calendar link' },
        { status: 401 }
      )
    }

    // Fetch all upcoming sessions for this student
    const sessions = await prisma.scheduledSession.findMany({
      where: {
        studentProfileId: student.studentProfile?.id,
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
    const events = sessions.map(session => 
      sessionToStudentEvent(session, student.name || 'Student')
    )

    // Generate ICS content
    const calendarName = `${student.name || 'Student'}'s Tutoring Schedule`
    const icsContent = generateICS(
      events,
      calendarName,
      student.timezone || 'America/New_York'
    )

    // Return ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${studentId}-schedule.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating student calendar:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}