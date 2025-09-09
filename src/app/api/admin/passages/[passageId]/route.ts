import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/admin/passages/[passageId] - Get a single passage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passageId } = await params

    const passage = await prisma.passage.findUnique({
      where: { id: passageId },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    if (!passage) {
      return NextResponse.json({ error: 'Passage not found' }, { status: 404 })
    }

    return NextResponse.json(passage)
  } catch (error) {
    console.error('Error fetching passage:', error)
    return NextResponse.json({ error: 'Failed to fetch passage' }, { status: 500 })
  }
}

// PUT /api/admin/passages/[passageId] - Update a passage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passageId } = await params
    const data = await request.json()
    const { title, content, program } = data

    const passage = await prisma.passage.update({
      where: { id: passageId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(program !== undefined && { program })
      },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    })

    return NextResponse.json(passage)
  } catch (error) {
    console.error('Error updating passage:', error)
    return NextResponse.json({ error: 'Failed to update passage' }, { status: 500 })
  }
}

// DELETE /api/admin/passages/[passageId] - Delete a passage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passageId } = await params

    // Check if passage has questions
    const passage = await prisma.passage.findUnique({
      where: { id: passageId },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    })

    if (!passage) {
      return NextResponse.json({ error: 'Passage not found' }, { status: 404 })
    }

    if (passage._count.questions > 0) {
      return NextResponse.json({ 
        error: `Cannot delete passage with ${passage._count.questions} linked questions. Remove or reassign questions first.` 
      }, { status: 400 })
    }

    await prisma.passage.delete({
      where: { id: passageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting passage:', error)
    return NextResponse.json({ error: 'Failed to delete passage' }, { status: 500 })
  }
}