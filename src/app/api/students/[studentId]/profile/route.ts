import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ studentId: string }> }
) {
  try {
    const params = await props.params
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the authenticated user with role
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

    // Fetch the student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: params.studentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        parents: {
          where: user.role === 'PARENT' ? { parentId: user.id } : undefined,
          select: {
            parentId: true,
            relationshipType: true,
            isPrimary: true
          }
        }
      }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Authorization check
    const isAdmin = user.isAdmin
    const isParent = user.role === 'PARENT' && studentProfile.parents.length > 0
    const isStudent = user.id === params.studentId

    if (!isAdmin && !isParent && !isStudent) {
      return NextResponse.json({ error: 'Unauthorized to view this profile' }, { status: 403 })
    }

    return NextResponse.json(studentProfile)
  } catch (error) {
    console.error('Student profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    )
  }
}