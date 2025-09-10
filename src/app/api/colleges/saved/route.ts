import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET saved colleges
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const savedColleges = await prisma.savedCollege.findMany({
      where: {
        studentId: session.user.id
      },
      include: {
        college: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ 
      savedColleges: savedColleges.map(sc => sc.college)
    })
  } catch (error) {
    console.error('Error fetching saved colleges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved colleges' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST save/unsave college
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { collegeId, action } = await req.json()
    
    if (!collegeId || !action) {
      return NextResponse.json(
        { error: 'College ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'save') {
      // Check if already saved
      const existing = await prisma.savedCollege.findUnique({
        where: {
          studentId_collegeId: {
            studentId: session.user.id,
            collegeId: collegeId
          }
        }
      })

      if (existing) {
        return NextResponse.json({ 
          success: true, 
          message: 'College already saved',
          saved: true
        })
      }

      // Save the college
      await prisma.savedCollege.create({
        data: {
          studentId: session.user.id,
          collegeId: collegeId
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'College saved',
        saved: true
      })
    } else if (action === 'unsave') {
      // Remove saved college
      await prisma.savedCollege.delete({
        where: {
          studentId_collegeId: {
            studentId: session.user.id,
            collegeId: collegeId
          }
        }
      }).catch(() => {
        // Ignore if not found
      })

      return NextResponse.json({ 
        success: true, 
        message: 'College unsaved',
        saved: false
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "save" or "unsave"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error saving college:', error)
    return NextResponse.json(
      { error: 'Failed to save college' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}