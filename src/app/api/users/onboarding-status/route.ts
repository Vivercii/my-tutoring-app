import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        hasSeenWelcome: true,
        onboardingStep: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      hasSeenWelcome: user.hasSeenWelcome,
      onboardingStep: user.onboardingStep
    })
  } catch (error) {
    console.error('Failed to fetch onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { hasSeenWelcome, onboardingStep } = body

    const updateData: any = {}
    
    if (hasSeenWelcome !== undefined) {
      updateData.hasSeenWelcome = hasSeenWelcome
    }
    
    if (onboardingStep !== undefined) {
      updateData.onboardingStep = onboardingStep
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        hasSeenWelcome: true,
        onboardingStep: true
      }
    })

    return NextResponse.json({
      hasSeenWelcome: user.hasSeenWelcome,
      onboardingStep: user.onboardingStep
    })
  } catch (error) {
    console.error('Failed to update onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    )
  }
}