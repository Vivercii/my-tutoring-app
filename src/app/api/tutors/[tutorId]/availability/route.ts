import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET: Fetch a specific tutor's availability and available time slots
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ tutorId: string }> }
) {
  try {
    const params = await props.params
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only parents and admins can view tutor availability
    if (user.role !== 'PARENT' && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Only parents can view tutor availability' }, { status: 403 })
    }

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch tutor's recurring availability
    const tutorAvailability = await prisma.tutorAvailability.findMany({
      where: { tutorId: params.tutorId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Fetch tutor's zoom link
    const tutor = await prisma.user.findUnique({
      where: { id: params.tutorId },
      select: {
        id: true,
        name: true,
        email: true,
        zoomLink: true
      }
    })

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    // If date range is provided, calculate available slots
    let availableSlots: any[] = []
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Get all scheduled sessions for the tutor in this date range
      const scheduledSessions = await prisma.scheduledSession.findMany({
        where: {
          tutorId: params.tutorId,
          status: 'CONFIRMED',
          startTime: {
            gte: start,
            lte: end
          }
        },
        select: {
          startTime: true,
          endTime: true
        }
      })

      // Generate available slots based on recurring availability
      const currentDate = new Date(start)
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay()
        
        // Find availability for this day
        const dayAvailability = tutorAvailability.filter(a => a.dayOfWeek === dayOfWeek)
        
        for (const availability of dayAvailability) {
          const [startHour, startMinute] = availability.startTime.split(':').map(Number)
          const [endHour, endMinute] = availability.endTime.split(':').map(Number)
          
          // Create slot start and end times
          const slotStart = new Date(currentDate)
          slotStart.setHours(startHour, startMinute, 0, 0)
          
          const slotEnd = new Date(currentDate)
          slotEnd.setHours(endHour, endMinute, 0, 0)
          
          // Check if this slot conflicts with any scheduled sessions
          const isAvailable = !scheduledSessions.some(session => {
            const sessionStart = new Date(session.startTime)
            const sessionEnd = new Date(session.endTime)
            
            // Check for overlap
            return (
              (slotStart >= sessionStart && slotStart < sessionEnd) ||
              (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
              (slotStart <= sessionStart && slotEnd >= sessionEnd)
            )
          })
          
          // Only add future slots that are available
          if (isAvailable && slotStart > new Date()) {
            availableSlots.push({
              date: currentDate.toISOString().split('T')[0],
              dayOfWeek,
              startTime: availability.startTime,
              endTime: availability.endTime,
              startDateTime: slotStart.toISOString(),
              endDateTime: slotEnd.toISOString(),
              isAvailable: true
            })
          }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return NextResponse.json({
      tutor: {
        id: tutor.id,
        name: tutor.name,
        email: tutor.email,
        hasZoomLink: !!tutor.zoomLink
      },
      recurringAvailability: tutorAvailability,
      availableSlots: availableSlots.sort((a, b) => 
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      )
    })
  } catch (error) {
    console.error('Error fetching tutor availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutor availability' },
      { status: 500 }
    )
  }
}