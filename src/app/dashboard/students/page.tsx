'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Search,
  GraduationCap,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  BookOpen,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react'

interface LinkedStudent {
  id: string
  student: {
    id: string
    name: string | null
    email: string | null
    inviteKey: string | null
    phoneNumber: string | null
    timezone: string | null
    createdAt: string
  }
  program: string
  gradeLevel: string | null
  school: string | null
  relationshipType: string | null
  isPrimary: boolean
  sessionLogs: any[]
  otherParents?: {
    id: string
    name: string | null
    email: string | null
    phoneNumber: string | null
    relationshipType: string | null
    isPrimary: boolean
  }[]
}

export default function StudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<LinkedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [inviteKey, setInviteKey] = useState('')
  const [relationshipType, setRelationshipType] = useState('parent')
  const [linking, setLinking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role === 'STUDENT') {
      router.push('/dashboard')
    } else if (session?.user?.role === 'PARENT') {
      fetchStudents()
    }
  }, [status, session, router])

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
        body: JSON.stringify({ 
          inviteKey: inviteKey.toUpperCase(),
          relationshipType: relationshipType 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Student account linked successfully!' })
        setInviteKey('')
        setShowLinkForm(false)
        fetchStudents()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to link student' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setLinking(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.student.name?.toLowerCase().includes(searchLower) ||
      student.student.email?.toLowerCase().includes(searchLower) ||
      student.program.toLowerCase().includes(searchLower)
    )
  })

  const totalSessions = students.reduce((acc, student) => acc + student.sessionLogs.length, 0)
  const totalHours = students.reduce((acc, student) => 
    acc + student.sessionLogs.reduce((sum, log) => sum + log.duration, 0), 0
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Black to match dashboard */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-light">Student Management</h1>
            <p className="text-gray-300 mt-2">Manage and monitor your students' progress</p>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalSessions}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours.toFixed(1)}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm">Active Programs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {new Set(students.map(s => s.program)).size}
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search students by name, email, or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowLinkForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <UserPlus className="h-5 w-5" />
              <span>Link Student Account</span>
            </button>
          </div>

          {/* Students Grid */}
          {filteredStudents.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700 text-center">
              {students.length === 0 ? (
                <>
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Students Linked Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Link your student's account to manage their tutoring sessions and track progress
                  </p>
                  <button
                    onClick={() => setShowLinkForm(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all inline-flex items-center space-x-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Link Your First Student</span>
                  </button>
                </>
              ) : (
                <>
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Students Found</h3>
                  <p className="text-gray-400">Try adjusting your search terms</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:bg-gray-700 transition-all cursor-pointer group"
                  onClick={() => router.push(`/dashboard/students/${student.student.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {student.student.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {student.student.name || 'Student'}
                        </h3>
                        <p className="text-sm text-gray-400">{student.student.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-400/20 text-purple-300">
                        {student.program.replace('_', ' ')}
                      </span>
                      {student.isPrimary && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-300">
                          Primary Contact
                        </span>
                      )}
                    </div>
                    {student.otherParents && student.otherParents.length > 0 && (
                      <div className="text-xs text-gray-400">
                        Also linked to: {student.otherParents.map(p => p.name || p.email).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {student.sessionLogs.length}
                      </p>
                      <p className="text-xs text-gray-400">Sessions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {student.sessionLogs.reduce((acc, log) => acc + log.duration, 0)}h
                      </p>
                      <p className="text-xs text-gray-400">Total Hours</p>
                    </div>
                  </div>

                  {student.sessionLogs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">Last Session</p>
                        <p className="text-xs text-gray-700">
                          {new Date(student.sessionLogs[0].date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Link Student Form Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
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
                  placeholder="e.g., UP-ABC123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  The invite key should start with "UP-" followed by 6 characters
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Relationship
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="other">Other</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Multiple parents can link to the same student
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
                  disabled={linking || inviteKey.length < 9}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {linking ? 'Linking...' : 'Link Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}