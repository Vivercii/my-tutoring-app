import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// THIS IS FOR TESTING ONLY - Remove in production
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { hours, description } = await req.json()

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

    // Get or create credit record
    let creditRecord = await prisma.sessionCredit.findUnique({
      where: { userId: user.id },
    })

    const balanceBefore = creditRecord?.hours || 0
    const balanceAfter = balanceBefore + hours

    if (creditRecord) {
      // Update existing credits
      creditRecord = await prisma.sessionCredit.update({
        where: { userId: user.id },
        data: {
          hours: balanceAfter,
          totalPurchased: creditRecord.totalPurchased + hours,
        },
      })
    } else {
      // Create new credits
      creditRecord = await prisma.sessionCredit.create({
        data: {
          userId: user.id,
          hours: hours,
          totalPurchased: hours,
          totalUsed: 0,
        },
      })
    }

    // Create transaction record
    await prisma.hourTransaction.create({
      data: {
        type: 'PURCHASE',
        hours: hours,
        balanceBefore,
        balanceAfter,
        description: description || `Manual addition of ${hours} hours (TEST)`,
        userId: user.id,
        creditId: creditRecord.id,
      }
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        amount: hours * 60, // Assuming $60 per hour for test
        currency: 'usd',
        status: 'succeeded',
        description: description || `Manual test: ${hours} hours`,
        packageHours: hours,
        metadata: {
          test: true,
          addedManually: true,
        },
        userId: user.id,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully added ${hours} hours`,
      newBalance: balanceAfter,
      transaction: {
        type: 'PURCHASE',
        hours,
        balanceBefore,
        balanceAfter,
      }
    })
  } catch (error) {
    console.error('Manual add failed:', error)
    return NextResponse.json(
      { error: 'Failed to add hours', details: error },
      { status: 500 }
    )
  }
}