import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ studentId: string }> }
) {
  const params = await props.params
  console.log('GET /api/students/[studentId] - studentId:', params.studentId)
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.email)
    
    if (!session || !session.user?.email) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Finding user by email:', session.user.email)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        email: true,
        managedStudents: {
          where: {
            studentProfile: {
              student: {
                id: params.studentId
              }
            }
          },
          select: {
            studentProfileId: true
          }
        }
      }
    })

    console.log('User found:', user?.email, 'Role:', user?.role)
    console.log('Managed students count:', user?.managedStudents?.length)

    if (!user) {
      console.log('User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify parent manages this student or user is admin
    if (user.role === 'PARENT' && user.managedStudents.length === 0) {
      console.log('Parent does not manage this student')
      return NextResponse.json({ error: 'You do not have access to this student' }, { status: 403 })
    }

    console.log('Fetching student with profile...')
    // Get the student with their profile
    const student = await prisma.user.findUnique({
      where: { id: params.studentId },
      include: {
        studentProfile: {
          include: {
            parents: {
              include: {
                parent: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        tutors: {
          include: {
            tutor: {
              select: {
                id: true,
                name: true,
                email: true,
                tutorProfile: true
              }
            }
          }
        }
      }
    })

    console.log('Student found:', student?.name, 'Has profile:', !!student?.studentProfile)

    if (!student || !student.studentProfile) {
      console.log('Student not found or missing profile')
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    console.log('Returning student data successfully')
    return NextResponse.json(student)
  } catch (error) {
    console.error('Student detail API error - Full error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ studentId: string }> }
) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the authenticated user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        isAdmin: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      gradeLevel,
      school,
      learningGoals,
      academicGoals,
      strengths,
      weaknesses,
      preferredSchedule,
      targetScore,
      currentScore,
      program
    } = body

    // Check if student profile exists
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { 
        studentId: params.studentId
      },
      include: {
        parents: {
          where: { parentId: user.id }
        }
      }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Authorization logic
    const isAdmin = user.isAdmin
    const isParent = user.role === 'PARENT' && studentProfile.parents.length > 0
    const isStudent = user.id === params.studentId

    if (!isAdmin && !isParent && !isStudent) {
      return NextResponse.json({ error: 'Unauthorized to edit this profile' }, { status: 403 })
    }

    // Prepare update data based on role
    let updateData: any = {}

    if (isAdmin) {
      // Admins can update all fields
      updateData = {
        ...(gradeLevel !== undefined && { gradeLevel }),
        ...(school !== undefined && { school }),
        ...(academicGoals !== undefined && { academicGoals }),
        ...(strengths !== undefined && { strengths }),
        ...(weaknesses !== undefined && { weaknesses }),
        ...(preferredSchedule !== undefined && { preferredSchedule }),
        ...(targetScore !== undefined && { targetScore }),
        ...(currentScore !== undefined && { currentScore }),
        ...(program !== undefined && { program })
      }
    } else if (isParent) {
      // Parents can only update academicGoals (learning goals)
      if (academicGoals !== undefined) {
        updateData.academicGoals = academicGoals
      }
      
      // Reject any attempt to modify other fields
      const restrictedFields = ['gradeLevel', 'school', 'strengths', 'weaknesses', 
                               'preferredSchedule', 'targetScore', 'currentScore', 'program']
      const attemptedFields = Object.keys(body).filter(key => restrictedFields.includes(key))
      
      if (attemptedFields.length > 0) {
        return NextResponse.json(
          { error: `Parents can only edit learning goals. Cannot modify: ${attemptedFields.join(', ')}` },
          { status: 403 }
        )
      }
    } else if (isStudent) {
      // Students can update their own academic goals and preferences
      updateData = {
        ...(academicGoals !== undefined && { academicGoals }),
        ...(preferredSchedule !== undefined && { preferredSchedule }),
        ...(strengths !== undefined && { strengths }),
        ...(weaknesses !== undefined && { weaknesses })
      }
    }

    // Update the student profile
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentProfile.id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Log the activity
    await prisma.activity.create({
      data: {
        type: 'profile_update',
        description: `${user.role} updated student profile for ${updatedProfile.student.name || updatedProfile.student.email}`,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Student profile updated successfully'
    })
  } catch (error) {
    console.error('Student profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update student profile' },
      { status: 500 }
    )
  }
}