import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters for pagination and search
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const program = searchParams.get('program') || ''
    const staff = searchParams.get('staff') || ''
    const examTypesParam = searchParams.get('examTypes') || ''
    const examTypes = examTypesParam ? examTypesParam.split(',') : []

    // Build where clause for search
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (staff === 'true') {
      // For staff tab, show admins and program coordinators
      where.OR = [
        ...(where.OR || []),
        { isAdmin: true },
        { role: 'PROGRAM_COORDINATOR' }
      ]
    } else if (role && role !== 'all') {
      where.role = role
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Handle exam type filtering
    if (examTypes.length > 0) {
      // For students, filter by their program
      // For parents, filter by their managed students' programs
      where.OR = [
        ...(where.OR || []),
        {
          AND: [
            { role: 'STUDENT' },
            { studentProfile: { program: { in: examTypes } } }
          ]
        },
        {
          AND: [
            { role: 'PARENT' },
            { 
              managedStudents: {
                some: {
                  studentProfile: {
                    program: { in: examTypes }
                  }
                }
              }
            }
          ]
        }
      ]
      
      // If role is specifically set, override the OR condition
      if (role && role !== 'all') {
        if (role === 'STUDENT') {
          where.AND = [
            { role: 'STUDENT' },
            { studentProfile: { program: { in: examTypes } } }
          ]
          delete where.OR
        } else if (role === 'PARENT') {
          where.AND = [
            { role: 'PARENT' },
            { 
              managedStudents: {
                some: {
                  studentProfile: {
                    program: { in: examTypes }
                  }
                }
              }
            }
          ]
          delete where.OR
        }
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where })

    // Get users with detailed information
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        isActive: true,
        phoneNumber: true,
        timezone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        preferredContact: true,
        zoomLink: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        inviteKey: true,
        tutorProfile: {
          select: {
            id: true,
            bio: true,
            hourlyRate: true,
            experienceYears: true,
            education: true,
            subjects: true,
            gradeLevels: true,
            languages: true,
            specializations: true,
            maxStudents: true,
            totalSessions: true,
            averageRating: true
          }
        },
        managedStudents: {
          select: {
            id: true,
            relationshipType: true,
            isPrimary: true,
            studentProfile: {
              select: {
                id: true,
                program: true,
                gradeLevel: true,
                school: true,
                targetScore: true,
                currentScore: true,
                academicGoals: true,
                strengths: true,
                weaknesses: true,
                preferredSchedule: true,
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    inviteKey: true,
                    phoneNumber: true,
                    timezone: true
                  }
                },
                _count: {
                  select: {
                    sessionLogs: true
                  }
                },
                sessionLogs: {
                  select: {
                    duration: true
                  }
                }
              }
            }
          }
        },
        studentProfile: {
          select: {
            program: true,
            gradeLevel: true,
            school: true,
            targetScore: true,
            currentScore: true,
            academicGoals: true,
            strengths: true,
            weaknesses: true,
            preferredSchedule: true,
            parents: {
              select: {
                parent: {
                  select: {
                    name: true,
                    email: true,
                    phoneNumber: true,
                    timezone: true
                  }
                },
                relationshipType: true,
                isPrimary: true
              }
            },
            _count: {
              select: {
                sessionLogs: true
              }
            }
          }
        },
        payments: {
          where: {
            status: 'succeeded'
          },
          select: {
            amount: true,
            createdAt: true
          }
        },
        programAccess: {
          select: {
            id: true,
            program: true,
            userId: true
          }
        },
        tutors: {
          select: {
            tutor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        taughtStudents: {
          select: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            managedStudents: true,
            activities: true,
            payments: true,
            tutors: true,
            taughtStudents: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Process users to add calculated fields
    const processedUsers = users.map(user => {
      // Calculate total revenue for this user
      const totalRevenue = user.payments.reduce((sum, payment) => sum + payment.amount, 0)
      
      // Calculate total hours for managed students
      const totalStudentHours = user.managedStudents.reduce((sum, link) => 
        sum + (link.studentProfile?.sessionLogs?.reduce((hrs, log) => hrs + log.duration, 0) || 0), 0
      )

      // Filter students by program if requested
      let filteredStudents = user.managedStudents
      if (program && program !== 'all' && user.role === 'PARENT') {
        filteredStudents = user.managedStudents.filter(link => link.studentProfile?.program === program)
      }

      return {
        ...user,
        totalRevenue,
        totalStudentHours,
        managedStudents: filteredStudents,
        studentCount: filteredStudents.length,
        assignedTutors: user.tutors,
        taughtStudentsCount: user._count.taughtStudents
      }
    })

    // Filter out users if they don't have students with the selected program
    let finalUsers = processedUsers
    if (program && program !== 'all') {
      finalUsers = processedUsers.filter(user => 
        user.role !== 'PARENT' || user.managedStudents.length > 0
      )
    }

    // Get statistics
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    })

    const activeCount = await prisma.user.count({ where: { isActive: true } })
    const inactiveCount = await prisma.user.count({ where: { isActive: false } })
    const adminCount = await prisma.user.count({ where: { isAdmin: true } })

    // Get program statistics
    const programStats = await prisma.studentProfile.groupBy({
      by: ['program'],
      _count: {
        program: true
      }
    })

    return NextResponse.json({
      users: finalUsers,
      pagination: {
        page,
        limit,
        totalCount: finalUsers.length,
        totalPages: Math.ceil(finalUsers.length / limit)
      },
      stats: {
        byRole: stats.reduce((acc, stat) => ({
          ...acc,
          [stat.role]: stat._count.role
        }), {}),
        byProgram: programStats.reduce((acc, stat) => ({
          ...acc,
          [stat.program]: stat._count.program
        }), {}),
        active: activeCount,
        inactive: inactiveCount,
        admins: adminCount,
        total: totalCount
      }
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      email, 
      name, 
      role, 
      isActive = true,
      phoneNumber,
      timezone,
      address,
      city,
      state,
      zipCode,
      country,
      preferredContact,
      program,
      zoomLink
    } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create the user
    let newUser
    try {
      newUser = await prisma.user.create({
        data: {
          email,
          name: name || null,
          role,
          isActive,
          phoneNumber: phoneNumber || null,
          timezone: timezone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          country: country || null,
          preferredContact: preferredContact || null,
          zoomLink: zoomLink || null
        }
      })
    } catch (dbError: any) {
      console.error('Database error creating user:', dbError)
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: `Failed to create user: ${dbError.message || 'Database error'}` },
        { status: 500 }
      )
    }

    // If creating a student and program is provided, create student profile
    if (role === 'STUDENT' && program) {
      await prisma.studentProfile.create({
        data: {
          studentId: newUser.id,
          program
        }
      })
    }

    // Fetch the complete user with profile
    const completeUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        isActive: true,
        phoneNumber: true,
        timezone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        preferredContact: true,
        zoomLink: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: {
          select: {
            program: true,
            gradeLevel: true,
            school: true
          }
        }
      }
    })

    // Log admin activity
    await prisma.activity.create({
      data: {
        type: 'admin_user_create',
        description: `Admin ${session.user.email} created user ${email}`,
        userId: session.user.id
      }
    })

    return NextResponse.json(completeUser)
  } catch (error) {
    console.error('Admin user creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}