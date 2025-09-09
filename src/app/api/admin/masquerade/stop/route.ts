import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  console.log('[MASQUERADE STOP] Stop request received')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[MASQUERADE STOP] Current session:', {
      email: session?.user?.email,
      isAdmin: session?.user?.isAdmin,
      masquerading: !!session?.user?.masquerading
    })
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Masquerade stopped',
      returnToAdmin: true
    })

    // Clear the masquerade cookie
    response.cookies.set('masquerade', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expire immediately
    })

    return response
  } catch (error) {
    console.error('Error stopping masquerade:', error)
    return NextResponse.json({ error: 'Failed to stop masquerade' }, { status: 500 })
  }
}