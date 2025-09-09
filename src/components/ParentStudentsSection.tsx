'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  TrendingUp,
  Award,
  Activity,
  Target,
  Zap
} from 'lucide-react'

interface LinkedStudent {
  id: string
  student: {
    id: string
    name: string | null
    email: string | null
    inviteKey: string | null
    createdAt: string
  }
  program: string
  sessionLogs: any[]
}

// Simple sparkline component
function Sparkline({ data, color = 'blue' }: { data: number[], color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 100
  const height = 30
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#F59E0B'}
        strokeWidth="2"
        points={points}
      />
      {/* Add dots for each point */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((value - min) / range) * height
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#F59E0B'}
          />
        )
      })}
    </svg>
  )
}

export default function ParentStudentsSection() {
  const router = useRouter()
  const [students, setStudents] = useState<LinkedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [inviteKey, setInviteKey] = useState('')
  const [linking, setLinking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students/link')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinking(true)
    setMessage(null)

    try {
      const response = await fetch('/api/students/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteKey: inviteKey.toUpperCase() })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Student account linked successfully!' })
        setInviteKey('')
        setShowLinkForm(false)
        fetchStudents() // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to link student' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setLinking(false)
    }
  }

  // Mock data generators (replace with real data from API)
  const getRecentScores = () => [1250, 1280, 1320, 1350, 1380, 1420]
  const getAttendanceData = () => [100, 100, 80, 100, 100, 90, 100]
  const getNextSession = () => ({
    date: 'Tomorrow',
    time: '3:00 PM',
    subject: 'SAT Math'
  })

  return (
    <div className="mb-8 -mx-6 px-6 py-6 bg-[#0077c9]/5 rounded-xl">
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={() => setShowLinkForm(true)}
          className="px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg transition-all flex items-center space-x-2 font-light"
        >
          <UserPlus className="h-4 w-4" />
          <span>Link Student Account</span>
        </button>
      </div>

      {/* Link Student Form Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Link Student Account</h3>
              <button
                onClick={() => {
                  setShowLinkForm(false)
                  setMessage(null)
                  setInviteKey('')
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Enter the invite key provided by your student to link their account to yours.
            </p>

            {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleLinkStudent}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Invite Key
                </label>
                <input
                  type="text"
                  value={inviteKey}
                  onChange={(e) => setInviteKey(e.target.value.toUpperCase())}
                  placeholder="e.g., UTPNHF or UP-ABC123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the student's invite key (6-10 characters)
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkForm(false)
                    setMessage(null)
                    setInviteKey('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || inviteKey.length < 6}
                  className="flex-1 px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-light"
                >
                  {linking ? 'Linking...' : 'Link Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border-2 border-[#0077c9]/20 text-center">
          <Users className="h-12 w-12 text-[#0077c9] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Linked Yet</h3>
          <p className="text-gray-700 text-sm mb-6">
            Link your student's account to manage their tutoring sessions and track progress
          </p>
          <button
            onClick={() => setShowLinkForm(true)}
            className="px-6 py-3 bg-[#0077c9] hover:bg-[#0077c9]/90 text-white rounded-lg transition-all inline-flex items-center space-x-2"
          >
            <UserPlus className="h-5 w-5" />
            <span>Link Your First Student</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => {
            const nextSession = getNextSession()
            const recentScores = getRecentScores()
            const attendanceData = getAttendanceData()
            const latestScore = recentScores[recentScores.length - 1]
            const scoreChange = latestScore - recentScores[0]
            const attendanceRate = Math.round((attendanceData.filter(a => a === 100).length / attendanceData.length) * 100)
            
            return (
              <div
                key={student.id}
                className="bg-white rounded-xl p-6 border border-[#0077c9]/10 shadow-sm hover:shadow-md hover:border-[#0077c9]/20 transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/students/${student.student.id}`)}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {student.student.name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {student.student.name || 'Student'}
                      </h3>
                      <p className="text-sm text-gray-600">{student.student.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-light bg-gray-100 text-gray-800">
                          {student.program.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">ID: {student.student.inviteKey}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-500 mt-2" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {student.sessionLogs.length}
                    </p>
                    <p className="text-xs text-gray-700 font-medium">Sessions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {student.sessionLogs.reduce((acc, log) => acc + log.duration, 0)}h
                    </p>
                    <p className="text-xs text-gray-700 font-medium">Total Hours</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {latestScore}
                    </p>
                    <p className="text-xs text-gray-700 font-medium">Current Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 flex items-center">
                      {attendanceRate}%
                    </p>
                    <p className="text-xs text-gray-700 font-medium">Attendance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 flex items-center">
                      7
                      <Zap className="h-4 w-4 text-yellow-500 ml-1" />
                    </p>
                    <p className="text-xs text-gray-700 font-medium">Day Streak</p>
                  </div>
                </div>

                {/* Sparklines Row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Score Trend</span>
                      <span className={`text-xs font-bold ${scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scoreChange > 0 ? '+' : ''}{scoreChange}
                      </span>
                    </div>
                    <Sparkline data={recentScores.map(s => s)} color="blue" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Attendance</span>
                      <span className="text-xs font-bold text-green-600">{attendanceRate}%</span>
                    </div>
                    <Sparkline data={attendanceData} color="green" />
                  </div>
                </div>

                {/* Next Session & Last Activity */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Next Session</p>
                      <p className="text-sm font-light text-gray-900">
                        {nextSession.date} at {nextSession.time}
                      </p>
                      <p className="text-xs text-gray-500">{nextSession.subject}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Last Activity</p>
                      <p className="text-sm font-medium text-gray-900">2 days ago</p>
                      <p className="text-xs text-gray-500">Practice Test</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}