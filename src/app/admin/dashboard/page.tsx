'use client'

import React, { useState, useEffect } from 'react'
import { UserManagementNew } from '@/components/admin/UserManagementNew'
import { StatsCard, MiniStatsCard } from '@/components/admin/StatsCard'
import { generateTrendData } from '@/lib/utils/trends'
import MasqueradePanel from '@/components/admin/MasqueradePanel'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  LogOut,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Megaphone,
  Users,
  Settings,
  FileText,
  BookOpen,
  UserCheck
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface Stats {
  byRole: {
    PARENT?: number
    STUDENT?: number
    INSTITUTION?: number
    TUTOR?: number
    PROGRAM_COORDINATOR?: number
  }
  byProgram: {
    ACT?: number
    SAT?: number
    ISEE?: number
    SSAT?: number
    HSPT?: number
    ACADEMIC_SUPPORT?: number
  }
  active: number
  inactive: number
  admins: number
  total: number
}

interface Statistics {
  revenue: {
    week: number
    month: number
    quarter: number
    year: number
    total: number
  }
  userGrowth: {
    newUsersWeek: number
    newUsersMonth: number
    activeUsersWeek: number
  }
  programs: Array<{
    name: string
    count: number
  }>
  sessions: {
    total: number
    thisMonth: number
    averageDuration: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMasqueradePanel, setShowMasqueradePanel] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [trendData, setTrendData] = useState<{
    revenue: number[]
    users: number[]
    sessions: number[]
    growth: number[]
  }>({ revenue: [], users: [], sessions: [], growth: [] })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !session.user.isAdmin) {
      router.push('/admin/login')
      return
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.isAdmin) {
      fetchStatistics()
      fetchStats()
      // Generate trend data for sparklines
      setTrendData({
        revenue: generateTrendData(7, 4500, 6500),
        users: generateTrendData(7, 80, 120),
        sessions: generateTrendData(7, 140, 180),
        growth: generateTrendData(7, 5, 25)
      })
    }
  }, [status, session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=1')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/statistics')
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
      setMessage({ type: 'error', text: 'Failed to load statistics' })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {session?.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <button
              onClick={() => router.push('/admin/marketing')}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-all flex items-center space-x-3 group"
            >
              <div className="p-3 bg-purple-900/50 rounded-lg group-hover:bg-purple-900/70 transition-colors">
                <Megaphone className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">Marketing Banners</h3>
                <p className="text-sm text-gray-400">Manage promotional content</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/exams')}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-all flex items-center space-x-3 group"
            >
              <div className="p-3 bg-red-900/50 rounded-lg group-hover:bg-red-900/70 transition-colors">
                <FileText className="h-6 w-6 text-red-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">Exam Management</h3>
                <p className="text-sm text-gray-400">Practice tests, homework, quizzes</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/question-bank')}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-all flex items-center space-x-3 group"
            >
              <div className="p-3 bg-orange-900/50 rounded-lg group-hover:bg-orange-900/70 transition-colors">
                <BookOpen className="h-6 w-6 text-orange-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">Question Bank</h3>
                <p className="text-sm text-gray-400">Manage questions & passages</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/users')}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-all flex items-center space-x-3 group"
            >
              <div className="p-3 bg-blue-900/50 rounded-lg group-hover:bg-blue-900/70 transition-colors">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">User Management</h3>
                <p className="text-sm text-gray-400">View and manage all users</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/settings')}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-all flex items-center space-x-3 group"
            >
              <div className="p-3 bg-green-900/50 rounded-lg group-hover:bg-green-900/70 transition-colors">
                <Settings className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">Admin Settings</h3>
                <p className="text-sm text-gray-400">Configure system settings</p>
              </div>
            </button>
            
            <button
              onClick={() => setShowMasqueradePanel(true)}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-all flex items-center space-x-3 group"
            >
              <div className="p-3 bg-indigo-900/50 rounded-lg group-hover:bg-indigo-900/70 transition-colors">
                <UserCheck className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">Masquerade</h3>
                <p className="text-sm text-gray-400">View as student</p>
              </div>
            </button>
          </div>
        </div>

        {/* Revenue Statistics */}
        {statistics && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Revenue Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="This Week"
                value={formatCurrency(statistics.revenue.week)}
                subtitle="Revenue"
                icon={<DollarSign className="h-6 w-6" />}
                color="green"
                trend={12.5}
                trendData={trendData.revenue}
                sparklineType="area"
              />
              <StatsCard
                title="This Month"
                value={formatCurrency(statistics.revenue.month)}
                subtitle="Revenue"
                icon={<TrendingUp className="h-6 w-6" />}
                color="blue"
                trend={18.2}
                trendData={generateTrendData(7, statistics.revenue.week/7, statistics.revenue.week/5)}
                sparklineType="line"
              />
              <StatsCard
                title="Active Users"
                value={statistics.userGrowth.activeUsersWeek}
                subtitle="This week"
                icon={<BarChart3 className="h-6 w-6" />}
                color="purple"
                trend={8.7}
                trendData={trendData.users}
                sparklineType="bar"
              />
              <StatsCard
                title="Total Sessions"
                value={statistics.sessions.thisMonth}
                subtitle="This month"
                icon={<Calendar className="h-6 w-6" />}
                color="yellow"
                trend={-2.3}
                trendData={trendData.sessions}
                sparklineType="area"
              />
            </div>
          </div>
        )}

        {/* Mini Stats Row */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MiniStatsCard
              title="New Users"
              value={statistics.userGrowth.newUsersWeek}
              trend={15}
              trendData={generateTrendData(7, 5, 15)}
              color="green"
            />
            <MiniStatsCard
              title="Total Revenue"
              value={formatCurrency(statistics.revenue.total)}
              trend={23}
              trendData={generateTrendData(7, 100000, 150000)}
              color="blue"
            />
            <MiniStatsCard
              title="Avg Session"
              value={`${Math.round(statistics.sessions.averageDuration)} min`}
              trend={5}
              trendData={generateTrendData(7, 45, 60)}
              color="purple"
            />
            <MiniStatsCard
              title="This Quarter"
              value={formatCurrency(statistics.revenue.quarter)}
              trend={-3}
              trendData={generateTrendData(7, 30000, 45000)}
              color="yellow"
            />
          </div>
        )}

        {/* User & Program Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Users by Role</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Parents</span>
                  <span className="text-white font-medium">{stats.byRole.PARENT || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Students</span>
                  <span className="text-white font-medium">{stats.byRole.STUDENT || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Institutions</span>
                  <span className="text-white font-medium">{stats.byRole.INSTITUTION || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Students by Program</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">SAT</span>
                  <span className="text-white font-medium">{stats.byProgram?.SAT || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">ACT</span>
                  <span className="text-white font-medium">{stats.byProgram?.ACT || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Academic Support</span>
                  <span className="text-white font-medium">{stats.byProgram?.ACADEMIC_SUPPORT || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">User Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Active Users</span>
                  <span className="text-green-400 font-medium">{stats.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Inactive Users</span>
                  <span className="text-red-400 font-medium">{stats.inactive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Admins</span>
                  <span className="text-purple-400 font-medium">{stats.admins}</span>
                </div>
              </div>
            </div>

            {statistics && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Growth Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">New This Week</span>
                    <span className="text-white font-medium">{statistics.userGrowth.newUsersWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">New This Month</span>
                    <span className="text-white font-medium">{statistics.userGrowth.newUsersMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Active This Week</span>
                    <span className="text-white font-medium">{statistics.userGrowth.activeUsersWeek}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* User Management Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">User Management</h2>
          <UserManagementNew statsRefetch={fetchStats} />
        </div>
      </main>

      {/* Masquerade Panel */}
      {showMasqueradePanel && (
        <MasqueradePanel onClose={() => setShowMasqueradePanel(false)} />
      )}
    </div>
  )
}