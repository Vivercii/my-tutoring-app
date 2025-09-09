import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/[userId] - Get user details
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        programAccess: true,
        studentProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to fetch user' 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params
  
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { isActive, isAdmin, name, email, program, phoneNumber, timezone, address, city, state, zipCode, country, preferredContact, zoomLink } = body

    // Get the user to check their role
    const existingUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from deactivating their own account
    if (params.userId === session.user.id && isActive === false) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Prevent admin from removing their own admin status
    if (params.userId === session.user.id && isAdmin === false) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin privileges' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      ...(isActive !== undefined && { isActive }),
      ...(isAdmin !== undefined && { isAdmin }),
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(timezone !== undefined && { timezone }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zipCode !== undefined && { zipCode }),
      ...(country !== undefined && { country }),
      ...(preferredContact !== undefined && { preferredContact }),
      ...(zoomLink !== undefined && { zoomLink })
    }

    // If updating a student and program is provided, update the student profile
    if (existingUser.role === 'STUDENT' && program) {
      try {
        // First check if student profile exists
        const studentProfile = await prisma.studentProfile.findUnique({
          where: { studentId: params.userId }
        })

        if (studentProfile) {
          // Update existing student profile
          await prisma.studentProfile.update({
            where: { studentId: params.userId },
            data: { program }
          })
        } else {
          // Create student profile if it doesn't exist
          await prisma.studentProfile.create({
            data: {
              studentId: params.userId,
              program
            }
          })
        }
      } catch (profileError: any) {
        console.error('Student profile update error:', profileError)
        // Check if it's a validation error for the program enum
        if (profileError.message?.includes('Invalid value for argument `program`')) {
          return NextResponse.json(
            { error: `Invalid program value. Must be one of: SAT, ACT, ISEE, SSAT, HSPT, ACADEMIC_SUPPORT` },
            { status: 400 }
          )
        }
        throw profileError
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        isActive: true,
        phoneNumber: true,
        timezone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        preferredContact: true,
        zoomLink: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: {
          select: {
            program: true,
            gradeLevel: true,
            school: true
          }
        }
      }
    })

    // Log admin activity
    await prisma.activity.create({
      data: {
        type: 'admin_user_update',
        description: `Admin ${session.user.email} updated user ${updatedUser.email}`,
        userId: session.user.id
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Admin user update error:', error)
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params
  
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Prevent admin from deleting their own account
    if (params.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get user info before deletion for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (this will cascade delete related records based on your schema)
    await prisma.user.delete({
      where: { id: params.userId }
    })

    // Log admin activity
    await prisma.activity.create({
      data: {
        type: 'admin_user_delete',
        description: `Admin ${session.user.email} deleted user ${userToDelete.email}`,
        userId: session.user.id
      }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}