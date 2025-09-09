import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/passages - Get all passages with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const program = searchParams.get('program')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    
    if (program) where.program = program
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [passages, total] = await prisma.$transaction([
      prisma.passage.findMany({
        where,
        include: {
          _count: {
            select: { questions: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.passage.count({ where })
    ])

    return NextResponse.json({
      passages,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching passages:', error)
    return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 })
  }
}

// POST /api/admin/passages - Create a new passage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { title, content, program } = data

    if (!title || !content || !program) {
      return NextResponse.json({ 
        error: 'Title, content, and program are required' 
      }, { status: 400 })
    }

    const passage = await prisma.passage.create({
      data: {
        title,
        content,
        program
      },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    })

    return NextResponse.json(passage)
  } catch (error) {
    console.error('Error creating passage:', error)
    return NextResponse.json({ error: 'Failed to create passage' }, { status: 500 })
  }
}