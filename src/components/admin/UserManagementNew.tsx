'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { 
  Search, Plus, Filter, Download, Upload, Trash2, Edit3, 
  Mail, Phone, Globe, MapPin, Calendar, CreditCard, Award,
  ShieldCheck, Users, UserX, UserCheck, Shield, AlertCircle,
  UserCog, Eye, ChevronDown, ChevronUp, GraduationCap, Star,
  BookOpen, Video, Clock, DollarSign, TrendingUp, Activity,
  BarChart3, PieChart, Zap, Sparkles, RefreshCw, MoreVertical,
  CheckCircle, XCircle, Info, ArrowUpRight, ArrowDownRight,
  Hash, Percent, Target, Briefcase, Send, Copy, ExternalLink,
  Settings, Database, Key, Lock, Unlock, UserPlus, Grid, List
} from 'lucide-react'

interface UserManagementProps {
  statsRefetch: () => void
}

// User type with all fields
interface User {
  id: string
  email: string
  name: string | null
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN'
  isActive: boolean
  isAdmin: boolean
  createdAt: string
  lastLoginAt: string | null
  phoneNumber?: string
  timezone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  studentProfile?: {
    program: string
    gradeLevel?: string
    school?: string
    targetScore?: number
    currentScore?: number
  }
  tutorProfile?: {
    bio?: string
    hourlyRate?: number
    experienceYears?: number
    rating?: number
    totalSessions?: number
    subjects?: string[]
    availability?: any
  }
  parentStudents?: any[]
  tutorStudents?: any[]
  credits?: number
  totalSpent?: number
  sessionsCompleted?: number
}

// Stats card component
const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }: any) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5" />
        {change !== undefined && (
          <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80 mt-1">{title}</div>
    </div>
  )
}

