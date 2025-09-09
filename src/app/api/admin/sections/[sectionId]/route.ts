import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/sections/[sectionId] - Update a section
export async function PUT(
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
    const { title, order } = data

    const section = await prisma.examSection.update({
      where: { id: sectionId },
      data: {
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order })
      }
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

// DELETE /api/admin/sections/[sectionId] - Delete a section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sectionId } = await params

    // Cascade delete will handle modules and questions
    await prisma.examSection.delete({
      where: { id: sectionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}