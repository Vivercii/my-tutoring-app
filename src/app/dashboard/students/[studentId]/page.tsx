'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  BookOpen,
  Clock,
  Star,
  Calendar,
  FileText,
  MessageCircle,
  Plus,
  MoreVertical,
  ChevronRight,
  Activity,
  Award,
  TrendingUp
} from 'lucide-react'

interface SessionLog {
  id: string
  subject: string
  tutorName: string
  date: string
  duration: number
  notes: string | null
  score: string | null
  rating: number | null
}

interface StudentDetail {
  id: string
  student: {
    id: string
    name: string | null
    email: string | null
    inviteKey: string | null
    createdAt: string
  }
  program: string
  sessionLogs: SessionLog[]
}

export default function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role === 'STUDENT') {
      router.push('/dashboard')
    } else if (session?.user?.role === 'PARENT') {
      fetchStudentDetails()
    }
  }, [status, session, router, studentId])

  const fetchStudentDetails = async () => {
    try {
      const response = await fetch('/api/students/link')
      if (response.ok) {
        const data = await response.json()
        const studentDetail = data.students.find((s: StudentDetail) => s.student.id === studentId)
        if (studentDetail) {
          setStudent(studentDetail)
        } else {
          router.push('/dashboard/students')
        }
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error)
      router.push('/dashboard/students')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!session || !student) {
    return null
  }

  const totalHours = student.sessionLogs.reduce((acc, log) => acc + log.duration, 0)
  const averageRating = student.sessionLogs.filter(log => log.rating).length > 0
    ? student.sessionLogs.filter(log => log.rating).reduce((acc, log) => acc + (log.rating || 0), 0) / student.sessionLogs.filter(log => log.rating).length
    : 0
  const lastSession = student.sessionLogs.length > 0 ? student.sessionLogs[0] : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Black to match dashboard */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/dashboard/students"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Link>
            
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {student.student.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-light text-white">
                    {student.student.name || 'Student'}
                  </h1>
                  <p className="text-gray-300">{student.student.email}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {student.program.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-400">
                      Joined {new Date(student.student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => router.push(`/dashboard/students/${studentId}/messages`)}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/students/${studentId}/schedule`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Book Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{student.sessionLogs.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm">Last Session</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {lastSession ? new Date(lastSession.date).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Session History</h2>
              </div>
              <div className="p-6">
                {student.sessionLogs.length > 0 ? (
                  <div className="space-y-4">
                    {student.sessionLogs.map((sessionLog) => (
                      <div
                        key={sessionLog.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-gray-900">{sessionLog.subject}</h3>
                              {sessionLog.score && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Score: {sessionLog.score}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              with {sessionLog.tutorName} • {sessionLog.duration} hour{sessionLog.duration !== 1 ? 's' : ''}
                            </p>
                            {sessionLog.notes && (
                              <p className="text-sm text-gray-700 mt-2">{sessionLog.notes}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <p className="text-sm text-gray-700">
                              {new Date(sessionLog.date).toLocaleDateString()}
                            </p>
                            {sessionLog.rating && (
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < sessionLog.rating!
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700">No sessions logged yet</p>
                    <button 
                      onClick={() => router.push(`/dashboard/students/${studentId}/schedule`)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Log First Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-700">Invite Key</p>
                  <p className="text-sm font-mono text-gray-900">{student.student.inviteKey}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-700">Program</p>
                  <p className="text-sm text-gray-900">{student.program.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-700">Member Since</p>
                  <p className="text-sm text-gray-900">
                    {new Date(student.student.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`/dashboard/students/${studentId}/program`)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-900">View Program Overview</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-900" />
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/students/${studentId}/progress`)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-900">View Progress</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-900" />
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/students/${studentId}/schedule`)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-900">Schedule Session</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-900" />
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/students/${studentId}/resources`)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-900">Resource Center</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-900" />
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/students/${studentId}/messages`)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-900">Messages</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-900" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}