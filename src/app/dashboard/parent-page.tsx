'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ParentStudentsSection from '@/components/ParentStudentsSection'
import { HourBalanceCard } from '@/components/HourBalanceCard'
import { PremiumUpgradeCard } from '@/components/PremiumUpgradeCard'
import SeasonalDecoration from '@/components/SeasonalDecoration'
import CalendarSubscription from '@/components/CalendarSubscription'
import WelcomeModal from '@/components/WelcomeModal'
import OnboardingFlow from '@/components/OnboardingFlow'
import {
  Clock,
  Calendar,
  TrendingUp,
  Users,
  CreditCard,
  Settings,
  ChevronRight,
  BookOpen,
  Award,
  Activity,
  UserPlus,
  BarChart3,
  Package,
  TrendingDown,
  RefreshCw,
  Sparkles
} from 'lucide-react'

function getGreeting(name: string) {
  const hour = new Date().getHours()
  const firstName = name?.split(' ')[0] || 'there'
  
  if (hour < 12) return `Good morning, ${firstName}`
  if (hour < 17) return `Good afternoon, ${firstName}`
  return `Good evening, ${firstName}`
}

export default function ParentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [sessionBalance, setSessionBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [creditStats, setCreditStats] = useState({
    totalPurchased: 0,
    totalUsed: 0,
  })
  const [students, setStudents] = useState<any[]>([])
  const [monthlySessionCount, setMonthlySessionCount] = useState(0)
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [showWelcome, setShowWelcome] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true) // Default to true to avoid flash

  useEffect(() => {
    if (session) {
      fetchSessionBalance()
      fetchTransactionHistory()
      checkOnboardingStatus()
      fetchStudents()
      fetchMonthlyStats()
      fetchUpcomingSessions()
      fetchRecentActivity()
    }
  }, [session])
  
  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/users/onboarding-status')
      if (response.ok) {
        const data = await response.json()
        setHasSeenWelcome(data.hasSeenWelcome)
        setOnboardingStep(data.onboardingStep)
        
        // Show welcome modal if they haven't seen it
        if (!data.hasSeenWelcome) {
          setShowWelcome(true)
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
    }
  }
  
  const handleWelcomeComplete = async () => {
    setShowWelcome(false)
    // Update the database to mark welcome as seen
    try {
      await fetch('/api/users/onboarding-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenWelcome: true })
      })
    } catch (error) {
      console.error('Failed to update welcome status:', error)
    }
  }
  
  const handleStartOnboarding = () => {
    setShowWelcome(false)
    setShowOnboarding(true)
    handleWelcomeComplete() // Mark welcome as seen
  }
  
  const handleOnboardingStepComplete = async (step: number) => {
    setOnboardingStep(step + 1)
    try {
      await fetch('/api/users/onboarding-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingStep: step + 1 })
      })
    } catch (error) {
      console.error('Failed to update onboarding step:', error)
    }
  }
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setActiveTab('students') // Show students tab after onboarding
  }

  const fetchSessionBalance = async () => {
    try {
      const response = await fetch('/api/credits', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Credits API response:', data) // Debug log
        setSessionBalance(data.hours || 0)
        // Also update credit stats from this endpoint
        setCreditStats({
          totalPurchased: data.totalPurchased || 0,
          totalUsed: data.totalUsed || 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch session balance:', error)
    }
  }

  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch('/api/credits/transactions', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Transaction API response:', data) // Debug log
        setTransactions(data.transactions || [])
        setPayments(data.payments || [])
        setCreditStats({
          totalPurchased: data.totalPurchased || 0,
          totalUsed: data.totalUsed || 0,
        })
        setSessionBalance(data.currentBalance || 0)
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchMonthlyStats = async () => {
    try {
      // Get current month's start and end dates
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const response = await fetch(`/api/schedule?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`)
      if (response.ok) {
        const sessions = await response.json()
        setMonthlySessionCount(sessions.length)
      }
    } catch (error) {
      console.error('Failed to fetch monthly stats:', error)
    }
  }

  const fetchUpcomingSessions = async () => {
    try {
      const now = new Date()
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      
      const response = await fetch(`/api/schedule?startDate=${now.toISOString()}&endDate=${endDate.toISOString()}`)
      if (response.ok) {
        const sessions = await response.json()
        setUpcomingSessions(sessions.slice(0, 3)) // Show only next 3 sessions
      }
    } catch (error) {
      console.error('Failed to fetch upcoming sessions:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/activities?limit=4')
      if (response.ok) {
        const activities = await response.json()
        setRecentActivity(activities)
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!session) return null

  const quickStats = [
    {
      label: 'Session Balance',
      value: `${sessionBalance || 0}h`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => router.push('/dashboard/billing')
    },
    {
      label: 'Active Students',
      value: (students?.length || 0).toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => setActiveTab('students')
    },
    {
      label: 'This Month',
      value: `${monthlySessionCount || 0} ${monthlySessionCount === 1 ? 'session' : 'sessions'}`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => router.push('/dashboard/schedule')
    },
    {
      label: 'Average Score',
      value: 'No scores yet',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => setActiveTab('progress')
    }
  ]

  // Attention needed items
  const attentionItems = [
    sessionBalance < 5 && { text: `Low hour balance (${sessionBalance || 0}h remaining)`, type: 'warning' },
    (!students || students.length === 0) && { text: 'No students added yet', type: 'info' },
    (!monthlySessionCount || monthlySessionCount === 0) && { text: 'No sessions scheduled this month', type: 'info' },
  ].filter((item): item is { text: string; type: string } => Boolean(item))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Black to match navigation */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-light flex items-center">
                  {getGreeting(session.user?.name || '')}
                  <SeasonalDecoration inline={true} size={40} />
                </h1>
                <p className="text-gray-300 mt-2">Manage your children's learning journey</p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard/schedule')}
                  className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-light transition-colors"
                >
                  Schedule Session
                </button>
                <button
                  onClick={() => router.push('/dashboard/billing')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-light transition-colors border border-gray-700"
                >
                  Buy Hours
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Bar - Inside black section but with cards */}
        <div className="bg-gray-50 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-4 gap-4">
              {quickStats.map((stat, index) => (
                <button
                  key={index}
                  onClick={stat.action}
                  className={`${stat.bgColor} p-4 rounded-xl hover:shadow-lg transition-all group cursor-pointer border border-gray-200`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="mb-6 flex gap-1 bg-white p-1 rounded-lg shadow-sm">
            {['overview', 'students', 'hours', 'progress', 'premium'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Attention Needed Banner */}
              {attentionItems && attentionItems.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Attention Needed</h3>
                  <ul className="space-y-1">
                    {attentionItems.map((item, index) => (
                      <li key={index} className="text-sm text-yellow-800">• {item.text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Activity & Upcoming Sessions */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-800" />
                    Recent Activity
                  </h3>
                  {recentActivity && recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="flex items-start space-x-3 py-2 border-b last:border-0">
                          <div className="w-2 h-2 bg-gray-800 rounded-full mt-1.5 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.description}</p>
                            <p className="text-xs text-gray-600">{activity.type}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No recent activity</p>
                      <p className="text-xs mt-1">Activities will appear here once you start using the platform</p>
                    </div>
                  )}
                </div>

                {/* Upcoming Sessions */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-800" />
                    Upcoming Sessions
                  </h3>
                  {upcomingSessions && upcomingSessions.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {upcomingSessions.map((session, index) => (
                          <div key={session.id || index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{session.notes || 'Tutoring Session'}</p>
                                <p className="text-sm text-gray-700">
                                  {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{session.tutorName || 'TBD'}</p>
                                <p className="text-xs text-gray-600">
                                  {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60))} hours
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => router.push('/dashboard/schedule')}
                        className="w-full mt-4 text-center text-sm text-gray-700 hover:text-gray-900 font-light"
                      >
                        View Full Schedule →
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No upcoming sessions</p>
                      <p className="text-xs mt-1">Book a session to get started</p>
                      <button 
                        onClick={() => router.push('/dashboard/schedule')}
                        className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-light"
                      >
                        Schedule a Session
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Subscription */}
              <div className="mt-6">
                {session?.user?.id && (
                  <CalendarSubscription 
                    userId={session.user.id}
                    userRole="PARENT"
                    userName={session.user.name || 'Parent'}
                  />
                )}
              </div>

              {/* Performance Trends & Insights */}
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gray-800" />
                    Performance Trends
                  </h3>
                  {students && students.length > 0 ? (
                    <div className="space-y-4">
                      {students.map((student) => (
                        <div key={student.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{student.name}</span>
                            <span className="text-sm text-gray-600">No data yet</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-300 h-2 rounded-full" style={{width: '0%'}}></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-600">Current: N/A</span>
                            <span className="text-xs text-gray-600">Target: Not set</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No performance data yet</p>
                      <p className="text-xs mt-1">Add students and complete sessions to track progress</p>
                    </div>
                  )}
                </div>

                {/* Key Insights */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-800" />
                    Key Insights
                  </h3>
                  {students && students.length > 0 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Getting Started</p>
                        <p className="text-xs text-gray-600 mt-1">Complete sessions to see insights</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No insights available</p>
                      <p className="text-xs mt-1">Insights will appear after sessions are completed</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border border-blue-200">
                  <Calendar className="h-8 w-8 text-gray-600 mb-3" />
                  <h3 className="font-semibold mb-2">Schedule Session</h3>
                  <p className="text-sm text-gray-700 mb-4">Book tutoring sessions for your children</p>
                  <button 
                    onClick={() => router.push('/dashboard/schedule')}
                    className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-light"
                  >
                    Schedule Now
                  </button>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6 border border-green-200">
                  <Users className="h-8 w-8 text-gray-600 mb-3" />
                  <h3 className="font-semibold mb-2">View Students</h3>
                  <p className="text-sm text-gray-700 mb-4">Manage your children's profiles and progress</p>
                  <button 
                    onClick={() => setActiveTab('students')}
                    className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-light"
                  >
                    View Students
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-6 border border-purple-200">
                  <Package className="h-8 w-8 text-gray-600 mb-3" />
                  <h3 className="font-semibold mb-2">Buy Hours</h3>
                  <p className="text-sm text-gray-700 mb-4">Purchase tutoring hours for sessions</p>
                  <button 
                    onClick={() => router.push('/dashboard/billing')}
                    className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-light"
                  >
                    Buy Hours
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <ParentStudentsSection />
          )}

          {activeTab === 'hours' && (
            <div className="space-y-6">
              <HourBalanceCard />
              {/* Transaction history and other hour-related content */}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-2xl font-semibold mb-2">Progress Tracking Coming Soon</h2>
              <p className="text-gray-600">Detailed analytics and progress reports will be available here</p>
            </div>
          )}

          {activeTab === 'premium' && (
            <PremiumUpgradeCard />
          )}
        </div>
      </div>
      
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          userName={session.user?.name || undefined}
          onComplete={handleWelcomeComplete}
          onStartOnboarding={handleStartOnboarding}
        />
      )}
      
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          userId={session.user?.id || ''}
          currentStep={onboardingStep}
          onStepComplete={handleOnboardingStepComplete}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  )
}