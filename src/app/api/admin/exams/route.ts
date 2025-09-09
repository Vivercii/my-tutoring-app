import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/exams - Fetch all exams with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if we need detailed data
    const searchParams = request.nextUrl.searchParams
    const includeDetails = searchParams.get('details') === 'true'

    const exams = await prisma.exam.findMany({
      include: {
        sections: includeDetails ? {
          include: {
            modules: {
              include: {
                _count: {
                  select: {
                    questions: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        } : false,
        _count: {
          select: {
            sections: true,
            assignments: true
          }
        }
      },
      orderBy: [
        { program: 'asc' },
        { examNumber: 'asc' },
        { title: 'asc' }
      ]
    })

    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

// POST /api/admin/exams - Create a new exam
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { title, description, program } = data

    if (!title || !program) {
      return NextResponse.json({ error: 'Title and program are required' }, { status: 400 })
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description: description || '',
        program
      }
    })

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}