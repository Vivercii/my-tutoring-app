'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Clock, Save, Plus, Trash2, AlertCircle, 
  CheckCircle, ChevronLeft, Edit2, X 
} from 'lucide-react'

interface AvailabilitySlot {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export default function TutorAvailabilityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'TUTOR') {
        router.push('/dashboard')
      } else {
        fetchAvailability()
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tutors/availability')
      
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      } else {
        setMessage({ type: 'error', text: 'Failed to load availability' })
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setMessage({ type: 'error', text: 'Failed to load availability' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = () => {
    // Validate the new slot
    if (newSlot.startTime >= newSlot.endTime) {
      setMessage({ type: 'error', text: 'End time must be after start time' })
      return
    }

    // Check for conflicts
    const hasConflict = availability.some(slot => 
      slot.dayOfWeek === newSlot.dayOfWeek &&
      ((newSlot.startTime >= slot.startTime && newSlot.startTime < slot.endTime) ||
       (newSlot.endTime > slot.startTime && newSlot.endTime <= slot.endTime) ||
       (newSlot.startTime <= slot.startTime && newSlot.endTime >= slot.endTime))
    )

    if (hasConflict) {
      setMessage({ type: 'error', text: 'This time slot conflicts with existing availability' })
      return
    }

    setAvailability([...availability, newSlot])
    setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' })
    setShowAddForm(false)
    setMessage(null)
  }

  const handleRemoveSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index))
  }

  const handleSaveAvailability = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/tutors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Availability saved successfully' })
        setAvailability(data.availability)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save availability' })
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      setMessage({ type: 'error', text: 'Failed to save availability' })
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum
    return `${displayHour}:${minute} ${ampm}`
  }

  // Group availability by day
  const availabilityByDay = DAYS_OF_WEEK.map(day => ({
    ...day,
    slots: availability
      .filter(slot => slot.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }))

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
              <h1 className="text-3xl font-bold text-white mb-2">Availability Settings</h1>
              <p className="text-gray-400">Set your weekly recurring availability for tutoring sessions</p>
            </div>
            
            <Calendar className="h-10 w-10 text-red-500" />
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

        {/* Availability Schedule */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Weekly Schedule</h2>
            
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Time Slot</span>
              </button>
            )}
          </div>

          {/* Add New Slot Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Add New Time Slot</h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setMessage(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={newSlot.dayOfWeek}
                    onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleAddSlot}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Add Slot
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Display Availability by Day */}
          <div className="space-y-4">
            {availabilityByDay.map(day => (
              <div key={day.value} className="border-b border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-start">
                  <div className="w-32">
                    <h3 className="text-white font-medium">{day.label}</h3>
                  </div>
                  
                  <div className="flex-1">
                    {day.slots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((slot, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 rounded-lg"
                          >
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-white">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                            <button
                              onClick={() => {
                                const globalIndex = availability.findIndex(s => 
                                  s.dayOfWeek === slot.dayOfWeek && 
                                  s.startTime === slot.startTime && 
                                  s.endTime === slot.endTime
                                )
                                handleRemoveSlot(globalIndex)
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">No availability set</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveAvailability}
            disabled={saving || availability.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'Saving...' : 'Save Availability'}</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-900/30 border border-blue-600/50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div className="text-sm text-blue-300">
              <p className="mb-2">
                <strong>Important:</strong> Your availability settings determine when parents can book sessions with you.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Set your recurring weekly schedule</li>
                <li>Time slots will be available for booking every week</li>
                <li>You can update your availability at any time</li>
                <li>Already booked sessions will not be affected by changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}