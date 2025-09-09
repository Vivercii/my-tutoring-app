import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateICS, sessionToTutorEvent } from '@/lib/ics-generator'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ tutorId: string; token: string }> }
) {
  const params = await props.params
  const { tutorId, token } = params

  try {
    // Verify the token matches the tutor's calendar token
    const tutor = await prisma.user.findFirst({
      where: {
        id: tutorId,
        calendarToken: token,
        role: 'TUTOR'
      },
      include: {
        tutorProfile: true
      }
    })

    if (!tutor) {
      return NextResponse.json(
        { error: 'Invalid calendar link' },
        { status: 401 }
      )
    }

    // Fetch all upcoming sessions for this tutor
    const sessions = await prisma.scheduledSession.findMany({
      where: {
        tutorId: tutorId,
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
    const events = sessions.map(session => sessionToTutorEvent(session))

    // Generate ICS content
    const calendarName = `${tutor.name || 'Tutor'}'s Teaching Schedule`
    const icsContent = generateICS(
      events,
      calendarName,
      tutor.timezone || 'America/New_York'
    )

    // Return ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${tutorId}-schedule.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating tutor calendar:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}