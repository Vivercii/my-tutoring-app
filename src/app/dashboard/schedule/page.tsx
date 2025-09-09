'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Clock, User, CheckCircle, AlertCircle, 
  ChevronLeft, ChevronRight, X, CreditCard, Video
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  studentProfile?: {
    id: string
    program: string
  }
}

interface Tutor {
  id: string
  name: string
  email: string
  hasZoomLink: boolean
}

interface AvailableSlot {
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  startDateTime: string
  endDateTime: string
  isAvailable: boolean
}

interface ScheduledSession {
  id: string
  startTime: string
  endTime: string
  status: string
  zoomLink?: string
  studentProfile: {
    id: string
    student: {
      id: string
      name: string
      email: string
    }
  }
  tutor: {
    id: string
    name: string
    email: string
    zoomLink?: string
  }
}

export default function ParentSchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State
  const [students, setStudents] = useState<Student[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedTutor, setSelectedTutor] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Calendar state
  const [currentWeek, setCurrentWeek] = useState(new Date())
  
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'PARENT') {
        router.push('/dashboard')
      } else {
        fetchInitialData()
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (selectedTutor) {
      fetchTutorAvailability()
    }
  }, [selectedTutor, currentWeek])

  useEffect(() => {
    if (selectedStudent) {
      fetchScheduledSessions()
    }
  }, [selectedStudent, currentWeek])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Fetch linked students
      const studentsResponse = await fetch('/api/students/link')
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData.students || [])
        if (studentsData.students?.length > 0) {
          setSelectedStudent(studentsData.students[0].id)
        }
      }
      
      // Fetch tutors
      const tutorsResponse = await fetch('/api/admin/tutors')
      if (tutorsResponse.ok) {
        const tutorsData = await tutorsResponse.json()
        setTutors(tutorsData.tutors || [])
      }
      
      // Fetch credit balance
      const creditsResponse = await fetch('/api/credits')
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setCreditBalance(creditsData.hours || 0)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setLoading(false)
    }
  }

  const fetchTutorAvailability = async () => {
    if (!selectedTutor) return
    
    try {
      const startDate = getWeekStart(currentWeek)
      const endDate = getWeekEnd(currentWeek)
      
      const response = await fetch(
        `/api/tutors/${selectedTutor}/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      }
    } catch (error) {
      console.error('Error fetching tutor availability:', error)
    }
  }

  const fetchScheduledSessions = async () => {
    if (!selectedStudent) return
    
    try {
      const startDate = getWeekStart(currentWeek)
      const endDate = getWeekEnd(currentWeek)
      
      const response = await fetch(
        `/api/schedule?studentId=${selectedStudent}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setScheduledSessions(data || [])
      }
    } catch (error) {
      console.error('Error fetching scheduled sessions:', error)
    }
  }

  const handleBookSession = async () => {
    if (!selectedSlot || !selectedStudent || !selectedTutor) return
    
    setBooking(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          tutorId: selectedTutor,
          startTime: selectedSlot.startDateTime,
          endTime: selectedSlot.endDateTime
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Session booked successfully!' })
        setShowConfirmModal(false)
        setSelectedSlot(null)
        
        // Refresh data
        fetchTutorAvailability()
        fetchScheduledSessions()
        
        // Refresh credit balance
        const creditsResponse = await fetch('/api/credits')
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          setCreditBalance(creditsData.hours || 0)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to book session' })
      }
    } catch (error) {
      console.error('Error booking session:', error)
      setMessage({ type: 'error', text: 'Failed to book session' })
    } finally {
      setBooking(false)
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return
    
    try {
      const response = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: 'CANCELLED'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Session cancelled. ${data.creditsRefunded > 0 ? `${data.creditsRefunded} hours refunded.` : ''}` })
        fetchScheduledSessions()
        
        // Refresh credit balance
        const creditsResponse = await fetch('/api/credits')
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          setCreditBalance(creditsData.hours || 0)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel session' })
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
      setMessage({ type: 'error', text: 'Failed to cancel session' })
    }
  }

  // Helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getWeekEnd = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + 6
    return new Date(d.setDate(diff))
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getDurationHours = (start: string, end: string) => {
    const startTime = new Date(start)
    const endTime = new Date(end)
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  }

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const date = slot.date
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, AvailableSlot[]>)

  // Get week days
  const weekDays = []
  const startDate = getWeekStart(currentWeek)
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    weekDays.push(date)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Schedule Sessions</h1>
              <p className="text-gray-400">Book tutoring sessions for your children</p>
            </div>
            
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-500" />
              <span className="text-white font-medium">{creditBalance} hours available</span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-600 text-green-300' 
              : 'bg-red-900/50 border border-red-600 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Selection Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Choose a student...</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name || student.email}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Tutor
              </label>
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={!selectedStudent}
              >
                <option value="">Choose a tutor...</option>
                {tutors.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name || tutor.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {selectedStudent && selectedTutor && (
          <div className="bg-gray-800 rounded-lg p-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newWeek = new Date(currentWeek)
                  newWeek.setDate(newWeek.getDate() - 7)
                  setCurrentWeek(newWeek)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-semibold text-white">
                {formatDate(getWeekStart(currentWeek).toISOString())} - {formatDate(getWeekEnd(currentWeek).toISOString())}
              </h2>
              
              <button
                onClick={() => {
                  const newWeek = new Date(currentWeek)
                  newWeek.setDate(newWeek.getDate() + 7)
                  setCurrentWeek(newWeek)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dateStr = day.toISOString().split('T')[0]
                const daySlots = slotsByDate[dateStr] || []
                const daySessions = scheduledSessions.filter(s => 
                  new Date(s.startTime).toDateString() === day.toDateString()
                )
                
                return (
                  <div key={index} className="border border-gray-700 rounded-lg p-2">
                    <div className="text-center mb-2">
                      <div className="text-xs text-gray-400">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {day.getDate()}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {/* Show scheduled sessions */}
                      {daySessions.map(session => (
                        <div
                          key={session.id}
                          className="p-2 bg-blue-900/50 border border-blue-600/50 rounded text-xs"
                        >
                          <div className="text-blue-300 font-medium">
                            {formatTime(session.startTime)}
                          </div>
                          <div className="text-blue-200">
                            {session.tutor.name}
                          </div>
                          {session.status === 'CONFIRMED' && new Date(session.startTime) > new Date() && (
                            <button
                              onClick={() => handleCancelSession(session.id)}
                              className="mt-1 text-red-400 hover:text-red-300 text-xs"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {/* Show available slots */}
                      {daySlots.map((slot, slotIndex) => (
                        <button
                          key={slotIndex}
                          onClick={() => {
                            setSelectedSlot(slot)
                            setShowConfirmModal(true)
                          }}
                          className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-left transition-colors"
                        >
                          <div className="text-green-400 font-medium">
                            {formatTime(slot.startDateTime)}
                          </div>
                          <div className="text-gray-300">
                            Available
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Booking Confirmation Modal */}
        {showConfirmModal && selectedSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Confirm Booking</h3>
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setSelectedSlot(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Student</div>
                    <div className="text-white">
                      {students.find(s => s.id === selectedStudent)?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Tutor</div>
                    <div className="text-white">
                      {tutors.find(t => t.id === selectedTutor)?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Date</div>
                    <div className="text-white">
                      {formatDate(selectedSlot.startDateTime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Time</div>
                    <div className="text-white">
                      {formatTime(selectedSlot.startDateTime)} - {formatTime(selectedSlot.endDateTime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Duration</div>
                    <div className="text-white">
                      {getDurationHours(selectedSlot.startDateTime, selectedSlot.endDateTime)} hour(s)
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-300">
                    This will deduct {getDurationHours(selectedSlot.startDateTime, selectedSlot.endDateTime)} hour(s) from your balance.
                    Remaining: {creditBalance - getDurationHours(selectedSlot.startDateTime, selectedSlot.endDateTime)} hour(s)
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setSelectedSlot(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookSession}
                  disabled={booking}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}