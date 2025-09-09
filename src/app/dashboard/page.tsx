'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import StudentDashboardPage from './student/page'
import ParentDashboard from './parent-page'
import SATDatesWidget from '@/components/SATDatesWidget'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      {/* SAT Dates Widget - Floating, draggable */}
      <SATDatesWidget />
      
      {/* Show appropriate dashboard based on role */}
      {session.user?.role === 'STUDENT' ? (
        <StudentDashboardPage />
      ) : (
        <ParentDashboard />
      )}
    </>
  )
}