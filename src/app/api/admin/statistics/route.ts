import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get date ranges
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Get revenue statistics
    const [weekRevenue, monthRevenue, quarterRevenue, yearRevenue, totalRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          createdAt: { gte: startOfWeek }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          createdAt: { gte: startOfQuarter }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          createdAt: { gte: startOfYear }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true }
      })
    ])

    // Get user growth statistics
    const [newUsersWeek, newUsersMonth, activeUsersWeek] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startOfWeek } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: startOfWeek } }
      })
    ])

    // Get program distribution
    const programDistribution = await prisma.studentProfile.groupBy({
      by: ['program'],
      _count: { program: true }
    })

    // Get session statistics
    const [totalSessions, sessionsThisMonth, averageSessionDuration] = await Promise.all([
      prisma.sessionLog.count(),
      prisma.sessionLog.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.sessionLog.aggregate({
        _avg: { duration: true }
      })
    ])

    // Get top performing students (by number of sessions)
    const topStudents = await prisma.studentProfile.findMany({
      include: {
        student: {
          select: { name: true, email: true }
        },
        _count: {
          select: { sessionLogs: true }
        }
      },
      orderBy: {
        sessionLogs: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    return NextResponse.json({
      revenue: {
        week: weekRevenue._sum.amount || 0,
        month: monthRevenue._sum.amount || 0,
        quarter: quarterRevenue._sum.amount || 0,
        year: yearRevenue._sum.amount || 0,
        total: totalRevenue._sum.amount || 0
      },
      userGrowth: {
        newUsersWeek,
        newUsersMonth,
        activeUsersWeek
      },
      programs: programDistribution.map(p => ({
        name: p.program,
        count: p._count.program
      })),
      sessions: {
        total: totalSessions,
        thisMonth: sessionsThisMonth,
        averageDuration: averageSessionDuration._avg.duration || 0
      },
      topStudents: topStudents.map(profile => ({
        name: profile.student.name,
        email: profile.student.email,
        program: profile.program,
        sessionCount: profile._count.sessionLogs
      })),
      recentActivities
    })
  } catch (error) {
    console.error('Admin statistics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}