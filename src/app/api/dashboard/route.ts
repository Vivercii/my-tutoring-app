import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the full user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        students: true,
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get session logs for all students
    const sessionLogs = await prisma.sessionLog.findMany({
      where: {
        student: {
          userId: user.id
        }
      },
      include: {
        student: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate stats
    const completedSessions = sessionLogs.length
    const totalRatings = sessionLogs.filter(s => s.rating !== null)
    const averageRating = totalRatings.length > 0 
      ? totalRatings.reduce((sum, s) => sum + (s.rating || 0), 0) / totalRatings.length 
      : 0
    
    // Calculate total spent (mock calculation: $50 per session for now)
    const totalSpent = completedSessions * 50

    // Format upcoming sessions (empty for now, will be implemented later)
    const upcomingSessions: any[] = []

    // Format recent activities
    const recentActivities = user.activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      time: getRelativeTime(activity.timestamp)
    }))

    // If no activities, create a welcome activity
    if (recentActivities.length === 0) {
      await prisma.activity.create({
        data: {
          type: 'account_created',
          description: 'Welcome to UpstartPrep Tutoring!',
          userId: user.id
        }
      })
      
      recentActivities.push({
        id: 'welcome',
        type: 'account_created',
        description: 'Welcome to UpstartPrep Tutoring!',
        time: 'Just now'
      })
    }

    // Prepare dashboard data
    const dashboardData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      stats: {
        sessionBalance: 12, // Mock value for now
        sessionsCompleted: completedSessions,
        averageRating: Math.round(averageRating * 10) / 10,
        totalSpent
      },
      upcomingSessions,
      recentActivities,
      students: user.students
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}