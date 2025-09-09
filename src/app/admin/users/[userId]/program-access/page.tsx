'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Plus, Trash2, Check, X } from 'lucide-react'
import Link from 'next/link'

const programs = [
  { value: 'SAT', label: 'SAT', color: 'bg-blue-500' },
  { value: 'ACT', label: 'ACT', color: 'bg-green-500' },
  { value: 'ISEE', label: 'ISEE', color: 'bg-purple-500' },
  { value: 'SSAT', label: 'SSAT', color: 'bg-orange-500' },
  { value: 'HSPT', label: 'HSPT', color: 'bg-red-500' },
  { value: 'ACADEMIC_SUPPORT', label: 'Academic Support', color: 'bg-gray-500' }
]

interface ProgramAccess {
  id: string
  program: string
  createdAt: string
}

export default function UserProgramAccessPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const userId = params.userId as string
  
  const [userAccess, setUserAccess] = useState<ProgramAccess[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState('')
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    fetchUserInfo()
    fetchProgramAccess()
  }, [userId])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  const fetchProgramAccess = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/program-access`)
      if (response.ok) {
        const data = await response.json()
        setUserAccess(data.programAccess || [])
        setStudentProfile(data.studentProfile)
      }
    } catch (error) {
      console.error('Failed to fetch program access:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProgramAccess = async () => {
    if (!selectedProgram) return
    
    setAdding(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/program-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: selectedProgram })
      })
      
      if (response.ok) {
        await fetchProgramAccess()
        setSelectedProgram('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add program access')
      }
    } catch (error) {
      console.error('Failed to add program access:', error)
    } finally {
      setAdding(false)
    }
  }

  const removeProgramAccess = async (program: string) => {
    if (!confirm(`Remove ${program} access?`)) return
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/program-access`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program })
      })
      
      if (response.ok) {
        await fetchProgramAccess()
      }
    } catch (error) {
      console.error('Failed to remove program access:', error)
    }
  }

  const availablePrograms = programs.filter(
    p => !userAccess.some(a => a.program === p.value)
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/users"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Program Access</h1>
              <p className="text-gray-400 text-sm mt-1">
                {userInfo?.name || userInfo?.email || 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Add Program Access */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Add Program Access</h2>
            <div className="flex gap-3">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                disabled={availablePrograms.length === 0}
              >
                <option value="">Select a program...</option>
                {availablePrograms.map(prog => (
                  <option key={prog.value} value={prog.value}>{prog.label}</option>
                ))}
              </select>
              <button
                onClick={addProgramAccess}
                disabled={!selectedProgram || adding}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {adding ? 'Adding...' : 'Add Access'}
              </button>
            </div>
            {availablePrograms.length === 0 && (
              <p className="text-green-400 text-sm mt-3">
                ✅ User has access to all available programs
              </p>
            )}
          </div>

          {/* Current Access */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Current Program Access</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : userAccess.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No program access configured</p>
                <p className="text-sm text-gray-500 mt-2">
                  Add program access above to allow this user to see exams
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userAccess.map((access) => {
                  const programInfo = programs.find(p => p.value === access.program)
                  return (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded ${programInfo?.color || 'bg-gray-500'}`} />
                        <div>
                          <p className="text-white font-medium">
                            {programInfo?.label || access.program}
                          </p>
                          <p className="text-xs text-gray-400">
                            Added {new Date(access.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeProgramAccess(access.program)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Student Profile Info */}
            {studentProfile && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Student Profile Program:</p>
                <p className="text-white">
                  {programs.find(p => p.value === studentProfile.program)?.label || studentProfile.program || 'Not set'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Add All Button */}
          {availablePrograms.length > 3 && (
            <div className="mt-6 text-center">
              <button
                onClick={async () => {
                  for (const prog of availablePrograms) {
                    await fetch(`/api/admin/users/${userId}/program-access`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ program: prog.value })
                    })
                  }
                  await fetchProgramAccess()
                }}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Add access to all remaining programs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}