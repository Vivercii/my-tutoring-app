import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the user's credit record with transactions
    const creditRecord = await prisma.sessionCredit.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 transactions
        },
      },
    })

    // Also get payment records for additional context
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      currentBalance: creditRecord?.hours || 0,
      totalPurchased: creditRecord?.totalPurchased || 0,
      totalUsed: creditRecord?.totalUsed || 0,
      transactions: creditRecord?.transactions || [],
      payments: payments || [],
    })
  } catch (error) {
    console.error('Failed to fetch transaction history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    )
  }
}