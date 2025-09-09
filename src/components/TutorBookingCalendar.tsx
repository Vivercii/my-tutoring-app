'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Video, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay, setHours, setMinutes } from 'date-fns'

interface TutorAvailability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface Tutor {
  id: string
  name: string
  email: string
  tutorProfile?: {
    bio?: string
    hourlyRate?: number
    subjects?: string[]
    programs?: string[]
  }
  tutorAvailability: TutorAvailability[]
  scheduledSessions?: {
    startTime: string
    endTime: string
  }[]
}

interface Student {
  id: string
  studentProfileId: string
  name: string
}

interface TutorBookingCalendarProps {
  students: Student[]
  studentId?: string
  onClose?: () => void
}

export default function TutorBookingCalendar({ students, studentId, onClose }: TutorBookingCalendarProps) {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(students[0] || null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [duration, setDuration] = useState(60) // minutes
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())

  useEffect(() => {
    if (studentId || selectedStudent) {
      fetchTutors()
    }
  }, [selectedStudent, studentId])

  const fetchTutors = async () => {
    try {
      // If we have a specific student, fetch their assigned tutors
      const currentStudentId = studentId || selectedStudent?.id
      
      if (currentStudentId) {
        const response = await fetch(`/api/students/${currentStudentId}/tutors`)
        if (response.ok) {
          const data = await response.json()
          setTutors(data)
          // Auto-select first tutor if available
          if (data.length > 0 && !selectedTutor) {
            setSelectedTutor(data[0])
            fetchTutorDetails(data[0].id)
          }
        }
      } else {
        // Fallback to all tutors if no student selected
        const response = await fetch('/api/tutors/availability')
        if (response.ok) {
          const data = await response.json()
          setTutors(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tutors:', error)
    }
  }

  const fetchTutorDetails = async (tutorId: string) => {
    try {
      const response = await fetch(`/api/tutors/availability?tutorId=${tutorId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTutor(data)
      }
    } catch (error) {
      console.error('Failed to fetch tutor details:', error)
    }
  }

  const getAvailableSlots = (date: Date) => {
    if (!selectedTutor) return []
    
    const dayOfWeek = date.getDay()
    const availability = selectedTutor.tutorAvailability.filter(a => a.dayOfWeek === dayOfWeek)
    
    const slots: string[] = []
    
    availability.forEach(avail => {
      const [startHour, startMin] = avail.startTime.split(':').map(Number)
      const [endHour, endMin] = avail.endTime.split(':').map(Number)
      
      let currentHour = startHour
      let currentMin = startMin
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
        
        // Check if this slot conflicts with existing sessions
        const slotStart = setMinutes(setHours(date, currentHour), currentMin)
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)
        
        const hasConflict = selectedTutor.scheduledSessions?.some(session => {
          const sessionStart = new Date(session.startTime)
          const sessionEnd = new Date(session.endTime)
          return (
            (slotStart >= sessionStart && slotStart < sessionEnd) ||
            (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
            (slotStart <= sessionStart && slotEnd >= sessionEnd)
          )
        })
        
        if (!hasConflict) {
          slots.push(timeStr)
        }
        
        // Increment by 30 minutes
        currentMin += 30
        if (currentMin >= 60) {
          currentMin = 0
          currentHour++
        }
      }
    })
    
    return slots
  }

  const handleBookSession = async () => {
    if (!selectedTutor || !selectedStudent || !selectedDate || !selectedTime) {
      alert('Please select all required fields')
      return
    }

    setLoading(true)
    
    try {
      const [hour, minute] = selectedTime.split(':').map(Number)
      const startTime = setMinutes(setHours(selectedDate, hour), minute)
      const endTime = new Date(startTime.getTime() + duration * 60000)
      
      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorId: selectedTutor.id,
          studentProfileId: selectedStudent.studentProfileId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          subject: selectedTutor.tutorProfile?.subjects?.[0] || 'General',
          notes
        })
      })
      
      if (response.ok) {
        alert('Session booked successfully!')
        onClose?.()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to book session')
      }
    } catch (error) {
      console.error('Error booking session:', error)
      alert('Failed to book session')
    } finally {
      setLoading(false)
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfWeek(currentWeek), i)
    return day
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Book a Tutoring Session</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tutor Selection */}
          <div className="space-y-4">
            {students.length > 1 && (
              <div>
                <h3 className="font-semibold mb-2">Select Student</h3>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={selectedStudent?.studentProfileId || ''}
                  onChange={(e) => {
                    const student = students.find(s => s.studentProfileId === e.target.value)
                    setSelectedStudent(student || null)
                    setSelectedTutor(null) // Reset tutor selection when student changes
                  }}
                >
                  {students.map(student => (
                    <option key={student.studentProfileId} value={student.studentProfileId}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">
                {tutors.length === 0 ? 'No Assigned Tutors' : 'Select Tutor'}
              </h3>
              {tutors.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tutors assigned to this student</p>
                  <p className="text-sm text-gray-500 mt-2">Please contact support to assign a tutor</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tutors.map(tutor => (
                    <div
                      key={tutor.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTutor?.id === tutor.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedTutor(tutor)
                        fetchTutorDetails(tutor.id)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{tutor.name}</p>
                          <p className="text-sm text-gray-600">
                            {tutor.subject || (tutor.tutorProfile?.subjects && tutor.tutorProfile.subjects.join(', '))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Session Duration</h3>
              <select
                className="w-full p-2 border rounded-lg"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>
          </div>

          {/* Middle Column - Calendar */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Select Date</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium">
                    {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {weekDays.map(day => {
                  const hasAvailability = selectedTutor?.tutorAvailability.some(
                    a => a.dayOfWeek === day.getDay()
                  )
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      disabled={!hasAvailability || day < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={`
                        p-3 text-sm rounded-lg transition-colors
                        ${isSameDay(day, selectedDate) 
                          ? 'bg-blue-500 text-white' 
                          : hasAvailability && day >= new Date(new Date().setHours(0, 0, 0, 0))
                          ? 'hover:bg-gray-100'
                          : 'text-gray-300 cursor-not-allowed'
                        }
                      `}
                    >
                      <div>{format(day, 'd')}</div>
                      {hasAvailability && (
                        <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Available Time Slots</h3>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {getAvailableSlots(selectedDate).map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`
                      p-2 text-sm rounded-lg border transition-colors
                      ${selectedTime === time
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'hover:bg-gray-50 border-gray-200'
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {selectedTutor && getAvailableSlots(selectedDate).length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No available slots for this date</p>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Booking Summary</h3>
              
              {selectedStudent && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Student: {selectedStudent.name}</span>
                </div>
              )}
              
              {selectedTutor && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Tutor: {selectedTutor.name}</span>
                </div>
              )}
              
              {selectedDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
              )}
              
              {selectedTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{selectedTime} ({duration} minutes)</span>
                </div>
              )}
              
              {selectedTutor?.tutorProfile?.hourlyRate && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Estimated Cost:</p>
                  <p className="text-lg font-semibold">
                    {duration / 60} hour{duration !== 60 ? 's' : ''} session
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                className="w-full p-2 border rounded-lg"
                rows={4}
                placeholder="Any specific topics or requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={handleBookSession}
              disabled={!selectedTutor || !selectedStudent || !selectedDate || !selectedTime || loading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Booking...' : 'Book Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}