import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { randomBytes } from 'crypto'

// Generate a unique invite key for students
function generateInviteKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = 'UP-' // UpstartPrep prefix
  for (let i = 0; i < 6; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, password, role, isAdmin } = body
    
    // Debug logging
    console.log('Registration attempt:', { email, name, role, isAdmin, hasPassword: !!password })

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role && !Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate invite key if user is a student
    let inviteKey = undefined
    if (role === Role.STUDENT) {
      // Generate a unique invite key
      let keyIsUnique = false
      while (!keyIsUnique) {
        inviteKey = generateInviteKey()
        const existingKey = await prisma.user.findUnique({
          where: { inviteKey }
        })
        if (!existingKey) {
          keyIsUnique = true
        }
      }
    }

    // Generate calendar token for all users
    const calendarToken = randomBytes(32).toString('hex')
    
    // Debug: Log the data being sent to Prisma
    const userData = {
      email,
      name: name || null,
      hashedPassword,
      role: role || Role.PARENT, // Default to PARENT if not specified
      inviteKey: inviteKey || null,
      isAdmin: isAdmin || false, // Support admin flag from registration
      isActive: true, // New accounts are active by default
      calendarToken // Auto-generate calendar token for all new users
    }
    console.log('Creating user with data:', { ...userData, hashedPassword: '[HIDDEN]' })
    
    const user = await prisma.user.create({
      data: userData
    })

    const { hashedPassword: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userWithoutPassword
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Something went wrong during registration. Please try again.' },
      { status: 500 }
    )
  }
}