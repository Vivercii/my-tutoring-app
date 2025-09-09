import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/banners/active - Get active banners for display
export async function GET(request: NextRequest) {
  try {
    // Fetch only active banners
    const banners = await prisma.marketingBanner.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        htmlContent: true,
        cssContent: true,
        linkUrl: true
      }
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching active banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}