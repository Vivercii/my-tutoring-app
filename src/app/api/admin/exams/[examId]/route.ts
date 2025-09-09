import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/exams/[examId] - Fetch a single exam with sections, modules, and questions
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

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: {
                    question: {
                      include: {
                        options: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}

// PUT /api/admin/exams/[examId] - Update exam details
export async function PUT(
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
    const { title, description, program } = data

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(program !== undefined && { program })
      }
    })

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error updating exam:', error)
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 })
  }
}

// PATCH /api/admin/exams/[examId] - Update exam status (publish/unpublish)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const examId = resolvedParams.examId
    
    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }
    
    const data = await request.json()
    const { title, description, isPublished } = data

    console.log('Updating exam:', examId, 'with data:', { title, description, isPublished })

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(isPublished !== undefined && { isPublished })
      }
    })

    return NextResponse.json(exam)
  } catch (error: any) {
    console.error('Error updating exam:', error)
    console.error('Error details:', error?.message)
    return NextResponse.json({ 
      error: error?.message || 'Failed to update exam' 
    }, { status: 500 })
  }
}

// DELETE /api/admin/exams/[examId] - Delete an exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = await params

    await prisma.exam.delete({
      where: { id: examId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exam:', error)
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}