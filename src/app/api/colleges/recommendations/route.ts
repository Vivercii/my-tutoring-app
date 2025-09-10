import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create student profile with current scores
    let studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: session.user.id }
    })

    if (!studentProfile) {
      // Create a basic profile
      studentProfile = await prisma.studentProfile.create({
        data: {
          studentId: session.user.id,
          program: 'ACADEMIC_SUPPORT'
        }
      })
    }

    // Parse student's scores
    let studentSAT: number | null = null
    let studentACT: number | null = null

    if (studentProfile.currentScore) {
      // Try to parse as SAT score (400-1600)
      const score = parseInt(studentProfile.currentScore)
      if (!isNaN(score)) {
        if (score >= 400 && score <= 1600) {
          studentSAT = score
        } else if (score >= 1 && score <= 36) {
          studentACT = score
        }
      }
    }

    if (!studentSAT && !studentACT) {
      return NextResponse.json({
        message: 'Please add your test scores to get personalized recommendations',
        recommendations: {
          dream: [],
          target: [],
          safety: []
        }
      })
    }

    // Get colleges already in student's list
    const existingColleges = await prisma.studentCollege.findMany({
      where: { studentProfileId: studentProfile.id },
      select: { collegeId: true }
    })
    const existingCollegeIds = existingColleges.map(c => c.collegeId)

    // Find dream schools (where student's score is below 25th percentile)
    const dreamSchools = await prisma.college.findMany({
      where: {
        id: { notIn: existingCollegeIds },
        ...(studentSAT ? {
          satTotalLow: { gt: studentSAT }
        } : {
          actCompositeLow: { gt: studentACT! }
        })
      },
      orderBy: [
        { admissionRate: 'asc' },
        { name: 'asc' }
      ],
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        admissionRate: true,
        satTotalLow: true,
        satTotalHigh: true,
        actCompositeLow: true,
        actCompositeHigh: true,
        category: true
      }
    })

    // Find target schools (where student's score is between 25th and 75th percentile)
    const targetSchools = await prisma.college.findMany({
      where: {
        id: { notIn: existingCollegeIds },
        ...(studentSAT ? {
          AND: [
            { satTotalLow: { lte: studentSAT } },
            { satTotalHigh: { gte: studentSAT } }
          ]
        } : {
          AND: [
            { actCompositeLow: { lte: studentACT! } },
            { actCompositeHigh: { gte: studentACT! } }
          ]
        })
      },
      orderBy: [
        { admissionRate: 'desc' },
        { name: 'asc' }
      ],
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        admissionRate: true,
        satTotalLow: true,
        satTotalHigh: true,
        actCompositeLow: true,
        actCompositeHigh: true,
        category: true
      }
    })

    // Find safety schools (where student's score is above 75th percentile)
    const safetySchools = await prisma.college.findMany({
      where: {
        id: { notIn: existingCollegeIds },
        ...(studentSAT ? {
          satTotalHigh: { lt: studentSAT }
        } : {
          actCompositeHigh: { lt: studentACT! }
        }),
        admissionRate: { gte: 0.5 } // At least 50% acceptance rate for safety
      },
      orderBy: [
        { admissionRate: 'desc' },
        { name: 'asc' }
      ],
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        admissionRate: true,
        satTotalLow: true,
        satTotalHigh: true,
        actCompositeLow: true,
        actCompositeHigh: true,
        category: true
      }
    })

    // Format recommendations
    const formatCollege = (college: any) => ({
      id: college.id,
      name: college.name,
      location: `${college.city}, ${college.state}`,
      admissionRate: college.admissionRate ? (college.admissionRate * 100).toFixed(1) + '%' : null,
      satRange: college.satTotalLow && college.satTotalHigh 
        ? `${college.satTotalLow}-${college.satTotalHigh}` 
        : null,
      actRange: college.actCompositeLow && college.actCompositeHigh 
        ? `${college.actCompositeLow}-${college.actCompositeHigh}` 
        : null,
      category: college.category,
      matchReason: getMatchReason(college, studentSAT, studentACT)
    })

    return NextResponse.json({
      studentScore: {
        sat: studentSAT,
        act: studentACT
      },
      recommendations: {
        dream: dreamSchools.map(formatCollege),
        target: targetSchools.map(formatCollege),
        safety: safetySchools.map(formatCollege)
      }
    })
  } catch (error) {
    console.error('Error getting college recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

function getMatchReason(college: any, studentSAT: number | null, studentACT: number | null): string {
  if (studentSAT && college.satTotalLow && college.satTotalHigh) {
    if (studentSAT < college.satTotalLow) {
      return `Your SAT (${studentSAT}) is below their range`
    } else if (studentSAT > college.satTotalHigh) {
      return `Your SAT (${studentSAT}) is above their range`
    } else {
      return `Your SAT (${studentSAT}) fits their range`
    }
  }
  
  if (studentACT && college.actCompositeLow && college.actCompositeHigh) {
    if (studentACT < college.actCompositeLow) {
      return `Your ACT (${studentACT}) is below their range`
    } else if (studentACT > college.actCompositeHigh) {
      return `Your ACT (${studentACT}) is above their range`
    } else {
      return `Your ACT (${studentACT}) fits their range`
    }
  }
  
  return 'Based on admission rate'
}