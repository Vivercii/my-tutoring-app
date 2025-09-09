import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get credit balance with transaction history
    const credit = await prisma.sessionCredit.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 transactions
        }
      }
    })

    if (!credit) {
      return NextResponse.json({
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        transactions: []
      })
    }

    // Get payment history
    const payments = await prisma.payment.findMany({
      where: { 
        userId: session.user.id,
        packageHours: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      balance: credit.hours,
      totalPurchased: credit.totalPurchased,
      totalUsed: credit.totalUsed,
      transactions: credit.transactions.map(t => ({
        id: t.id,
        type: t.type,
        hours: t.hours,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        description: t.description,
        createdAt: t.createdAt,
      })),
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        packageHours: p.packageHours,
        description: p.description,
        createdAt: p.createdAt,
        status: p.status,
      }))
    })
  } catch (error) {
    console.error('Error fetching credit history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit history' },
      { status: 500 }
    )
  }
}