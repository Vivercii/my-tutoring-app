import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      studentId, 
      studentName,
      subject, 
      tutorName, 
      date, 
      duration, 
      notes, 
      score, 
      rating 
    } = body

    // Verify the student belongs to the user
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId: user.id
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Convert duration from minutes to hours for storage
    const durationInHours = Math.round((duration / 60) * 10) / 10

    // Create the session log
    const sessionLog = await prisma.sessionLog.create({
      data: {
        studentId: student.id,
        subject: subject.trim(),
        tutorName: tutorName.trim(),
        date: new Date(date),
        duration: durationInHours,
        notes: notes?.trim() || null,
        score: score?.trim() || null,
        rating: rating || null
      }
    })

    // Create an activity record
    await prisma.activity.create({
      data: {
        type: 'session_logged',
        description: `New session in ${subject} logged for ${studentName}`,
        userId: user.id
      }
    })

    return NextResponse.json({ 
      message: 'Session logged successfully',
      sessionLog 
    })
  } catch (error) {
    console.error('Session logging error:', error)
    return NextResponse.json(
      { error: 'Failed to log session' },
      { status: 500 }
    )
  }
}