import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the parent user
    const parentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!parentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify the user is a parent
    if (parentUser.role !== Role.PARENT) {
      return NextResponse.json(
        { error: 'Only parents can link student accounts' },
        { status: 403 }
      )
    }

    // Get the invite key and relationship type from the request body
    const { inviteKey, relationshipType = 'parent' } = await req.json()

    if (!inviteKey) {
      return NextResponse.json(
        { error: 'Invite key is required' },
        { status: 400 }
      )
    }

    // Find the student with this invite key
    const studentUser = await prisma.user.findUnique({
      where: { inviteKey: inviteKey.toUpperCase() },
      include: {
        studentProfile: true
      }
    })

    if (!studentUser) {
      return NextResponse.json(
        { error: 'Invalid invite key' },
        { status: 404 }
      )
    }

    // Verify the user is a student
    if (studentUser.role !== Role.STUDENT) {
      return NextResponse.json(
        { error: 'This invite key does not belong to a student account' },
        { status: 400 }
      )
    }

    // Create student profile if it doesn't exist
    let studentProfile = studentUser.studentProfile
    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: {
          studentId: studentUser.id,
          program: 'ACADEMIC_SUPPORT'
        }
      })
    }

    // Check if this parent is already linked to this student
    const existingLink = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentProfileId: {
          parentId: parentUser.id,
          studentProfileId: studentProfile.id
        }
      }
    })

    if (existingLink) {
      return NextResponse.json(
        { error: 'You are already linked to this student' },
        { status: 409 }
      )
    }

    // Check if this is the first parent linking to this student
    const existingParents = await prisma.parentStudent.count({
      where: { studentProfileId: studentProfile.id }
    })

    // Create the link between parent and student
    const parentStudentLink = await prisma.parentStudent.create({
      data: {
        parentId: parentUser.id,
        studentProfileId: studentProfile.id,
        relationshipType: relationshipType,
        isPrimary: existingParents === 0, // First parent is primary
        canManageAccount: true
      },
      include: {
        studentProfile: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                inviteKey: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Student account linked successfully',
      student: parentStudentLink,
      isPrimaryParent: parentStudentLink.isPrimary
    })
    
  } catch (error) {
    console.error('Failed to link student account:', error)
    return NextResponse.json(
      { error: 'Failed to link student account' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch all linked students for a parent
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the parent user
    const parentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!parentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all linked students with their profiles
    const linkedStudents = await prisma.parentStudent.findMany({
      where: { parentId: parentUser.id },
      include: {
        studentProfile: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                inviteKey: true,
                phoneNumber: true,
                timezone: true,
                createdAt: true
              }
            },
            sessionLogs: {
              orderBy: { date: 'desc' },
              take: 5 // Get last 5 sessions for each student
            },
            parents: {
              include: {
                parent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transform the data for backward compatibility
    const students = linkedStudents.map(link => ({
      id: link.id,
      parentId: link.parentId,
      studentId: link.studentProfile.studentId,
      program: link.studentProfile.program,
      gradeLevel: link.studentProfile.gradeLevel,
      school: link.studentProfile.school,
      targetScore: link.studentProfile.targetScore,
      currentScore: link.studentProfile.currentScore,
      student: link.studentProfile.student,
      sessionLogs: link.studentProfile.sessionLogs,
      relationshipType: link.relationshipType,
      isPrimary: link.isPrimary,
      otherParents: link.studentProfile.parents
        .filter(p => p.parentId !== parentUser.id)
        .map(p => ({
          ...p.parent,
          relationshipType: p.relationshipType,
          isPrimary: p.isPrimary
        }))
    }))

    return NextResponse.json({
      students: students
    })
    
  } catch (error) {
    console.error('Failed to fetch linked students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to unlink a student (only for primary parents or the linking parent)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { studentProfileId } = await req.json()

    if (!studentProfileId) {
      return NextResponse.json(
        { error: 'Student profile ID is required' },
        { status: 400 }
      )
    }

    // Get the parent user
    const parentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!parentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find the link
    const link = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentProfileId: {
          parentId: parentUser.id,
          studentProfileId: studentProfileId
        }
      }
    })

    if (!link) {
      return NextResponse.json(
        { error: 'You are not linked to this student' },
        { status: 404 }
      )
    }

    // Delete the link
    await prisma.parentStudent.delete({
      where: {
        parentId_studentProfileId: {
          parentId: parentUser.id,
          studentProfileId: studentProfileId
        }
      }
    })

    // If this was the primary parent, make the next parent primary
    if (link.isPrimary) {
      const nextParent = await prisma.parentStudent.findFirst({
        where: { studentProfileId: studentProfileId },
        orderBy: { createdAt: 'asc' }
      })

      if (nextParent) {
        await prisma.parentStudent.update({
          where: { id: nextParent.id },
          data: { isPrimary: true }
        })
      }
    }

    return NextResponse.json({
      message: 'Student unlinked successfully'
    })
    
  } catch (error) {
    console.error('Failed to unlink student:', error)
    return NextResponse.json(
      { error: 'Failed to unlink student' },
      { status: 500 }
    )
  }
}