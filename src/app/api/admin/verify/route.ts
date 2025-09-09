import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { isAdmin: false },
        { status: 400 }
      )
    }

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        isAdmin: true,
        isActive: true
      }
    })

    return NextResponse.json({
      isAdmin: user?.isAdmin && user?.isActive || false
    })
  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { isAdmin: false },
      { status: 500 }
    )
  }
}