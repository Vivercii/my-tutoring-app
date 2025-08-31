'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Components
import Sidebar from '@/components/dashboard/Sidebar'
import MobileSidebar from '@/components/dashboard/MobileSidebar'
import Header from '@/components/dashboard/Header'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import StatsGrid from '@/components/dashboard/StatsGrid'
import UpcomingSessions from '@/components/dashboard/UpcomingSessions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import { DashboardLayoutProvider, useSidebar } from '@/components/dashboard/DashboardLayout'

// Types
interface DashboardData {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
  stats: {
    sessionBalance: number
    sessionsCompleted: number
    averageRating: number
    totalSpent: number
  }
  upcomingSessions: any[]
  recentActivities: {
    id: string
    type: string
    description: string
    time: string
  }[]
  students: any[]
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { collapsed } = useSidebar()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !dashboardData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar 
        userName={dashboardData.user.name} 
        userEmail={dashboardData.user.email}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={dashboardData.user.name}
        userEmail={dashboardData.user.email}
      />

      {/* Main Content Area */}
      <div className={`${collapsed ? 'md:pl-20' : 'md:pl-64'} flex flex-col flex-1 transition-all duration-300`}>
        {/* Mobile Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Welcome Banner */}
              <WelcomeBanner userName={dashboardData.user.name} />

              {/* Stats Grid */}
              <StatsGrid stats={dashboardData.stats} />

              {/* Content Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Upcoming Sessions - Takes 2 columns on large screens */}
                <div className="lg:col-span-2">
                  <UpcomingSessions sessions={dashboardData.upcomingSessions} />
                </div>

                {/* Recent Activity - Takes 1 column on large screens */}
                <div className="lg:col-span-1">
                  <RecentActivity activities={dashboardData.recentActivities} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardLayoutProvider>
      <DashboardContent />
    </DashboardLayoutProvider>
  )
}