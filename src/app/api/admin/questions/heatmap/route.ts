import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get all domains with skills and question counts
    const domains = await prisma.domain.findMany({
      include: {
        skills: {
          include: {
            _count: {
              select: { questions: true }
            }
          },
          orderBy: { meanImportance: 'desc' }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { order: 'asc' }
    })
    
    // Transform data for heatmap
    const heatmapData = domains.map(domain => ({
      id: domain.id,
      name: domain.name,
      code: domain.code,
      skills: domain.skills.map(skill => ({
        id: skill.id,
        name: skill.name,
        meanImportance: skill.meanImportance || 0,
        questionCount: skill._count.questions
      })),
      totalQuestions: domain._count.questions
    }))
    
    // Calculate totals and max values
    const totalQuestions = await prisma.questionBankItem.count({
      where: { domainId: { not: null } }
    })
    
    const maxQuestionsPerSkill = Math.max(
      ...domains.flatMap(d => d.skills.map(s => s._count.questions)),
      1
    )
    
    return NextResponse.json({
      domains: heatmapData,
      totalQuestions,
      maxQuestionsPerSkill
    })
    
  } catch (error) {
    console.error('Error fetching heatmap data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data' },
      { status: 500 }
    )
  }
}