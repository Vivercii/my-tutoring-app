import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hours, description, sessionId } = await req.json()

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Invalid hours amount' }, { status: 400 })
    }

    // Get current credit balance
    const credit = await prisma.sessionCredit.findUnique({
      where: { userId: session.user.id },
    })

    if (!credit) {
      return NextResponse.json({ error: 'No credit balance found' }, { status: 404 })
    }

    if (credit.hours < hours) {
      return NextResponse.json({ 
        error: 'Insufficient hours', 
        available: credit.hours,
        requested: hours 
      }, { status: 400 })
    }

    const balanceBefore = credit.hours
    const balanceAfter = credit.hours - hours

    // Update credit balance
    const updatedCredit = await prisma.sessionCredit.update({
      where: { userId: session.user.id },
      data: {
        hours: balanceAfter,
        totalUsed: credit.totalUsed + hours,
      },
    })

    // Create transaction record
    await prisma.hourTransaction.create({
      data: {
        type: 'USAGE',
        hours: -hours, // Negative for deduction
        balanceBefore,
        balanceAfter,
        description: description || `Used ${hours} hours for tutoring session`,
        sessionId,
        userId: session.user.id,
        creditId: credit.id,
      }
    })

    return NextResponse.json({
      success: true,
      balanceBefore,
      balanceAfter,
      hoursUsed: hours,
    })
  } catch (error) {
    console.error('Error using credits:', error)
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    )
  }
}