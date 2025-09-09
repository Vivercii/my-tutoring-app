import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  console.log('[MASQUERADE API] POST request received')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[MASQUERADE API] Current session user:', session?.user?.email, session?.user?.id)
    
    if (!session || !session.user?.isAdmin) {
      console.log('[MASQUERADE API] Unauthorized - not admin')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent masquerading if already masquerading
    if (session.user.masquerading) {
      console.log('[MASQUERADE API] Already masquerading')
      return NextResponse.json({ error: 'Already masquerading' }, { status: 400 })
    }

    const body = await request.json()
    const { targetUserId } = body
    console.log('[MASQUERADE API] Request body:', body)

    console.log('[MASQUERADE API] Start request from:', session.user.email)
    console.log('[MASQUERADE API] Target user ID:', targetUserId)

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
    }

    // Verify target user exists and is not an admin
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true, 
        name: true,
        email: true, 
        role: true,
        isAdmin: true,
        isActive: true,
        inviteKey: true
      }
    })

    if (!targetUser) {
      console.log('[MASQUERADE] Target user not found:', targetUserId)
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    console.log('[MASQUERADE] Found target user:', {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isAdmin: targetUser.isAdmin
    })
    
    // CRITICAL: Log exactly what we're comparing
    console.log('[MASQUERADE] Comparison check:', {
      targetUserId_received: targetUserId,
      targetUser_id_from_db: targetUser.id,
      are_they_equal: targetUserId === targetUser.id,
      session_user_id: session.user.id,
      is_same_as_session: targetUserId === session.user.id
    })

    if (targetUser.isAdmin) {
      return NextResponse.json({ error: 'Cannot masquerade as another admin' }, { status: 400 })
    }

    // Get current JWT token and update it with masquerading info
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 })
    }

    // Prepare masquerade data for the session
    const masqueradeData = {
      originalUserId: session.user.id,
      originalUserEmail: session.user.email,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      targetUserEmail: targetUser.email || '',
      targetUserRole: targetUser.role,
      targetUserIsActive: targetUser.isActive,
      targetUserInviteKey: targetUser.inviteKey
    }
    
    console.log('[MASQUERADE] Prepared masquerade data:', masqueradeData)

    // Create response with masquerade data
    const response = NextResponse.json({ 
      success: true, 
      message: `Now masquerading as ${targetUser.email}`,
      masqueradeData: masqueradeData,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    })

    // Also set a cookie for backup/reference (though we'll mainly use session)
    response.cookies.set('masquerade', JSON.stringify(masqueradeData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Error starting masquerade:', error)
    return NextResponse.json({ error: 'Failed to start masquerade' }, { status: 500 })
  }
}