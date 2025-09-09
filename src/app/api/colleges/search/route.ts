import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')?.toLowerCase()
    const state = searchParams.get('state')
    const minSAT = searchParams.get('minSAT')
    const maxSAT = searchParams.get('maxSAT')
    const minACT = searchParams.get('minACT')
    const maxACT = searchParams.get('maxACT')
    const minAdmissionRate = searchParams.get('minAdmissionRate')
    const maxAdmissionRate = searchParams.get('maxAdmissionRate')
    const type = searchParams.get('type')
    const size = searchParams.get('size')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build where clause
    const where: any = {}

    if (query) {
      where.OR = [
        { searchName: { contains: query } },
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (state) {
      where.state = state
    }

    if (type) {
      where.type = type
    }

    if (size) {
      where.size = size
    }

    // SAT score filters
    if (minSAT || maxSAT) {
      where.AND = where.AND || []
      if (minSAT) {
        where.AND.push({
          satTotalHigh: { gte: parseInt(minSAT) }
        })
      }
      if (maxSAT) {
        where.AND.push({
          satTotalLow: { lte: parseInt(maxSAT) }
        })
      }
    }

    // ACT score filters
    if (minACT || maxACT) {
      where.AND = where.AND || []
      if (minACT) {
        where.AND.push({
          actCompositeHigh: { gte: parseInt(minACT) }
        })
      }
      if (maxACT) {
        where.AND.push({
          actCompositeLow: { lte: parseInt(maxACT) }
        })
      }
    }

    // Admission rate filters
    if (minAdmissionRate || maxAdmissionRate) {
      where.AND = where.AND || []
      if (minAdmissionRate) {
        where.AND.push({
          admissionRate: { gte: parseFloat(minAdmissionRate) }
        })
      }
      if (maxAdmissionRate) {
        where.AND.push({
          admissionRate: { lte: parseFloat(maxAdmissionRate) }
        })
      }
    }

    // Get total count
    const totalCount = await prisma.college.count({ where })

    // Get colleges with pagination
    const colleges = await prisma.college.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        type: true,
        size: true,
        admissionRate: true,
        satTotalLow: true,
        satTotalHigh: true,
        actCompositeLow: true,
        actCompositeHigh: true,
        inStateTuition: true,
        outStateTuition: true,
        category: true,
        website: true,
      }
    })

    // Get student's college list if they have one
    let studentColleges: string[] = []
    if (session.user.role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { studentId: session.user.id },
        include: {
          colleges: {
            select: { collegeId: true }
          }
        }
      })
      if (studentProfile) {
        studentColleges = studentProfile.colleges.map(c => c.collegeId)
      }
    }

    // Format response
    const formattedColleges = colleges.map(college => ({
      ...college,
      admissionRate: college.admissionRate ? (college.admissionRate * 100).toFixed(1) + '%' : null,
      satRange: college.satTotalLow && college.satTotalHigh 
        ? `${college.satTotalLow}-${college.satTotalHigh}` 
        : null,
      actRange: college.actCompositeLow && college.actCompositeHigh 
        ? `${college.actCompositeLow}-${college.actCompositeHigh}` 
        : null,
      isInMyList: studentColleges.includes(college.id)
    }))

    return NextResponse.json({
      colleges: formattedColleges,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error searching colleges:', error)
    return NextResponse.json(
      { error: 'Failed to search colleges' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}