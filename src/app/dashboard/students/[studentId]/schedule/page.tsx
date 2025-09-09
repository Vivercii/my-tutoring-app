'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TutorBookingCalendar from '@/components/TutorBookingCalendar'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react'

interface Student {
  id: string
  studentProfileId: string
  name: string
  email?: string
}

interface ScheduledSession {
  id: string
  startTime: string
  endTime: string
  status: string
  zoomLink?: string
  notes?: string
  tutor: {
    id: string
    name: string
    email: string
    tutorProfile?: {
      subjects?: string[]
    }
  }
  studentProfile?: {
    student: {
      name: string
      email: string
    }
  }
}

export default function SchedulingPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showBookingCalendar, setShowBookingCalendar] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [sessions, setSessions] = useState<ScheduledSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role === 'PARENT') {
      fetchStudentData()
      fetchSessions()
    }
  }, [status, session, studentId])

  const fetchStudentData = async () => {
    try {
      console.log('Fetching student data for ID:', studentId)
      const response = await fetch(`/api/students/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Student data received:', data)
        if (data && data.studentProfile) {
          setStudent({
            id: data.id,
            studentProfileId: data.studentProfile.id,
            name: data.name,
            email: data.email
          })
        } else {
          console.error('Invalid student data structure:', data)
        }
      } else {
        console.error('Failed to fetch student:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Failed to fetch student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions/book')
      if (response.ok) {
        const data = await response.json()
        setSessions(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const formatSessionTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    
    return {
      date: start.toLocaleDateString(),
      time: start.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      duration
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to cancel this session? You must cancel at least 24 hours in advance to avoid charges.')) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchSessions()
        }
      } catch (error) {
        console.error('Failed to cancel session:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href={`/dashboard/students/${studentId}`}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Student Details
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-light mb-2">Schedule Sessions</h1>
                <p className="text-gray-300">Book and manage tutoring sessions for {student?.name || 'Student'}</p>
              </div>
              
              <button 
                onClick={() => {
                  if (!student && !loading) {
                    fetchStudentData()
                  }
                  setShowBookingCalendar(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Book New Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-6">

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No upcoming sessions scheduled</p>
                <button
                  onClick={() => {
                    if (!student && !loading) {
                      fetchStudentData()
                    }
                    setShowBookingCalendar(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book First Session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.filter(s => s.status === 'CONFIRMED' || s.status === 'upcoming').map(session => {
                  const sessionInfo = formatSessionTime(session.startTime, session.endTime)
                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.tutor.tutorProfile?.subjects?.[0] || 'Tutoring Session'}
                          </p>
                          <p className="text-sm text-gray-700">{session.tutor.name}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <X className="h-4 w-4 text-gray-700" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-3 w-3" />
                          <span>{sessionInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="h-3 w-3" />
                          <span>{sessionInfo.time} ({sessionInfo.duration}h)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Video className="h-3 w-3" />
                          <a href={session.zoomLink} className="text-blue-600 hover:underline">
                            Join Zoom
                          </a>
                        </div>
                      </div>
                      
                      {session.notes && (
                        <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Scheduling Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Scheduling Policy</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Sessions must be booked 24 hours in advance</li>
                  <li>• Cancellations require 24 hours notice</li>
                  <li>• Late cancellations may incur charges</li>
                  <li>• Contact support for urgent changes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Calendar Modal */}
      {showBookingCalendar && (
        <>
          {student ? (
            <TutorBookingCalendar
              students={[student]}
              studentId={student.id}
              onClose={() => {
                setShowBookingCalendar(false)
                fetchSessions() // Refresh sessions after booking
              }}
            />
          ) : loading ? (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-md">
                <h3 className="text-lg font-semibold mb-4">Loading student data...</h3>
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-gray-600 mb-4">Please wait while we load the student information.</p>
              </div>
            </div>
          ) : (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Unable to Load Student</h3>
                <p className="text-gray-600 mb-4">We couldn't load the student information. Please try refreshing the page or contact support if the issue persists.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBookingCalendar(false)
                      fetchStudentData()
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setShowBookingCalendar(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}