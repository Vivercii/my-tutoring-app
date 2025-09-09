import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/modules/[moduleId] - Update a module
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { moduleId } = await params
    const data = await request.json()
    const { title, order, timeLimit } = data

    const module = await prisma.examModule.update({
      where: { id: moduleId },
      data: {
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order }),
        ...(timeLimit !== undefined && { timeLimit })
      }
    })

    return NextResponse.json(module)
  } catch (error) {
    console.error('Error updating module:', error)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

// DELETE /api/admin/modules/[moduleId] - Delete a module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { moduleId } = await params

    // Cascade delete will handle questions
    await prisma.examModule.delete({
      where: { id: moduleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}