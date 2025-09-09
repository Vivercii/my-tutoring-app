import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user and their credits
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        credits: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return the hours and stats, default to 0 if no credits exist
    return NextResponse.json({
      hours: user.credits?.hours || 0,
      totalPurchased: user.credits?.totalPurchased || 0,
      totalUsed: user.credits?.totalUsed || 0,
      userId: user.id,
    })
  } catch (error) {
    console.error('Failed to fetch credits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}