'use client'

import React, { useState, useEffect } from 'react'
import { UserTableRow } from './UserTableRow'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { 
  Search, Plus, ChevronLeft, ChevronRight, X, Edit, 
  Mail, Phone, Globe, Home, MessageSquare, CreditCard, 
  ShieldCheck, Users, UserX, UserCheck, ShieldOff, Shield, 
  UserCog, Eye, ChevronDown, ChevronUp, GraduationCap, 
  BookOpen, AlertCircle, Video
} from 'lucide-react'

interface UserManagementProps {
  statsRefetch: () => void
}

export function UserManagement({ statsRefetch }: UserManagementProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'parents' | 'students' | 'tutors' | 'staff'>('students')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 10
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  // UI states
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Tutor assignment states
  const [showAssignTutorModal, setShowAssignTutorModal] = useState(false)
  const [selectedStudentForTutor, setSelectedStudentForTutor] = useState<any>(null)
  const [selectedTutorId, setSelectedTutorId] = useState('')
  const [assigningTutor, setAssigningTutor] = useState(false)
  
  // Form states for create/edit modal
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'STUDENT',
    isActive: true,
    phoneNumber: '',
    timezone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    preferredContact: 'email',
    program: 'SAT', // Added program field for students
    zoomLink: '', // Added zoom link field for tutors
    // Tutor profile fields
    bio: '',
    hourlyRate: '',
    experienceYears: '',
    education: '',
    subjects: '',
    gradeLevels: '',
    languages: '',
    specializations: '',
    maxStudents: '10'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Fetch users using React Query with dynamic keys
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUsers', activeTab, currentPage, debouncedSearchQuery, selectedProgram],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: debouncedSearchQuery,
        ...(activeTab === 'parents' && { role: 'PARENT' }),
        ...(activeTab === 'students' && { role: 'STUDENT' }),
        ...(activeTab === 'tutors' && { role: 'TUTOR' }),
        ...(activeTab === 'staff' && { staff: 'true' }),
        ...(selectedProgram !== 'all' && { program: selectedProgram })
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
  
  // Extract data from query result
  const users = usersData?.users || []
  const totalPages = usersData?.pagination?.totalPages || 1
  const totalCount = usersData?.pagination?.totalCount || 0
  const tabCounts = {
    parents: usersData?.stats?.byRole?.PARENT || 0,
    students: usersData?.stats?.byRole?.STUDENT || 0,
    tutors: usersData?.stats?.byRole?.TUTOR || 0,
    staff: usersData?.stats?.admins || 0
  }
  
  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1)
    setExpandedUserId(null)
  }, [activeTab])
  
  // Fetch tutors using React Query
  const { data: tutorsData, isLoading: loadingTutors, refetch: fetchTutors } = useQuery({
    queryKey: ['adminTutors'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tutors')
      if (!response.ok) throw new Error('Failed to fetch tutors')
      return response.json()
    },
    enabled: false, // Only fetch when needed (manual trigger)
    staleTime: 5 * 60 * 1000,
  })
  
  const tutors = tutorsData?.tutors || []
  
  // Handle user activation/deactivation
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update user status')
      
      // Invalidate and refetch the current tab's data
      await queryClient.invalidateQueries({ queryKey: ['adminUsers', activeTab] })
      statsRefetch()
    } catch (error) {
      console.error('Error toggling user status:', error)
    } finally {
      setActionLoading(null)
    }
  }
  
  // Handle admin privileges toggle
  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update admin status')
      
      // Invalidate and refetch the current tab's data
      await queryClient.invalidateQueries({ queryKey: ['adminUsers', activeTab] })
      statsRefetch()
    } catch (error) {
      console.error('Error toggling admin status:', error)
    } finally {
      setActionLoading(null)
    }
  }
  
  // Handle tutor assignment
  const handleAssignTutor = async () => {
    if (!selectedTutorId || !selectedStudentForTutor) return
    
    setAssigningTutor(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedStudentForTutor.id}/assign-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: selectedTutorId })
      })
      
      if (!response.ok) throw new Error('Failed to assign tutor')
      
      setShowAssignTutorModal(false)
      setSelectedStudentForTutor(null)
      setSelectedTutorId('')
      // Invalidate both students and tutors data
      await queryClient.invalidateQueries({ queryKey: ['adminUsers', 'students'] })
      await queryClient.invalidateQueries({ queryKey: ['adminTutors'] })
    } catch (error) {
      console.error('Error assigning tutor:', error)
    } finally {
      setAssigningTutor(false)
    }
  }
  
  // Handle user creation/update
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users'
      
      const response = await fetch(url, {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Show the actual error message from the API
        const errorMessage = data.error || 'Failed to save user'
        console.error('Error saving user:', errorMessage)
        alert(`Error: ${errorMessage}`)
        return
      }
      
      // If creating/updating a tutor, also save tutor profile
      if (formData.role === 'TUTOR' && data.id) {
        const tutorProfileResponse = await fetch(`/api/admin/tutors/${data.id}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bio: formData.bio,
            hourlyRate: formData.hourlyRate,
            experienceYears: formData.experienceYears,
            education: formData.education,
            subjects: formData.subjects,
            gradeLevels: formData.gradeLevels,
            languages: formData.languages,
            specializations: formData.specializations,
            maxStudents: formData.maxStudents
          })
        })
        
        if (!tutorProfileResponse.ok) {
          console.error('Warning: Failed to save tutor profile details')
        }
      }
      
      setShowCreateModal(false)
      setEditingUser(null)
      resetForm()
      // Invalidate all user queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      statsRefetch()
    } catch (error) {
      console.error('Error saving user:', error)
      alert('An unexpected error occurred while saving the user')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Helper functions
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'STUDENT',
      isActive: true,
      phoneNumber: '',
      timezone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      preferredContact: 'email',
      program: 'SAT',
      zoomLink: '',
      bio: '',
      hourlyRate: '',
      experienceYears: '',
      education: '',
      subjects: '',
      gradeLevels: '',
      languages: '',
      specializations: '',
      maxStudents: '10'
    })
  }
  
  const startEditUser = (user: any) => {
    setFormData({
      email: user.email || '',
      name: user.name || '',
      role: user.role || 'STUDENT',
      isActive: user.isActive ?? true,
      phoneNumber: user.phoneNumber || '',
      timezone: user.timezone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      country: user.country || '',
      preferredContact: user.preferredContact || 'email',
      program: user.studentProfile?.program || 'SAT', // Get program from studentProfile
      zoomLink: user.zoomLink || '', // Get zoom link for tutors
      // Tutor profile fields
      bio: user.tutorProfile?.bio || '',
      hourlyRate: user.tutorProfile?.hourlyRate?.toString() || '',
      experienceYears: user.tutorProfile?.experienceYears?.toString() || '',
      education: user.tutorProfile?.education || '',
      subjects: user.tutorProfile?.subjects?.join(', ') || '',
      gradeLevels: user.tutorProfile?.gradeLevels?.join(', ') || '',
      languages: user.tutorProfile?.languages?.join(', ') || '',
      specializations: user.tutorProfile?.specializations?.join(', ') || '',
      maxStudents: user.tutorProfile?.maxStudents?.toString() || '10'
    })
    setEditingUser(user)
  }
  
  const openAssignTutorModal = async (student: any) => {
    setSelectedStudentForTutor(student)
    setShowAssignTutorModal(true)
    await fetchTutors()
  }
  
  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return d.toLocaleDateString()
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100)
  }
  
  return (
    <>
      <div className="bg-gray-800 rounded-lg shadow-xl">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-1 px-6 py-3" aria-label="Tabs">
            {[
              { id: 'students', label: 'Students', count: tabCounts.students, icon: GraduationCap },
              { id: 'parents', label: 'Parents', count: tabCounts.parents, icon: Home },
              { id: 'tutors', label: 'Tutors', count: tabCounts.tutors, icon: BookOpen },
              { id: 'staff', label: 'Staff', count: tabCounts.staff, icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Filters Section */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              {activeTab === 'students' && (
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Programs</option>
                  <option value="SAT">SAT</option>
                  <option value="ACT">ACT</option>
                  <option value="ISEE">ISEE</option>
                  <option value="SSAT">SSAT</option>
                  <option value="HSPT">HSPT</option>
                  <option value="ACADEMIC_SUPPORT">Academic Support</option>
                </select>
              )}
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create User</span>
            </button>
          </div>
        </div>
        
        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                {activeTab === 'students' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Linked Parent(s)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned Tutor(s)</th>
                  </>
                )}
                {activeTab === 'parents' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                  </>
                )}
                {activeTab === 'tutors' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Students Assigned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                  </>
                )}
                {activeTab === 'staff' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
                      <span className="text-gray-400">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-400">
                    {error instanceof Error ? error.message : 'Failed to fetch users'}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No {activeTab} found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    activeTab={activeTab}
                    expandedUserId={expandedUserId}
                    setExpandedUserId={setExpandedUserId}
                    setSelectedUser={setSelectedUser}
                    startEditUser={startEditUser}
                    openAssignTutorModal={openAssignTutorModal}
                    handleToggleActive={handleToggleActive}
                    handleToggleAdmin={handleToggleAdmin}
                    actionLoading={actionLoading}
                    session={session}
                    formatDate={formatDate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-900 px-6 py-3 flex items-center justify-between border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={() => setSelectedUser(null)}
            />
            
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-lg">
              <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                {/* Add user details content here */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Account Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Mail className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                        <div>
                          <div className="text-sm text-gray-300">Email</div>
                          <div className="text-white">{selectedUser.email || 'Not provided'}</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Users className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                        <div>
                          <div className="text-sm text-gray-300">Name</div>
                          <div className="text-white">{selectedUser.name || 'Not provided'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Account Status</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-300 mb-1">Role</div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                          {selectedUser.role}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-300 mb-1">Status</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedUser.isActive 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={() => {
                setShowCreateModal(false)
                setEditingUser(null)
                resetForm()
              }}
            />
            
            <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-lg">
              <form onSubmit={handleSubmitUser}>
                <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingUser(null)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  {/* Add form fields here */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Role *
                      </label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="PARENT">Parent</option>
                        <option value="TUTOR">Tutor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.isActive.toString()}
                        onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Program field for students */}
                  {formData.role === 'STUDENT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Program *
                      </label>
                      <select
                        required
                        value={formData.program}
                        onChange={(e) => setFormData({...formData, program: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="SAT">SAT</option>
                        <option value="ACT">ACT</option>
                        <option value="ISEE">ISEE</option>
                        <option value="SSAT">SSAT</option>
                        <option value="HSPT">HSPT</option>
                        <option value="ACADEMIC_SUPPORT">Academic Support</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Tutor fields */}
                  {formData.role === 'TUTOR' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                          <Video className="h-4 w-4 mr-1" />
                          Tutor's Zoom Link
                        </label>
                        <input
                          type="url"
                          placeholder="https://zoom.us/j/..."
                          value={formData.zoomLink}
                          onChange={(e) => setFormData({...formData, zoomLink: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Static Zoom meeting link for tutoring sessions
                        </p>
                      </div>
                      
                      {/* Bio */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Professional Bio
                        </label>
                        <textarea
                          placeholder="Brief professional summary..."
                          value={formData.bio}
                          onChange={(e) => setFormData({...formData, bio: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      {/* Hourly Rate and Experience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          placeholder="75"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          placeholder="5"
                          value={formData.experienceYears}
                          onChange={(e) => setFormData({...formData, experienceYears: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      {/* Education */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Education Background
                        </label>
                        <input
                          type="text"
                          placeholder="B.S. Mathematics, MIT"
                          value={formData.education}
                          onChange={(e) => setFormData({...formData, education: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      {/* Subjects */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Subjects (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Math, Physics, Chemistry, Biology"
                          value={formData.subjects}
                          onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      {/* Grade Levels */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Grade Levels (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="9th, 10th, 11th, 12th, College"
                          value={formData.gradeLevels}
                          onChange={(e) => setFormData({...formData, gradeLevels: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      {/* Languages */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Languages (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="English, Spanish"
                          value={formData.languages}
                          onChange={(e) => setFormData({...formData, languages: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      {/* Max Students */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Max Students
                        </label>
                        <input
                          type="number"
                          placeholder="10"
                          value={formData.maxStudents}
                          onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      {/* Specializations */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Specializations (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="AP Courses, Test Prep, Special Needs, Test Anxiety"
                          value={formData.specializations}
                          onChange={(e) => setFormData({...formData, specializations: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="bg-gray-700 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingUser(null)
                      resetForm()
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign Tutor Modal */}
      {showAssignTutorModal && selectedStudentForTutor && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={() => {
                setShowAssignTutorModal(false)
                setSelectedStudentForTutor(null)
                setSelectedTutorId('')
              }}
            />
            
            <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-lg">
              <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Assign Tutor</h3>
                <button
                  onClick={() => {
                    setShowAssignTutorModal(false)
                    setSelectedStudentForTutor(null)
                    setSelectedTutorId('')
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-300">Assigning tutor for:</div>
                  <div className="text-white font-medium">
                    {selectedStudentForTutor.name || 'Unnamed Student'}
                  </div>
                  <div className="text-sm text-gray-400">{selectedStudentForTutor.email}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Tutor
                  </label>
                  {loadingTutors ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <select
                      value={selectedTutorId}
                      onChange={(e) => setSelectedTutorId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select a tutor...</option>
                      {tutors.map((tutor) => (
                        <option key={tutor.id} value={tutor.id}>
                          {tutor.name} ({tutor.email}) - {tutor.studentCount} students
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                {tutors.length === 0 && !loadingTutors && (
                  <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      No tutors available. Please create tutor accounts first.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-700 px-6 py-3 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignTutorModal(false)
                    setSelectedStudentForTutor(null)
                    setSelectedTutorId('')
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTutor}
                  disabled={!selectedTutorId || assigningTutor}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigningTutor ? 'Assigning...' : 'Assign Tutor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}