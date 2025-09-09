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
  Activity,
  Target,
  Brain,
  School,
  Phone,
  Globe,
  Mail,
  Trash2
} from 'lucide-react'
import MainNav from '@/components/MainNav'

interface LinkedStudent {
  id: string
  linkedAt: string
  name: string | null
  email: string | null
  inviteKey: string | null
  phoneNumber: string | null
  timezone: string | null
  createdAt: string
  studentProfile: {
    id: string
    program: string
    gradeLevel: string | null
    school: string | null
    targetScore: string | null
    currentScore: string | null
    academicGoals: string | null
    strengths: string | null
    weaknesses: string | null
    preferredSchedule: string | null
    sessionLogs: any[]
    _count: {
      sessionLogs: number
    }
  } | null
}

export default function TutorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<LinkedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [inviteKey, setInviteKey] = useState('')
  const [linking, setLinking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<LinkedStudent | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'TUTOR') {
      router.push('/dashboard')
    } else if (session?.user?.role === 'TUTOR') {
      fetchStudents()
    }
  }, [status, session, router])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/tutors/link-student')
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
      const response = await fetch('/api/tutors/link-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inviteKey: inviteKey.toUpperCase()
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

  const handleUnlinkStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to unlink this student?')) return

    try {
      const response = await fetch('/api/tutors/link-student', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Student unlinked successfully' })
        fetchStudents()
        setSelectedStudent(null)
      } else {
        setMessage({ type: 'error', text: 'Failed to unlink student' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    }
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.studentProfile?.program.toLowerCase().includes(searchLower) ||
      student.studentProfile?.school?.toLowerCase().includes(searchLower)
    )
  })

  const totalSessions = students.reduce((acc, student) => 
    acc + (student.studentProfile?._count.sessionLogs || 0), 0
  )
  const totalHours = students.reduce((acc, student) => 
    acc + (student.studentProfile?.sessionLogs?.reduce((sum, log) => sum + log.duration, 0) || 0), 0
  )

  const activeStudents = students.filter(s => 
    s.studentProfile?.sessionLogs && s.studentProfile.sessionLogs.length > 0
  ).length

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <MainNav />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Tutor Dashboard</h1>
            <p className="text-gray-400">Manage your students and track their progress</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-white mt-1">{students.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Students</p>
                  <p className="text-2xl font-bold text-white mt-1">{activeStudents}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-white mt-1">{totalSessions}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Hours</p>
                  <p className="text-2xl font-bold text-white mt-1">{totalHours.toFixed(1)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
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
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email, program, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowLinkForm(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center space-x-2"
            >
              <UserPlus className="h-5 w-5" />
              <span>Link New Student</span>
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
                    Link student accounts to start managing tutoring sessions and tracking progress
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
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {student.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {student.name || 'Student'}
                        </h3>
                        <p className="text-sm text-gray-400">{student.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>

                  {student.studentProfile && (
                    <>
                      <div className="mb-4 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-400/20 text-purple-300">
                            {student.studentProfile.program.replace('_', ' ')}
                          </span>
                          {student.studentProfile.gradeLevel && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-400/20 text-blue-300">
                              {student.studentProfile.gradeLevel}
                            </span>
                          )}
                        </div>
                        {student.studentProfile.school && (
                          <div className="text-xs text-gray-400">
                            <School className="h-3 w-3 inline mr-1" />
                            {student.studentProfile.school}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {student.studentProfile._count.sessionLogs}
                          </p>
                          <p className="text-xs text-gray-400">Sessions</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {student.studentProfile.sessionLogs?.reduce((acc, log) => acc + log.duration, 0) || 0}h
                          </p>
                          <p className="text-xs text-gray-400">Total Hours</p>
                        </div>
                      </div>

                      {student.studentProfile.sessionLogs && student.studentProfile.sessionLogs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">Last Session</p>
                            <p className="text-xs text-white">
                              {new Date(student.studentProfile.sessionLogs[0].date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
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
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Link Student Account</h3>
              <button
                onClick={() => {
                  setShowLinkForm(false)
                  setMessage(null)
                  setInviteKey('')
                }}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Enter the invite key provided by your student to link their account.
            </p>

            {message && showLinkForm && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                message.type === 'success' 
                  ? 'bg-green-900/50 text-green-300 border border-green-600' 
                  : 'bg-red-900/50 text-red-300 border border-red-600'
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Student Invite Key
                </label>
                <input
                  type="text"
                  value={inviteKey}
                  onChange={(e) => setInviteKey(e.target.value.toUpperCase())}
                  placeholder="e.g., UP-ABC123"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  The invite key should start with "UP-" followed by 6 characters
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
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || inviteKey.length < 9}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {linking ? 'Linking...' : 'Link Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Student Details</h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Basic Information</h4>
                <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {selectedStudent.name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {selectedStudent.name || 'Student'}
                      </h3>
                      <p className="text-sm text-gray-400">{selectedStudent.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3">
                    {selectedStudent.phoneNumber && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-300">{selectedStudent.phoneNumber}</span>
                      </div>
                    )}
                    {selectedStudent.timezone && (
                      <div className="flex items-center text-sm">
                        <Globe className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-300">{selectedStudent.timezone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-300 font-mono text-xs">{selectedStudent.inviteKey}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              {selectedStudent.studentProfile && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Academic Information</h4>
                  <div className="bg-gray-900 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Program</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-400/20 text-purple-300">
                          {selectedStudent.studentProfile.program.replace('_', ' ')}
                        </span>
                      </div>
                      {selectedStudent.studentProfile.gradeLevel && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Grade Level</p>
                          <p className="text-white">{selectedStudent.studentProfile.gradeLevel}</p>
                        </div>
                      )}
                    </div>

                    {selectedStudent.studentProfile.school && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">School</p>
                        <p className="text-white">{selectedStudent.studentProfile.school}</p>
                      </div>
                    )}

                    {(selectedStudent.studentProfile.currentScore || selectedStudent.studentProfile.targetScore) && (
                      <div className="flex items-center space-x-4">
                        <Target className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm">Score:</span>
                          <span className="text-white">
                            {selectedStudent.studentProfile.currentScore || '—'} → {selectedStudent.studentProfile.targetScore || '—'}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedStudent.studentProfile.academicGoals && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Academic Goals</p>
                        <p className="text-white text-sm">{selectedStudent.studentProfile.academicGoals}</p>
                      </div>
                    )}

                    {(selectedStudent.studentProfile.strengths || selectedStudent.studentProfile.weaknesses) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedStudent.studentProfile.strengths && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Strengths</p>
                            <p className="text-green-400 text-sm">{selectedStudent.studentProfile.strengths}</p>
                          </div>
                        )}
                        {selectedStudent.studentProfile.weaknesses && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Areas for Improvement</p>
                            <p className="text-yellow-400 text-sm">{selectedStudent.studentProfile.weaknesses}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedStudent.studentProfile.preferredSchedule && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Preferred Schedule</p>
                        <p className="text-white text-sm">{selectedStudent.studentProfile.preferredSchedule}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Session Statistics */}
              {selectedStudent.studentProfile && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Session Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-2xl font-bold text-white">
                        {selectedStudent.studentProfile._count.sessionLogs}
                      </p>
                      <p className="text-xs text-gray-400">Total Sessions</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-2xl font-bold text-white">
                        {selectedStudent.studentProfile.sessionLogs?.reduce((acc, log) => acc + log.duration, 0) || 0}h
                      </p>
                      <p className="text-xs text-gray-400">Total Hours</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleUnlinkStudent(selectedStudent.id)}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Unlink Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}