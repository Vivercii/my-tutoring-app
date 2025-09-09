import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch tutor's availability (for tutors and parents)
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
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get tutor ID from query params (for parents viewing tutors)
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')

    // If parent is requesting, they can view any tutor's availability
    if (user.role === 'PARENT' && tutorId) {
      const tutorWithAvailability = await prisma.user.findUnique({
        where: { id: tutorId },
        include: {
          tutorProfile: true,
          tutorAvailability: {
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' }
            ]
          },
          scheduledSessions: {
            where: {
              startTime: {
                gte: new Date()
              }
            },
            select: {
              startTime: true,
              endTime: true
            }
          }
        }
      })

      return NextResponse.json(tutorWithAvailability)
    }

    // If tutor is requesting their own availability
    if (user.role === 'TUTOR') {
      const availability = await prisma.tutorAvailability.findMany({
        where: { tutorId: user.id },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      })

      return NextResponse.json(availability)
    }

    // If parent wants to see all tutors
    if (user.role === 'PARENT' && !tutorId) {
      const tutors = await prisma.user.findMany({
        where: {
          role: 'TUTOR',
          isActive: true
        },
        include: {
          tutorProfile: true,
          tutorAvailability: {
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' }
            ]
          }
        }
      })

      return NextResponse.json(tutors)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching tutor availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

// POST: Set or update tutor's availability
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

    if (!user || user.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Only tutors can access this endpoint' }, { status: 403 })
    }

    const body = await request.json()
    const { availability } = body

    // Validate availability data
    if (!Array.isArray(availability)) {
      return NextResponse.json({ error: 'Invalid availability data' }, { status: 400 })
    }

    // Validate each availability slot
    for (const slot of availability) {
      if (
        typeof slot.dayOfWeek !== 'number' ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6 ||
        typeof slot.startTime !== 'string' ||
        typeof slot.endTime !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid availability slot data' }, { status: 400 })
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 })
      }

      // Validate start time is before end time
      if (slot.startTime >= slot.endTime) {
        return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 })
      }
    }

    // Delete existing availability for the tutor
    await prisma.tutorAvailability.deleteMany({
      where: { tutorId: user.id }
    })

    // Create new availability records
    const createdAvailability = await prisma.tutorAvailability.createMany({
      data: availability.map(slot => ({
        tutorId: user.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime
      }))
    })

    // Fetch and return the updated availability
    const updatedAvailability = await prisma.tutorAvailability.findMany({
      where: { tutorId: user.id },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'tutor_availability_updated',
        description: `Tutor ${session.user.email} updated their availability`,
        userId: user.id
      }
    })

    return NextResponse.json({
      message: 'Availability updated successfully',
      availability: updatedAvailability
    })
  } catch (error) {
    console.error('Error updating tutor availability:', error)
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    )
  }
}

// DELETE: Remove specific availability slot
export async function DELETE(request: NextRequest) {
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

    if (!user || user.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Only tutors can access this endpoint' }, { status: 403 })
    }

    const body = await request.json()
    const { availabilityId } = body

    if (!availabilityId) {
      return NextResponse.json({ error: 'Availability ID is required' }, { status: 400 })
    }

    // Verify the availability belongs to the tutor
    const availability = await prisma.tutorAvailability.findUnique({
      where: { id: availabilityId }
    })

    if (!availability || availability.tutorId !== user.id) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 })
    }

    // Delete the availability
    await prisma.tutorAvailability.delete({
      where: { id: availabilityId }
    })

    return NextResponse.json({ message: 'Availability slot deleted successfully' })
  } catch (error) {
    console.error('Error deleting tutor availability:', error)
    return NextResponse.json(
      { error: 'Failed to delete availability' },
      { status: 500 }
    )
  }
}