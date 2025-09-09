import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/admin/exams/[examId]/sections - Get all sections for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = await params

    const sections = await prisma.examSection.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { questions: true }
            }
          }
        }
      }
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

// POST /api/admin/exams/[examId]/sections - Create a new section
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = await params
    const data = await request.json()
    const { title } = data

    if (!title) {
      return NextResponse.json({ error: 'Section title is required' }, { status: 400 })
    }

    // Get the highest order number for existing sections
    const lastSection = await prisma.examSection.findFirst({
      where: { examId },
      orderBy: { order: 'desc' }
    })

    const newOrder = lastSection ? lastSection.order + 1 : 1

    const section = await prisma.examSection.create({
      data: {
        title,
        order: newOrder,
        examId
      },
      include: {
        modules: true
      }
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}