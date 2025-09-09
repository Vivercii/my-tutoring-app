import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sessionId,
      sessionSubject,
      sessionTime,
      minutesBeforeSession,
      zoomLink
    } = body

    // Create zoom click record
    const zoomClick = await prisma.zoomClick.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name || 'Unknown',
        sessionId: sessionId || null,
        sessionSubject,
        sessionTime: new Date(sessionTime),
        clickedAt: new Date(),
        minutesBeforeSession,
        zoomLink,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    console.log(`[ZOOM CLICK] User ${session.user.email} clicked Zoom button:`, {
      sessionSubject,
      minutesBeforeSession,
      clickedAt: zoomClick.clickedAt
    })

    return NextResponse.json({ 
      success: true, 
      clickId: zoomClick.id,
      message: 'Zoom click tracked successfully' 
    })
  } catch (error) {
    console.error('Error tracking Zoom click:', error)
    return NextResponse.json(
      { error: 'Failed to track Zoom click' },
      { status: 500 }
    )
  }
}

// Get zoom click history for current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clicks = await prisma.zoomClick.findMany({
      where: {
        userEmail: session.user.email
      },
      orderBy: {
        clickedAt: 'desc'
      },
      take: 50 // Last 50 clicks
    })

    return NextResponse.json({ clicks })
  } catch (error) {
    console.error('Error fetching Zoom click history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch click history' },
      { status: 500 }
    )
  }
}