import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all tutors with their linked students count
    const tutors = await prisma.user.findMany({
      where: {
        role: Role.TUTOR,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        timezone: true,
        createdAt: true,
        _count: {
          select: {
            taughtStudents: true
          }
        },
        taughtStudents: {
          select: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Format the response
    const formattedTutors = tutors.map(tutor => ({
      id: tutor.id,
      name: tutor.name || 'Unnamed Tutor',
      email: tutor.email,
      phoneNumber: tutor.phoneNumber,
      timezone: tutor.timezone,
      studentCount: tutor._count.taughtStudents,
      students: tutor.taughtStudents.map(ts => ts.student)
    }))

    return NextResponse.json({
      tutors: formattedTutors
    })
  } catch (error) {
    console.error('Failed to fetch tutors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutors' },
      { status: 500 }
    )
  }
}