import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, password, role } = body

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

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: role || Role.PARENT // Default to PARENT if not specified
      }
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
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}