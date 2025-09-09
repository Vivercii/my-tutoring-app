'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Search, Plus, Filter, Download, Upload, Trash2, Edit3, 
  Mail, Phone, Globe, MapPin, Calendar, CreditCard, Award,
  ShieldCheck, Users, UserX, UserCheck, Shield, AlertCircle,
  UserCog, Eye, ChevronDown, ChevronUp, GraduationCap, Star,
  BookOpen, Video, Clock, DollarSign, TrendingUp, Activity,
  BarChart3, PieChart, Zap, Sparkles, RefreshCw, MoreVertical,
  CheckCircle, XCircle, Info, ArrowUpRight, ArrowDownRight,
  Hash, Percent, Target, Briefcase, Send, Copy, ExternalLink,
  Settings, Database, Key, Lock, Unlock, UserPlus, Grid, List,
  Home, ChevronLeft, FileText, MessageSquare, ArrowLeft
} from 'lucide-react'

// User type
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
  studentProfile?: {
    program: string
    gradeLevel?: string
  }
  tutorProfile?: {
    bio?: string
    hourlyRate?: number
    experienceYears?: number
    rating?: number
    totalSessions?: number
  }
  parentStudents?: any[]
  tutorStudents?: any[]
  credits?: number
}

// Stats card component
type ColorType = 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'cyan';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  change?: number;
  color?: ColorType;
  onClick?: () => void;
}

