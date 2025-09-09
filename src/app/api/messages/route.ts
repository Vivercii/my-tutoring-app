import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch messages for current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {}

    // Build where clause based on user role
    if (session.user.role === 'STUDENT') {
      whereClause.studentEmail = session.user.email
    } else if (session.user.role === 'TUTOR') {
      whereClause.recipientEmail = session.user.email
    } else if (session.user.role === 'PARENT' || session.user.isAdmin) {
      // Program coordinators (admins) see all messages
      // Parents see messages for their students
      if (session.user.role === 'PARENT') {
        // Get parent's students
        const parentStudents = await prisma.parentStudent.findMany({
          where: { 
            parent: { 
              email: session.user.email 
            }
          },
          include: {
            studentProfile: true
          }
        })
        const studentIds = parentStudents.map(ps => ps.studentProfile.studentId)
        // This needs to be adapted based on your Message model structure
        whereClause.studentId = { in: studentIds }
      }
      // Admins see everything, no filter needed
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Mark messages as read
    if (session.user.role === 'STUDENT') {
      await prisma.message.updateMany({
        where: {
          studentEmail: session.user.email,
          senderRole: { not: 'STUDENT' },
          isRead: false
        },
        data: { isRead: true }
      })
    } else if (session.user.role === 'TUTOR') {
      await prisma.message.updateMany({
        where: {
          recipientEmail: session.user.email,
          isReadByInstructor: false
        },
        data: { isReadByInstructor: true }
      })
    } else if (session.user.isAdmin) {
      await prisma.message.updateMany({
        where: {
          isReadByCoordinator: false
        },
        data: { isReadByCoordinator: true }
      })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, recipientId, attachments = [] } = body

    // Get sender details
    const sender = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!sender) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let messageData: any = {
      senderId: sender.id,
      senderEmail: sender.email!,
      senderName: sender.name || 'Unknown',
      senderRole: sender.role,
      content,
      attachments
    }

    // Handle different sender roles
    if (sender.role === 'STUDENT') {
      // Student sending message
      messageData.studentId = sender.id
      messageData.studentEmail = sender.email!
      messageData.studentName = sender.name || 'Unknown'

      // Get assigned instructor
      const tutorStudent = await prisma.tutorStudent.findFirst({
        where: { 
          student: { 
            email: sender.email 
          }
        },
        include: { tutor: true }
      })

      if (tutorStudent?.tutor) {
        messageData.recipientId = tutorStudent.tutor.id
        messageData.recipientEmail = tutorStudent.tutor.email
        messageData.recipientName = tutorStudent.tutor.name
      }
    } else if (sender.role === 'TUTOR') {
      // Instructor sending message to student
      if (!recipientId) {
        return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 })
      }

      const student = await prisma.user.findUnique({
        where: { id: recipientId }
      })

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      messageData.recipientId = sender.id
      messageData.recipientEmail = sender.email
      messageData.recipientName = sender.name
      messageData.studentId = student.id
      messageData.studentEmail = student.email!
      messageData.studentName = student.name || 'Unknown'
    } else if (sender.isAdmin) {
      // Program coordinator sending message
      if (!recipientId) {
        return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 })
      }

      const student = await prisma.user.findUnique({
        where: { id: recipientId }
      })

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      messageData.studentId = student.id
      messageData.studentEmail = student.email!
      messageData.studentName = student.name || 'Unknown'
    }

    // Create the message
    const message = await prisma.message.create({
      data: messageData
    })

    // Update or create thread
    await prisma.messageThread.upsert({
      where: {
        studentId_instructorId: {
          studentId: messageData.studentId,
          instructorId: messageData.recipientId || 'coordinator'
        }
      },
      update: {
        lastMessage: content.substring(0, 100),
        lastMessageAt: new Date(),
        unreadCount: {
          increment: 1
        }
      },
      create: {
        studentId: messageData.studentId,
        studentEmail: messageData.studentEmail,
        studentName: messageData.studentName,
        instructorId: messageData.recipientId,
        instructorEmail: messageData.recipientEmail,
        instructorName: messageData.recipientName,
        lastMessage: content.substring(0, 100),
        lastMessageAt: new Date(),
        unreadCount: 1
      }
    })

    console.log(`[MESSAGE] ${sender.email} sent message to ${messageData.recipientEmail || 'coordinator'}`)

    return NextResponse.json({ 
      success: true, 
      message: message,
      id: message.id 
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}