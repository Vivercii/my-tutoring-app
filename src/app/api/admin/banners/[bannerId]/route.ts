import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/banners/[bannerId] - Update a banner
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bannerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bannerId } = await params
    const data = await request.json()
    const { title, htmlContent, cssContent, linkUrl, isActive } = data

    // Get existing banner
    const existingBanner = await prisma.marketingBanner.findUnique({
      where: { id: bannerId }
    })

    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Update banner
    const updatedBanner = await prisma.marketingBanner.update({
      where: { id: bannerId },
      data: {
        ...(title !== undefined && { title }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(cssContent !== undefined && { cssContent }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(updatedBanner)
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

// DELETE /api/admin/banners/[bannerId] - Delete a banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bannerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bannerId } = await params

    // Get banner to check if it exists
    const banner = await prisma.marketingBanner.findUnique({
      where: { id: bannerId }
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Delete banner from database
    await prisma.marketingBanner.delete({
      where: { id: bannerId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}