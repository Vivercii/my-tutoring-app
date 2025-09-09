import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ tutorId: string }> }
) {
  try {
    const params = await props.params
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { tutorId: params.tutorId },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
            zoomLink: true
          }
        }
      }
    })

    return NextResponse.json(tutorProfile)
  } catch (error) {
    console.error('Error fetching tutor profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutor profile' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ tutorId: string }> }
) {
  try {
    const params = await props.params
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      bio,
      hourlyRate,
      experienceYears,
      education,
      subjects,
      gradeLevels,
      languages,
      specializations,
      maxStudents
    } = body

    // Check if profile exists
    const existingProfile = await prisma.tutorProfile.findUnique({
      where: { tutorId: params.tutorId }
    })

    // Parse comma-separated strings into arrays
    const parseArray = (str: string) => {
      if (!str) return []
      return str.split(',').map((s: string) => s.trim()).filter(Boolean)
    }

    const profileData = {
      bio: bio || null,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      experienceYears: experienceYears ? parseInt(experienceYears) : null,
      education: education || null,
      subjects: parseArray(subjects),
      gradeLevels: parseArray(gradeLevels),
      languages: parseArray(languages),
      specializations: parseArray(specializations),
      maxStudents: maxStudents ? parseInt(maxStudents) : 10
    }

    let tutorProfile
    
    if (existingProfile) {
      // Update existing profile
      tutorProfile = await prisma.tutorProfile.update({
        where: { tutorId: params.tutorId },
        data: profileData,
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              timezone: true,
              zoomLink: true
            }
          }
        }
      })
    } else {
      // Create new profile
      tutorProfile = await prisma.tutorProfile.create({
        data: {
          tutorId: params.tutorId,
          ...profileData
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              timezone: true,
              zoomLink: true
            }
          }
        }
      })
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'tutor_profile_updated',
        description: `Admin ${session.user.email} updated tutor profile for ${tutorProfile.tutor.email}`,
        userId: session.user.id
      }
    })

    return NextResponse.json(tutorProfile)
  } catch (error) {
    console.error('Error updating tutor profile:', error)
    return NextResponse.json(
      { error: 'Failed to update tutor profile' },
      { status: 500 }
    )
  }
}