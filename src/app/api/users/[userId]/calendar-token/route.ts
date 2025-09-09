import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// GET: Fetch user's calendar token
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params
  const { userId } = params

  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the requesting user
    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true,
        managedStudents: {
          where: {
            studentProfile: {
              studentId: userId
            }
          }
        }
      }
    })

    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization
    const isAuthorized = 
      requestingUser.id === userId || // User viewing their own token
      (requestingUser.role === 'PARENT' && requestingUser.managedStudents.length > 0) || // Parent viewing their child's
      requestingUser.role === 'PROGRAM_COORDINATOR' // Admin access

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the user's calendar token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { calendarToken: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate token if it doesn't exist
    let token = user.calendarToken
    if (!token) {
      token = randomBytes(32).toString('hex')
      await prisma.user.update({
        where: { id: userId },
        data: { calendarToken: token }
      })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error fetching calendar token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar token' },
      { status: 500 }
    )
  }
}

// POST: Regenerate calendar token
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params
  const { userId } = params

  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the requesting user
    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true,
        managedStudents: {
          where: {
            studentProfile: {
              studentId: userId
            }
          }
        }
      }
    })

    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization
    const isAuthorized = 
      requestingUser.id === userId || // User regenerating their own token
      (requestingUser.role === 'PARENT' && requestingUser.managedStudents.length > 0) || // Parent regenerating their child's
      requestingUser.role === 'PROGRAM_COORDINATOR' // Admin access

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate new token
    const newToken = randomBytes(32).toString('hex')
    
    // Update user with new token
    await prisma.user.update({
      where: { id: userId },
      data: { calendarToken: newToken }
    })

    return NextResponse.json({ token: newToken })
  } catch (error) {
    console.error('Error regenerating calendar token:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate calendar token' },
      { status: 500 }
    )
  }
}