'use client'

import { useParams } from 'next/navigation'
import { StudentProfileEdit } from '@/components/StudentProfileEdit'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function StudentDetailPage() {
  const params = useParams()
  const studentId = params?.studentId as string
  const { data: session } = useSession()

  // Determine where the back button should go based on user role
  const getBackLink = () => {
    if (session?.user?.isAdmin) {
      return '/admin/dashboard'
    } else if (session?.user?.role === 'PARENT') {
      return '/parent/dashboard'
    } else {
      return '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href={getBackLink()}
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Student Profile</h1>
          <p className="text-gray-400 mt-2">
            View and manage student information and learning goals
          </p>
        </div>

        {/* Profile Edit Component */}
        <StudentProfileEdit studentId={studentId} />
      </div>
    </div>
  )
}