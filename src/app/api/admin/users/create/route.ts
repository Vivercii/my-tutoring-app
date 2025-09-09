import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, Program } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
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
    const { 
      email, 
      name, 
      password, 
      role, 
      isAdmin, 
      phoneNumber,
      timezone,
      address,
      city,
      state,
      zipCode,
      country,
      preferredContact,
      programAccess // Array of programs for PROGRAM_COORDINATOR role
    } = body

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password if provided
    let hashedPassword = undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12)
    }

    // Generate invite key for students
    let inviteKey = undefined
    if (role === Role.STUDENT) {
      inviteKey = `UP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role,
        isAdmin: isAdmin || false,
        inviteKey,
        phoneNumber,
        timezone,
        address,
        city,
        state,
        zipCode,
        country,
        preferredContact,
        // Create program access entries if role is PROGRAM_COORDINATOR
        ...(role === Role.PROGRAM_COORDINATOR && programAccess && programAccess.length > 0 ? {
          programAccess: {
            create: programAccess.map((program: Program) => ({
              program
            }))
          }
        } : {}),
        // Create student profile if role is STUDENT
        ...(role === Role.STUDENT ? {
          studentProfile: {
            create: {
              program: Program.ACADEMIC_SUPPORT
            }
          }
        } : {})
      },
      include: {
        programAccess: true,
        studentProfile: true
      }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isAdmin: newUser.isAdmin,
        inviteKey: newUser.inviteKey,
        programAccess: newUser.programAccess
      }
    })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
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
    const { 
      userId,
      email, 
      name, 
      password, 
      role, 
      isAdmin, 
      isActive,
      phoneNumber,
      timezone,
      address,
      city,
      state,
      zipCode,
      country,
      preferredContact,
      programAccess // Array of programs for PROGRAM_COORDINATOR role
    } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { programAccess: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash password if provided
    let hashedPassword = undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email && { email }),
        ...(name !== undefined && { name }),
        ...(hashedPassword && { hashedPassword }),
        ...(role && { role }),
        ...(isAdmin !== undefined && { isAdmin }),
        ...(isActive !== undefined && { isActive }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(timezone && { timezone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zipCode !== undefined && { zipCode }),
        ...(country && { country }),
        ...(preferredContact && { preferredContact })
      },
      include: {
        programAccess: true,
        studentProfile: true
      }
    })

    // Handle program access updates for PROGRAM_COORDINATOR
    if (role === Role.PROGRAM_COORDINATOR && programAccess !== undefined) {
      // Delete existing program access
      await prisma.programAccess.deleteMany({
        where: { userId }
      })

      // Create new program access entries
      if (programAccess.length > 0) {
        await prisma.programAccess.createMany({
          data: programAccess.map((program: Program) => ({
            userId,
            program
          }))
        })
      }
    } else if (role !== Role.PROGRAM_COORDINATOR && existingUser.programAccess.length > 0) {
      // If role changed from PROGRAM_COORDINATOR to something else, remove program access
      await prisma.programAccess.deleteMany({
        where: { userId }
      })
    }

    // Fetch updated user with relations
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        programAccess: true,
        studentProfile: true
      }
    })

    return NextResponse.json({
      message: 'User updated successfully',
      user: finalUser
    })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}