// User card component
const UserCard = ({ user, onEdit, onToggleActive, onToggleAdmin, onMasquerade, onView, actionLoading }: any) => {
  const [showMenu, setShowMenu] = useState(false)
  
  const roleColors = {
    STUDENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PARENT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    TUTOR: 'bg-green-500/10 text-green-400 border-green-500/20',
    ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-xl hover:shadow-black/20">
      {/* Status indicator */}
      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
      
      {/* Card content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-xl ${roleColors[user.role as keyof typeof roleColors] || roleColors.STUDENT} flex items-center justify-center font-semibold`}>
              {getInitials(user.name, user.email)}
            </div>
            
            {/* Name and email */}
            <div>
              <h3 className="text-white font-semibold text-lg">
                {user.name || 'Unnamed User'}
                {user.isAdmin && (
                  <Shield className="inline-block ml-2 h-4 w-4 text-yellow-400" />
                )}
              </h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
          
          {/* Action menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50">
                  <button
                    onClick={() => { onView(user); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => { onEdit(user); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit User</span>
                  </button>
                  {user.isAdmin ? (
                    <button
                      onClick={() => { onMasquerade(user); setShowMenu(false) }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Masquerade</span>
                    </button>
                  ) : null}
                  <div className="border-t border-gray-700 my-1" />
                  <button
                    onClick={() => { onToggleActive(user.id, user.isActive); setShowMenu(false) }}
                    disabled={actionLoading === user.id}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                  {user.role !== 'STUDENT' && (
                    <button
                      onClick={() => { onToggleAdmin(user.id, user.isAdmin); setShowMenu(false) }}
                      disabled={actionLoading === user.id}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2 disabled:opacity-50"
                    >
                      {user.isAdmin ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      <span>{user.isAdmin ? 'Remove Admin' : 'Make Admin'}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-lg text-xs ${roleColors[user.role as keyof typeof roleColors] || roleColors.STUDENT} border`}>
            {user.role}
          </span>
          {user.studentProfile?.program && (
            <span className="px-2 py-1 rounded-lg text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {user.studentProfile.program}
            </span>
          )}
          {user.tutorProfile?.rating && (
            <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center space-x-1">
              <Star className="h-3 w-3" />
              <span>{user.tutorProfile.rating.toFixed(1)}</span>
            </span>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Last Login</div>
            <div className="text-sm text-gray-300">{formatLastLogin(user.lastLoginAt)}</div>
          </div>
          {user.role === 'STUDENT' && (
            <>
              <div>
                <div className="text-xs text-gray-500 mb-1">Sessions</div>
                <div className="text-sm text-gray-300">{user.sessionsCompleted || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Credits</div>
                <div className="text-sm text-gray-300">{user.credits || 0}</div>
              </div>
            </>
          )}
          {user.role === 'PARENT' && (
            <>
              <div>
                <div className="text-xs text-gray-500 mb-1">Students</div>
                <div className="text-sm text-gray-300">{user.parentStudents?.length || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Spent</div>
                <div className="text-sm text-gray-300">${(user.totalSpent || 0) / 100}</div>
              </div>
            </>
          )}
          {user.role === 'TUTOR' && (
            <>
              <div>
                <div className="text-xs text-gray-500 mb-1">Students</div>
                <div className="text-sm text-gray-300">{user.tutorStudents?.length || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Sessions</div>
                <div className="text-sm text-gray-300">{user.tutorProfile?.totalSessions || 0}</div>
              </div>
            </>
          )}
        </div>
        
        {/* Quick actions */}
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors flex items-center justify-center space-x-1">
            <Mail className="h-3 w-3" />
            <span>Email</span>
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors flex items-center justify-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Activity</span>
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors flex items-center justify-center space-x-1">
            <Settings className="h-3 w-3" />
            <span>Settings</span>
          </button>
          {user.role === 'STUDENT' && (
            <button 
              onClick={() => onMasquerade(user)}
              className="flex-1 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-xs text-purple-300 transition-colors flex items-center justify-center space-x-1"
            >
              <UserCog className="h-3 w-3" />
              <span>Masq</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function UserManagementNew({ statsRefetch }: UserManagementProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'parents' | 'tutors' | 'admins'>('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const limit = viewMode === 'grid' ? 12 : 20
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterProgram, setFilterProgram] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'lastLogin'>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  // UI states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Fetch users
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUsers', activeTab, currentPage, debouncedSearchQuery, filterStatus, filterProgram, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: debouncedSearchQuery,
        ...(activeTab !== 'all' && {
          ...(activeTab === 'students' && { role: 'STUDENT' }),
          ...(activeTab === 'parents' && { role: 'PARENT' }),
          ...(activeTab === 'tutors' && { role: 'TUTOR' }),
          ...(activeTab === 'admins' && { admin: 'true' })
        }),
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' ? 'true' : 'false' }),
        ...(filterProgram !== 'all' && { program: filterProgram }),
        sort: sortBy
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
  
  // Extract data
  const users = usersData?.users || []
  const totalPages = usersData?.pagination?.totalPages || 1
  const totalCount = usersData?.pagination?.totalCount || 0
  const stats = usersData?.stats || {}
  
  // Calculate quick stats
  const quickStats = useMemo(() => {
    if (!stats) return { activeUsers: 0, newToday: 0, newWeek: 0, growth: 0 }
    return {
      activeUsers: stats.activeCount || 0,
      newToday: stats.newToday || 0,
      newWeek: stats.newWeek || 0,
      growth: stats.growthPercent || 0
    }
  }, [stats])
  
  // Tab counts
  const tabCounts = {
    all: stats.total || 0,
    students: stats.byRole?.STUDENT || 0,
    parents: stats.byRole?.PARENT || 0,
    tutors: stats.byRole?.TUTOR || 0,
    admins: stats.admins || 0
  }
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filterStatus, filterProgram, sortBy])
  
  // Handlers
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update user status')
      
      await queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      statsRefetch()
    } catch (error) {
      console.error('Error toggling user status:', error)
    } finally {
      setActionLoading(null)
    }
  }
  
  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update admin status')
      
      await queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      statsRefetch()
    } catch (error) {
      console.error('Error toggling admin status:', error)
    } finally {
      setActionLoading(null)
    }
  }
  
  const handleMasquerade = async (user: User) => {
    try {
      const response = await fetch('/api/admin/masquerade/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update session and redirect
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error starting masquerade:', error)
    }
  }
  
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return
    
    // Implement bulk actions
    for (const userId of selectedUsers) {
      if (bulkAction === 'activate' || bulkAction === 'deactivate') {
        await handleToggleActive(userId, bulkAction === 'deactivate')
      }
      // Add delete logic if needed
    }
    
    setSelectedUsers([])
    setBulkAction(null)
  }
  
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            <p className="text-gray-400 text-sm mt-1">Manage all users, roles, and permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-gray-300" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4 text-gray-300" /> : <Grid className="h-4 w-4 text-gray-300" />}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            title="Total Users"
            value={totalCount}
            change={quickStats.growth}
            color="blue"
          />
          <StatCard
            icon={Activity}
            title="Active Users"
            value={quickStats.activeUsers}
            color="green"
          />
          <StatCard
            icon={UserPlus}
            title="New Today"
            value={quickStats.newToday}
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            title="New This Week"
            value={quickStats.newWeek}
            change={12}
            color="yellow"
          />
        </div>
        
        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-1 px-6 py-3">
              {Object.entries(tabCounts).map(([key, count]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="capitalize">{key}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === key
                      ? 'bg-white/20'
                      : 'bg-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Filters */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Filter button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    showFilters 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {(filterStatus !== 'all' || filterProgram !== 'all') && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {[filterStatus !== 'all', filterProgram !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                </button>
                
                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="lastLogin">Last Login</option>
                </select>
              </div>
              
              {/* Bulk actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-400">
                    {selectedUsers.length} selected
                  </span>
                  <select
                    value={bulkAction || ''}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
            
            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Program</label>
                    <select
                      value={filterProgram}
                      onChange={(e) => setFilterProgram(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="all">All Programs</option>
                      <option value="SAT">SAT</option>
                      <option value="ACT">ACT</option>
                      <option value="ISEE">ISEE</option>
                      <option value="SSAT">SSAT</option>
                      <option value="HSPT">HSPT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Date Range</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm">
                      <option>All Time</option>
                      <option>Today</option>
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>Last 3 Months</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFilterStatus('all')
                    setFilterProgram('all')
                    setSortBy('newest')
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear all filters
                </button>
              </div>
            )}
            
            {/* Users Grid/List */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">
                {error instanceof Error ? error.message : 'Failed to fetch users'}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No users found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add First User
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {users.map((user: User) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={setEditingUser}
                    onToggleActive={handleToggleActive}
                    onToggleAdmin={handleToggleAdmin}
                    onMasquerade={handleMasquerade}
                    onView={setSelectedUser}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            ) : (
              // List view (simplified for brevity)
              <div className="mt-6 space-y-2">
                {users.map((user: User) => (
                  <div key={user.id} className="p-4 bg-gray-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id])
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                      <div>
                        <div className="text-white font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-gray-400">{user.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 rounded hover:bg-gray-600"
                      >
                        <Edit3 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}