import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    
    // Get environment info (safely)
    const envInfo = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    }
    
    return NextResponse.json({
      status: 'success',
      database: 'connected',
      userCount,
      environment: envInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      status: 'error',
      database: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      }
    }, { status: 500 })
  }
}