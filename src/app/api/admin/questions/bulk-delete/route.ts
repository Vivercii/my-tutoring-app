import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { questionIds, deleteAll, filters } = await req.json()
    
    let deletedCount = 0
    
    if (deleteAll && filters) {
      // Delete all questions matching filters
      const whereClause: any = {}
      
      if (filters.isInternal) {
        whereClause.isInternal = true
      }
      
      if (filters.inactive) {
        whereClause.isActive = false
      }
      
      if (filters.source) {
        whereClause.metadata = {
          path: ['source'],
          equals: filters.source
        }
      }
      
      if (filters.domainId) {
        whereClause.domainId = filters.domainId
      }
      
      if (filters.skillId) {
        whereClause.skillId = filters.skillId
      }
      
      // First delete answer options
      const questionsToDelete = await prisma.questionBankItem.findMany({
        where: whereClause,
        select: { id: true }
      })
      
      const questionIdsToDelete = questionsToDelete.map(q => q.id)
      
      await prisma.answerOption.deleteMany({
        where: {
          questionId: { in: questionIdsToDelete }
        }
      })
      
      // Then delete questions
      const result = await prisma.questionBankItem.deleteMany({
        where: whereClause
      })
      
      deletedCount = result.count
      
      // Note: Question counts are calculated dynamically through the questions relation
      // No need to manually update counts as they're derived from the relationship
      
    } else if (questionIds && Array.isArray(questionIds)) {
      // Delete specific questions
      
      // Get skill IDs for count updates
      const questions = await prisma.questionBankItem.findMany({
        where: { id: { in: questionIds } },
        select: { skillId: true }
      })
      
      // Count questions per skill
      const skillCounts = new Map<string, number>()
      questions.forEach(q => {
        if (q.skillId) {
          skillCounts.set(q.skillId, (skillCounts.get(q.skillId) || 0) + 1)
        }
      })
      
      // Delete answer options first
      await prisma.answerOption.deleteMany({
        where: {
          questionId: { in: questionIds }
        }
      })
      
      // Delete questions
      const result = await prisma.questionBankItem.deleteMany({
        where: {
          id: { in: questionIds }
        }
      })
      
      deletedCount = result.count
      
      // Note: Skill question counts are calculated dynamically through the questions relation
      // No need to manually update counts as they're derived from the relationship
    }
    
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} questions`
    })
    
  } catch (error) {
    console.error('Error deleting questions:', error)
    return NextResponse.json(
      { error: 'Failed to delete questions' },
      { status: 500 }
    )
  }
}

// Get internal/draft questions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const onlyInternal = searchParams.get('internal') === 'true'
    
    const whereClause: any = {}
    
    if (onlyInternal) {
      whereClause.isInternal = true
    }
    
    const questions = await prisma.questionBankItem.findMany({
      where: whereClause,
      include: {
        domain: true,
        skill: true,
        options: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      questions,
      count: questions.length
    })
    
  } catch (error) {
    console.error('Error fetching internal questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}