import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/admin/banners - Get all banners
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banners = await prisma.marketingBanner.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// POST /api/admin/banners - Create a new banner
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { title, htmlContent, cssContent, linkUrl, isActive } = data

    if (!title || !htmlContent) {
      return NextResponse.json({ error: 'Title and HTML content are required' }, { status: 400 })
    }

    // Create banner in database
    const banner = await prisma.marketingBanner.create({
      data: {
        title,
        htmlContent,
        cssContent: cssContent || '',
        linkUrl: linkUrl || null,
        isActive: isActive || false
      }
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}