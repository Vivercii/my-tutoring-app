'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Copy, Mail, Check, RefreshCw, Search, Filter } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  calendarToken: string | null
  createdAt: string
}

export default function CalendarLinksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        router.push('/dashboard')
      } else {
        fetchUsers()
      }
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, session])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarUrl = (user: User) => {
    if (!user.calendarToken) return null
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    switch (user.role) {
      case 'STUDENT':
        return `${baseUrl}/api/calendar/student/${user.id}/${user.calendarToken}`
      case 'PARENT':
        return `${baseUrl}/api/calendar/parent/${user.id}/${user.calendarToken}`
      case 'TUTOR':
        return `${baseUrl}/api/calendar/tutor/${user.id}/${user.calendarToken}`
      default:
        return null
    }
  }

  const copyToClipboard = async (user: User) => {
    const url = generateCalendarUrl(user)
    if (url) {
      try {
        await navigator.clipboard.writeText(url)
        setCopiedId(user.id)
        setTimeout(() => setCopiedId(null), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const sendCalendarEmail = async (user: User) => {
    const url = generateCalendarUrl(user)
    if (!url) return
    
    // Create mailto link with pre-filled content
    const subject = encodeURIComponent('Your UpstartPrep Tutoring Calendar Subscription')
    const body = encodeURIComponent(`Hi ${user.name || 'there'},

Here's your personal calendar subscription link for UpstartPrep Tutoring:

${url}

To add this calendar to your device:

For Google Calendar:
1. Open Google Calendar
2. Click the + next to "Other calendars"
3. Select "From URL"
4. Paste the link above
5. Click "Add calendar"

For iPhone/iPad:
1. Go to Settings → Calendar → Accounts
2. Tap "Add Account" → "Other"
3. Tap "Add Subscribed Calendar"
4. Paste the URL and save

For Outlook:
1. Go to Calendar
2. Click "Add calendar" → "From internet"
3. Paste the URL

Your tutoring sessions will automatically appear in your calendar and update when changes are made.

Best regards,
UpstartPrep Tutoring Team`)
    
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`
  }

  const regenerateToken = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/calendar-token`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'ALL' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Calendar Links Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and send calendar subscription links to users
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="PARENT">Parents</option>
                <option value="TUTOR">Tutors</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calendar Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'STUDENT' ? 'bg-green-100 text-green-800' :
                      user.role === 'PARENT' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'TUTOR' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.calendarToken ? (
                      <span className="flex items-center text-sm text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Token exists
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">No token</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.calendarToken && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(user)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Copy calendar link"
                        >
                          {copiedId === user.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => sendCalendarEmail(user)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Send email with calendar link"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => regenerateToken(user.id)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Regenerate token"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {!user.calendarToken && (
                      <button
                        onClick={() => regenerateToken(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Generate Token
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">No users found</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Users:</span>
              <span className="ml-2 font-semibold text-blue-900">{users.length}</span>
            </div>
            <div>
              <span className="text-blue-700">With Calendar:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {users.filter(u => u.calendarToken).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Without Calendar:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {users.filter(u => !u.calendarToken).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}