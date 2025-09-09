import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoalType } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      studentId,
      examType,
      examDate,
      currentScore,
      targetScore,
      objectives,
      keyResults,
      school,
      gradeLevel,
      strengths,
      weaknesses,
      preferredSchedule
    } = body

    // Create or update student profile
    const studentProfile = await prisma.studentProfile.upsert({
      where: { studentId },
      create: {
        studentId,
        program: examType || 'ACADEMIC_SUPPORT',
        examDate: examDate ? new Date(examDate) : null,
        currentScore,
        targetScore,
        school,
        gradeLevel,
        strengths,
        weaknesses,
        preferredSchedule,
        hasCompletedOnboarding: true,
        onboardingStep: 4
      },
      update: {
        program: examType || 'ACADEMIC_SUPPORT',
        examDate: examDate ? new Date(examDate) : null,
        currentScore,
        targetScore,
        school,
        gradeLevel,
        strengths,
        weaknesses,
        preferredSchedule,
        hasCompletedOnboarding: true,
        onboardingStep: 4
      }
    })

    // Create objectives
    for (const objective of objectives) {
      if (objective.title) {
        const createdObjective = await prisma.studentGoal.create({
          data: {
            studentProfileId: studentProfile.id,
            type: GoalType.OBJECTIVE,
            title: objective.title,
            description: objective.description,
            status: 'NOT_STARTED'
          }
        })

        // Create key results for this objective
        for (const keyResult of keyResults) {
          if (keyResult.title) {
            await prisma.studentGoal.create({
              data: {
                studentProfileId: studentProfile.id,
                type: GoalType.KEY_RESULT,
                title: keyResult.title,
                targetValue: keyResult.targetValue,
                deadline: keyResult.deadline ? new Date(keyResult.deadline) : null,
                parentGoalId: createdObjective.id,
                status: 'NOT_STARTED'
              }
            })
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      profileId: studentProfile.id 
    })
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') || session.user.id

    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
      include: {
        goals: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json(profile || { hasCompletedOnboarding: false })
  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}