const StatCard = ({ icon: Icon, title, value, change, color = 'blue', onClick }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
  }

  return (
    <div 
      className={`p-6 rounded-xl border ${colorClasses[color]} backdrop-blur-sm cursor-pointer transition-all duration-200 group`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {change !== undefined && (
          <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{title}</div>
    </div>
  )
}

// User card component (compact version)
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onToggleActive: (userId: string, currentStatus: boolean) => void;
  onToggleAdmin: (userId: string, currentStatus: boolean) => void;
  onMasquerade: (user: User) => void;
  onView: (user: User) => void;
  actionLoading: string | null;
}

const UserCard = ({ user, onEdit, onToggleActive, onToggleAdmin, onMasquerade, onView, actionLoading }: UserCardProps) => {
  const [showMenu, setShowMenu] = useState(false)
  
  const roleColors = {
    STUDENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PARENT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    TUTOR: 'bg-green-500/10 text-green-400 border-green-500/20',
    ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  const roleIcons = {
    STUDENT: GraduationCap,
    PARENT: Home,
    TUTOR: BookOpen,
    ADMIN: Shield
  }

  const RoleIcon = roleIcons[user.role]

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Never logged in'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Online now'
    if (diffMins < 60) return `Active ${diffMins}m ago`
    if (diffHours < 24) return `Active ${diffHours}h ago`
    if (diffDays < 30) return `Active ${diffDays}d ago`
    return `Last seen ${d.toLocaleDateString()}`
  }

  return (
    <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
        {user.isAdmin && <Shield className="h-4 w-4 text-yellow-400" />}
      </div>
      
      {/* Card content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-4">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-xl ${roleColors[user.role]} flex items-center justify-center font-bold text-lg border backdrop-blur-sm`}>
            {getInitials(user.name, user.email)}
          </div>
          
          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate">
              {user.name || 'Unnamed User'}
            </h3>
            <p className="text-gray-400 text-sm truncate">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs ${roleColors[user.role]} border`}>
                <RoleIcon className="h-3 w-3" />
                <span>{user.role}</span>
              </span>
              {user.studentProfile?.program && (
                <span className="px-2 py-1 rounded-lg text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user.studentProfile.program}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Last Activity</div>
            <div className="text-sm text-gray-300 font-medium">{formatLastLogin(user.lastLoginAt)}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Joined</div>
            <div className="text-sm text-gray-300 font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="flex space-x-2">
          <button 
            onClick={() => onView(user)}
            className="flex-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs text-gray-300 transition-all flex items-center justify-center space-x-1 group/btn"
          >
            <Eye className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
            <span>View</span>
          </button>
          <button 
            onClick={() => onEdit(user)}
            className="flex-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs text-gray-300 transition-all flex items-center justify-center space-x-1 group/btn"
          >
            <Edit3 className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
            <span>Edit</span>
          </button>
          {user.role === 'STUDENT' && (
            <button 
              onClick={() => onMasquerade(user)}
              className="flex-1 px-3 py-2 bg-purple-700/50 hover:bg-purple-600/50 rounded-lg text-xs text-purple-300 transition-all flex items-center justify-center space-x-1 group/btn"
            >
              <UserCog className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
              <span>Masq</span>
            </button>
          )}
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs text-gray-300 transition-all"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>
        
        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-20 right-6 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50">
              <button
                onClick={() => { onToggleActive(user.id, user.isActive); setShowMenu(false) }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
              >
                {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
              </button>
              {user.role !== 'STUDENT' && (
                <button
                  onClick={() => { onToggleAdmin(user.id, user.isAdmin); setShowMenu(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
                >
                  {user.isAdmin ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>{user.isAdmin ? 'Remove Admin' : 'Make Admin'}</span>
                </button>
              )}
              <button
                onClick={() => { onMasquerade(user); setShowMenu(false) }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
              >
                <UserCheck className="h-4 w-4" />
                <span>Masquerade</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.isAdmin) {
      router.push('/login')
    }
  }, [session, status, router])
  
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'parents' | 'tutors' | 'admins'>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const limit = viewMode === 'grid' ? 12 : 20
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterProgram, setFilterProgram] = useState('all')
  const [filterExamType, setFilterExamType] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'lastLogin'>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  // UI states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Fetch users
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUsers', activeTab, currentPage, debouncedSearchQuery, filterStatus, filterProgram, filterExamType, sortBy, limit],
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
        ...(filterExamType.length > 0 && { examTypes: filterExamType.join(',') }),
        sort: sortBy
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
  
  const users = usersData?.users || []
  const totalPages = usersData?.pagination?.totalPages || 1
  const totalCount = usersData?.pagination?.totalCount || 0
  const stats = usersData?.stats || {}
  
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
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error starting masquerade:', error)
    }
  }
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">User Management</h1>
                <p className="text-xs text-gray-400">Manage all users, roles, and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors group"
              >
                <RefreshCw className="h-4 w-4 text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4 text-gray-300" /> : <Grid className="h-4 w-4 text-gray-300" />}
              </button>
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.total || 0}
            change={12}
            color="blue"
            onClick={() => setActiveTab('all')}
          />
          <StatCard
            icon={GraduationCap}
            title="Students"
            value={stats.byRole?.STUDENT || 0}
            color="cyan"
            onClick={() => setActiveTab('students')}
          />
          <StatCard
            icon={Home}
            title="Parents"
            value={stats.byRole?.PARENT || 0}
            color="purple"
            onClick={() => setActiveTab('parents')}
          />
          <StatCard
            icon={BookOpen}
            title="Tutors"
            value={stats.byRole?.TUTOR || 0}
            color="green"
            onClick={() => setActiveTab('tutors')}
          />
          <StatCard
            icon={Shield}
            title="Admins"
            value={stats.admins || 0}
            color="red"
            onClick={() => setActiveTab('admins')}
          />
          <StatCard
            icon={Activity}
            title="Active Now"
            value={stats.activeNow || 0}
            color="yellow"
          />
        </div>
        
        {/* Main Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-700 bg-gray-900/50">
            <nav className="flex space-x-1 px-6 py-4">
              {Object.entries(tabCounts).map(([key, count]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="font-medium capitalize">{key}</span>
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
          <div className="p-6 bg-gray-900/30">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Filters toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all ${
                    showFilters 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {(filterStatus !== 'all' || filterProgram !== 'all' || filterExamType.length > 0) && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {[filterStatus !== 'all', filterProgram !== 'all', filterExamType.length > 0].filter(Boolean).length}
                    </span>
                  )}
                </button>
                
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="lastLogin">Last Active</option>
                </select>
              </div>
            </div>
            
            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-4 p-6 bg-gray-800/50 rounded-xl border border-gray-700 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                  
                  {/* Program Filter (Legacy - for backward compatibility) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Quick Program Filter</label>
                    <select
                      value={filterProgram}
                      onChange={(e) => {
                        setFilterProgram(e.target.value)
                        // Also update exam type when using quick filter
                        if (e.target.value !== 'all') {
                          setFilterExamType([e.target.value])
                        } else {
                          setFilterExamType([])
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Programs</option>
                      <option value="SAT">SAT Only</option>
                      <option value="ACT">ACT Only</option>
                      <option value="ISEE">ISEE Only</option>
                      <option value="SSAT">SSAT Only</option>
                      <option value="HSPT">HSPT Only</option>
                    </select>
                  </div>
                  
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Date Range</label>
                    <select className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>All Time</option>
                      <option>Today</option>
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>Last 3 Months</option>
                    </select>
                  </div>
                </div>
                
                {/* Exam Type Checkboxes - The new feature! */}
                {(activeTab === 'all' || activeTab === 'students') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Filter by Exam Types 
                      <span className="ml-2 text-xs text-gray-500">(Select multiple)</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { value: 'SAT', label: 'SAT', color: 'blue' },
                        { value: 'ACT', label: 'ACT', color: 'green' },
                        { value: 'ISEE', label: 'ISEE', color: 'purple' },
                        { value: 'SSAT', label: 'SSAT', color: 'yellow' },
                        { value: 'HSPT', label: 'HSPT', color: 'red' },
                        { value: 'ACADEMIC_SUPPORT', label: 'Academic', color: 'cyan' }
                      ].map((exam) => {
                        const isSelected = filterExamType.includes(exam.value)
                        const colorClasses = {
                          blue: 'border-blue-500 bg-blue-500/10 text-blue-400',
                          green: 'border-green-500 bg-green-500/10 text-green-400',
                          purple: 'border-purple-500 bg-purple-500/10 text-purple-400',
                          yellow: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
                          red: 'border-red-500 bg-red-500/10 text-red-400',
                          cyan: 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        }
                        
                        return (
                          <label
                            key={exam.value}
                            className={`
                              relative flex items-center justify-center px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all
                              ${isSelected 
                                ? colorClasses[exam.color as keyof typeof colorClasses]
                                : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterExamType([...filterExamType, exam.value])
                                  setFilterProgram('all') // Clear quick filter
                                } else {
                                  setFilterExamType(filterExamType.filter(t => t !== exam.value))
                                }
                              }}
                            />
                            <span className="font-medium">{exam.label}</span>
                            {isSelected && (
                              <CheckCircle className="absolute top-1 right-1 h-3 w-3" />
                            )}
                          </label>
                        )
                      })}
                    </div>
                    
                    {/* Quick select buttons */}
                    <div className="flex items-center space-x-3 mt-3">
                      <span className="text-xs text-gray-500">Quick select:</span>
                      <button
                        onClick={() => setFilterExamType(['SAT', 'ACT'])}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        SAT & ACT
                      </button>
                      <button
                        onClick={() => setFilterExamType(['ISEE', 'SSAT', 'HSPT'])}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Private School
                      </button>
                      <button
                        onClick={() => setFilterExamType(['SAT', 'ACT', 'ISEE', 'SSAT', 'HSPT'])}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        All Tests
                      </button>
                      <button
                        onClick={() => setFilterExamType([])}
                        className="text-xs text-gray-400 hover:text-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Filter Summary */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-400">
                      Showing <span className="text-white font-medium">{users.length}</span> of <span className="text-white font-medium">{totalCount}</span> users
                    </div>
                    {filterExamType.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Filtering:</span>
                        {filterExamType.map(type => (
                          <span key={type} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setFilterStatus('all')
                      setFilterProgram('all')
                      setFilterExamType([])
                      setSortBy('newest')
                      setSearchQuery('')
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Clear all filters</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Users Grid/List */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-400">Loading users...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{error instanceof Error ? error.message : 'Failed to fetch users'}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Add First User
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              // List view
              <div className="overflow-hidden rounded-xl border border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map((user: User) => (
                      <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.name || 'Unnamed User'}</div>
                              <div className="text-gray-400 text-sm">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'STUDENT' ? 'bg-blue-500/20 text-blue-400' :
                            user.role === 'PARENT' ? 'bg-purple-500/20 text-purple-400' :
                            user.role === 'TUTOR' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                              title="Edit user"
                            >
                              <Edit3 className="h-4 w-4 text-gray-400" />
                            </button>
                            {user.role === 'STUDENT' && (
                              <button
                                onClick={() => handleMasquerade(user)}
                                className="p-1.5 rounded hover:bg-purple-700 transition-colors"
                                title="Masquerade as student"
                              >
                                <UserCog className="h-4 w-4 text-purple-400" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? <UserX className="h-4 w-4 text-gray-400" /> : <UserCheck className="h-4 w-4 text-gray-400" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 7) {
                        pageNum = i + 1
                      } else if (currentPage <= 4) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i
                      } else {
                        pageNum = currentPage - 3 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-110'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}