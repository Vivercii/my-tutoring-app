'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, UserCheck, Users, AlertTriangle, X } from 'lucide-react'

interface Student {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

interface MasqueradePanelProps {
  onClose: () => void
}

export default function MasqueradePanel({ onClose }: MasqueradePanelProps) {
  const { data: session, update: updateSession } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [startingMasquerade, setStartingMasquerade] = useState<string | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [searchQuery])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await fetch(`/api/admin/students?${params}`)
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

  const startMasquerade = async (studentId: string, studentEmail: string) => {
    console.log('[FRONTEND] Starting masquerade for:', { studentId, studentEmail })
    setStartingMasquerade(studentId)
    try {
      const requestBody = { targetUserId: studentId }
      console.log('[FRONTEND] Sending request body:', requestBody)
      
      const response = await fetch('/api/admin/masquerade/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[FRONTEND] Masquerade response:', data)
        
        // Update the session with masquerade data
        await updateSession({
          masquerading: data.masqueradeData
        })
        
        console.log('[FRONTEND] Session updated, redirecting...')
        // Force page reload to pick up new session
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      } else {
        const error = await response.json()
        alert(`Failed to start masquerade: ${error.error}`)
      }
    } catch (error) {
      console.error('Error starting masquerade:', error)
      alert('Failed to start masquerade')
    } finally {
      setStartingMasquerade(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <UserCheck className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Masquerade as Student</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-semibold mb-1">Important</h3>
              <p className="text-yellow-300 text-sm">
                Masquerading allows you to see the exact experience a student sees. You'll be temporarily logged in as them 
                until you stop masquerading. Use this responsibly for support and debugging purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No students found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">
                          {student.name || 'No name'}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.isActive 
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-red-900/50 text-red-400'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs">
                          {student.role}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{student.email}</p>
                      <div className="text-xs text-gray-500">
                        Joined: {formatDate(student.createdAt)} • Last login: {formatDate(student.lastLoginAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log('[FRONTEND] Button clicked for student:', { 
                          id: student.id, 
                          name: student.name, 
                          email: student.email 
                        })
                        startMasquerade(student.id, student.email)
                      }}
                      disabled={startingMasquerade === student.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {startingMasquerade === student.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Starting...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Masquerade
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}