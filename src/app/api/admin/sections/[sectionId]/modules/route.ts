import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/sections/[sectionId]/modules - Create a new module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sectionId } = await params
    const data = await request.json()
    const { title, timeLimit } = data

    // Get the highest order number for existing modules
    const lastModule = await prisma.examModule.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' }
    })

    const newOrder = lastModule ? lastModule.order + 1 : 1

    const module = await prisma.examModule.create({
      data: {
        title: title || `Module ${newOrder}`,
        order: newOrder,
        timeLimit: timeLimit || null,
        sectionId
      },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(module)
  } catch (error) {
    console.error('Error creating module:', error)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}