'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  GraduationCap, School, Target, BookOpen, 
  Calendar, Edit2, Save, X, AlertCircle,
  CheckCircle, User, Mail, Award
} from 'lucide-react'

interface StudentProfile {
  id: string
  studentId: string
  program: string
  gradeLevel?: string
  school?: string
  targetScore?: string
  currentScore?: string
  academicGoals?: string
  strengths?: string
  weaknesses?: string
  preferredSchedule?: string
  student: {
    id: string
    name?: string
    email?: string
    role: string
  }
}

interface StudentProfileEditProps {
  studentId: string
  initialProfile?: StudentProfile
}

export function StudentProfileEdit({ studentId, initialProfile }: StudentProfileEditProps) {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<StudentProfile | null>(initialProfile || null)
  const [loading, setLoading] = useState(!initialProfile)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    gradeLevel: '',
    school: '',
    targetScore: '',
    currentScore: '',
    academicGoals: '',
    strengths: '',
    weaknesses: '',
    preferredSchedule: '',
    program: 'ACADEMIC_SUPPORT'
  })

  // Determine user permissions
  const isAdmin = session?.user?.isAdmin || false
  const isParent = session?.user?.role === 'PARENT'
  const isStudent = session?.user?.id === studentId
  
  // Check which fields are editable based on role
  const canEditAllFields = isAdmin
  const canEditLearningGoals = isAdmin || isParent
  const canEditPreferences = isAdmin || isStudent

  useEffect(() => {
    if (!initialProfile && studentId) {
      fetchProfile()
    }
  }, [studentId])

  useEffect(() => {
    if (profile) {
      setFormData({
        gradeLevel: profile.gradeLevel || '',
        school: profile.school || '',
        targetScore: profile.targetScore || '',
        currentScore: profile.currentScore || '',
        academicGoals: profile.academicGoals || '',
        strengths: profile.strengths || '',
        weaknesses: profile.weaknesses || '',
        preferredSchedule: profile.preferredSchedule || '',
        program: profile.program || 'ACADEMIC_SUPPORT'
      })
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/students/${studentId}/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        setMessage({ type: 'error', text: 'Failed to load student profile' })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load student profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      // Prepare data based on user role
      let dataToSend: any = {}
      
      if (isAdmin) {
        // Admin can send all fields
        dataToSend = { ...formData }
      } else if (isParent) {
        // Parent can only send academicGoals
        dataToSend = { academicGoals: formData.academicGoals }
      } else if (isStudent) {
        // Student can send their editable fields
        dataToSend = {
          academicGoals: formData.academicGoals,
          preferredSchedule: formData.preferredSchedule,
          strengths: formData.strengths,
          weaknesses: formData.weaknesses
        }
      }

      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
        setEditMode(false)
        if (data.profile) {
          setProfile(data.profile)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  const renderField = (
    label: string,
    fieldName: keyof typeof formData,
    icon: React.ReactNode,
    editable: boolean,
    type: 'text' | 'textarea' | 'select' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const isEditable = editMode && editable
    const value = formData[fieldName]

    return (
      <div className="mb-4">
        <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
          {icon}
          <span className="ml-2">{label}</span>
          {!editable && isParent && (
            <span className="ml-2 text-xs text-gray-500">(Read-only)</span>
          )}
        </label>
        
        {isEditable ? (
          type === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
          ) : type === 'select' && options ? (
            <select
              value={value}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )
        ) : (
          <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
            {value || <span className="text-gray-500">Not set</span>}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Student Profile</h2>
          <p className="text-sm text-gray-400">
            {profile?.student.name || profile?.student.email}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!editMode && (canEditAllFields || canEditLearningGoals) && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
          
          {editMode && (
            <>
              <button
                onClick={() => {
                  setEditMode(false)
                  // Reset form data to original
                  if (profile) {
                    setFormData({
                      gradeLevel: profile.gradeLevel || '',
                      school: profile.school || '',
                      targetScore: profile.targetScore || '',
                      currentScore: profile.currentScore || '',
                      academicGoals: profile.academicGoals || '',
                      strengths: profile.strengths || '',
                      weaknesses: profile.weaknesses || '',
                      preferredSchedule: profile.preferredSchedule || '',
                      program: profile.program || 'ACADEMIC_SUPPORT'
                    })
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center ${
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

      {/* Role-based permission notice */}
      {isParent && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-600/50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
            <div className="text-sm text-blue-300">
              As a parent, you can edit the learning goals for your student. 
              Other fields are managed by administrators.
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          {renderField(
            'Program',
            'program',
            <GraduationCap className="h-4 w-4 text-gray-400" />,
            canEditAllFields,
            'select',
            [
              { value: 'SAT', label: 'SAT' },
              { value: 'ACT', label: 'ACT' },
              { value: 'ISEE', label: 'ISEE' },
              { value: 'SSAT', label: 'SSAT' },
              { value: 'HSPT', label: 'HSPT' },
              { value: 'ACADEMIC_SUPPORT', label: 'Academic Support' }
            ]
          )}
          
          {renderField(
            'Grade Level',
            'gradeLevel',
            <Award className="h-4 w-4 text-gray-400" />,
            canEditAllFields
          )}
          
          {renderField(
            'School Name',
            'school',
            <School className="h-4 w-4 text-gray-400" />,
            canEditAllFields
          )}
          
          {renderField(
            'Target Score',
            'targetScore',
            <Target className="h-4 w-4 text-gray-400" />,
            canEditAllFields
          )}
          
          {renderField(
            'Current Score',
            'currentScore',
            <Target className="h-4 w-4 text-gray-400" />,
            canEditAllFields
          )}
        </div>

        {/* Right Column */}
        <div>
          {renderField(
            'Learning Goals',
            'academicGoals',
            <BookOpen className="h-4 w-4 text-gray-400" />,
            canEditLearningGoals,
            'textarea'
          )}
          
          {renderField(
            'Strengths',
            'strengths',
            <CheckCircle className="h-4 w-4 text-gray-400" />,
            canEditPreferences,
            'textarea'
          )}
          
          {renderField(
            'Areas for Improvement',
            'weaknesses',
            <AlertCircle className="h-4 w-4 text-gray-400" />,
            canEditPreferences,
            'textarea'
          )}
          
          {renderField(
            'Preferred Schedule',
            'preferredSchedule',
            <Calendar className="h-4 w-4 text-gray-400" />,
            canEditPreferences,
            'textarea'
          )}
        </div>
      </div>
    </div>
  )
}