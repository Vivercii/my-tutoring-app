import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET student's college list
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: session.user.id },
      include: {
        colleges: {
          include: {
            college: true
          },
          orderBy: [
            { listType: 'asc' },
            { addedAt: 'desc' }
          ]
        }
      }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Return the colleges as an array with all necessary data
    const formattedList = studentProfile.colleges.map(sc => ({
      id: sc.id,
      listType: sc.listType,
      status: sc.status,
      notes: sc.notes,
      applicationDeadline: sc.applicationDeadline,
      addedAt: sc.addedAt,
      college: {
        id: sc.college.id,
        name: sc.college.name,
        city: sc.college.city,
        state: sc.college.state,
        admissionRate: sc.college.admissionRate,
        satTotalLow: sc.college.satTotalLow,
        satTotalHigh: sc.college.satTotalHigh,
        actCompositeLow: sc.college.actCompositeLow,
        actCompositeHigh: sc.college.actCompositeHigh,
        inStateTuition: sc.college.inStateTuition,
        outStateTuition: sc.college.outStateTuition,
        ranking: sc.college.ranking,
        type: sc.college.type,
        size: sc.college.size,
        setting: sc.college.setting
      }
    }))

    return NextResponse.json(formattedList)
  } catch (error) {
    console.error('Error fetching college list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch college list' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Add college to list
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { collegeId, listType, notes, applicationDeadline } = body

    if (!collegeId || !listType) {
      return NextResponse.json(
        { error: 'College ID and list type are required' },
        { status: 400 }
      )
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Check if college exists
    const college = await prisma.college.findUnique({
      where: { id: collegeId }
    })

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    // Add college to student's list
    const studentCollege = await prisma.studentCollege.create({
      data: {
        studentProfileId: studentProfile.id,
        collegeId,
        listType,
        notes,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null
      },
      include: {
        college: true
      }
    })

    return NextResponse.json({
      message: 'College added to list',
      college: {
        id: studentCollege.college.id,
        name: studentCollege.college.name,
        city: studentCollege.college.city,
        state: studentCollege.college.state,
        listType: studentCollege.listType,
        status: studentCollege.status
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'College already in your list' },
        { status: 400 }
      )
    }
    console.error('Error adding college to list:', error)
    return NextResponse.json(
      { error: 'Failed to add college to list' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update college in list
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { collegeId, listType, status, notes, applicationDeadline, financialAidApplied, scholarshipAmount } = body

    if (!collegeId) {
      return NextResponse.json(
        { error: 'College ID is required' },
        { status: 400 }
      )
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Update college in student's list
    const studentCollege = await prisma.studentCollege.update({
      where: {
        studentProfileId_collegeId: {
          studentProfileId: studentProfile.id,
          collegeId
        }
      },
      data: {
        ...(listType && { listType }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(applicationDeadline !== undefined && { 
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null 
        }),
        ...(financialAidApplied !== undefined && { financialAidApplied }),
        ...(scholarshipAmount !== undefined && { scholarshipAmount })
      },
      include: {
        college: true
      }
    })

    return NextResponse.json({
      message: 'College updated',
      college: {
        id: studentCollege.college.id,
        name: studentCollege.college.name,
        listType: studentCollege.listType,
        status: studentCollege.status
      }
    })
  } catch (error) {
    console.error('Error updating college in list:', error)
    return NextResponse.json(
      { error: 'Failed to update college' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Remove college from list
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const collegeId = searchParams.get('collegeId')

    if (!collegeId) {
      return NextResponse.json(
        { error: 'College ID is required' },
        { status: 400 }
      )
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Remove college from student's list
    await prisma.studentCollege.delete({
      where: {
        studentProfileId_collegeId: {
          studentProfileId: studentProfile.id,
          collegeId
        }
      }
    })

    return NextResponse.json({ message: 'College removed from list' })
  } catch (error) {
    console.error('Error removing college from list:', error)
    return NextResponse.json(
      { error: 'Failed to remove college' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}