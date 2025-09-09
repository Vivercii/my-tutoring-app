import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST /api/admin/users/[userId]/program-access - Add program access for a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const userId = resolvedParams.userId
    
    const { program } = await request.json()
    
    if (!userId || !program) {
      return NextResponse.json({ error: 'User ID and program required' }, { status: 400 })
    }

    // Check if access already exists
    const existingAccess = await prisma.programAccess.findUnique({
      where: {
        userId_program: {
          userId,
          program
        }
      }
    })

    if (existingAccess) {
      return NextResponse.json({ message: 'Program access already exists' })
    }

    // Create program access
    const programAccess = await prisma.programAccess.create({
      data: {
        userId,
        program
      }
    })

    // Also update student profile if it exists
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: userId }
    })

    if (studentProfile && !studentProfile.program) {
      await prisma.studentProfile.update({
        where: { studentId: userId },
        data: { program }
      })
    }

    return NextResponse.json(programAccess)
  } catch (error: any) {
    console.error('Error adding program access:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to add program access' 
    }, { status: 500 })
  }
}

// GET /api/admin/users/[userId]/program-access - Get program access for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const userId = resolvedParams.userId

    const programAccess = await prisma.programAccess.findMany({
      where: { userId }
    })

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: userId }
    })

    return NextResponse.json({
      programAccess,
      studentProfile
    })
  } catch (error: any) {
    console.error('Error fetching program access:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to fetch program access' 
    }, { status: 500 })
  }
}

// DELETE /api/admin/users/[userId]/program-access - Remove program access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const userId = resolvedParams.userId
    
    const { program } = await request.json()
    
    if (!userId || !program) {
      return NextResponse.json({ error: 'User ID and program required' }, { status: 400 })
    }

    await prisma.programAccess.delete({
      where: {
        userId_program: {
          userId,
          program
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing program access:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to remove program access' 
    }, { status: 500 })
  }
}