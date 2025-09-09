'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAssessmentsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new exam management system
    router.replace('/admin/exams')
  }, [router])
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-white">Redirecting to new exam management system...</p>
      </div>
    </div>
  )
}