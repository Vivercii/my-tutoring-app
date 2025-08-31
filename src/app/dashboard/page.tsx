'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Mock data for demonstration
  const stats = {
    sessionBalance: 12,
    sessionsCompleted: 45,
    averageRating: 4.8,
    totalSpent: 2340
  }

  const upcomingSessions = [
    {
      id: 1,
      subject: 'Advanced Mathematics',
      tutor: 'Dr. Sarah Johnson',
      date: 'Today',
      time: '3:00 PM - 4:00 PM',
      status: 'confirmed'
    },
    {
      id: 2,
      subject: 'Physics - Mechanics',
      tutor: 'Prof. Michael Chen',
      date: 'Tomorrow',
      time: '2:00 PM - 3:30 PM',
      status: 'confirmed'
    },
    {
      id: 3,
      subject: 'Chemistry Lab Review',
      tutor: 'Dr. Emily Williams',
      date: 'Dec 28',
      time: '4:00 PM - 5:00 PM',
      status: 'pending'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'session_completed',
      description: 'Completed session with Dr. Sarah Johnson',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'payment',
      description: 'Payment of $120 processed',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'message',
      description: 'New message from Prof. Michael Chen',
      time: '2 days ago'
    },
    {
      id: 4,
      type: 'session_booked',
      description: 'Booked session for Chemistry Lab Review',
      time: '3 days ago'
    }
  ]

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', current: true },
    { name: 'My Sessions', href: '/sessions', icon: '📚', current: false },
    { name: 'Find Tutors', href: '/tutors', icon: '🔍', current: false },
    { name: 'Messages', href: '/messages', icon: '💬', current: false, badge: 3 },
    { name: 'Profile', href: '/profile', icon: '👤', current: false },
    { name: 'Settings', href: '/settings', icon: '⚙️', current: false }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <img 
                src="/logo.svg" 
                alt="UpstartPrep Logo" 
                className="h-8 w-auto mr-2"
              />
              <span className="text-xl font-semibold text-gray-900">UpstartPrep</span>
            </div>
            
            {/* Navigation */}
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-150`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User info and logout */}
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{session.user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed inset-0 z-40 ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)}></div>
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-4">
                <img 
                  src="/logo.svg" 
                  alt="UpstartPrep Logo" 
                  className="h-8 w-auto mr-2"
                />
                <span className="text-xl font-semibold text-gray-900">UpstartPrep</span>
              </div>
              
              {/* Navigation */}
              <nav className="mt-8 flex-1 space-y-1 px-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* User info and logout */}
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{session.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-30 flex h-16 bg-white shadow-sm">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xl font-semibold text-gray-900">UpstartPrep</span>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Welcome Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {session.user?.name?.split(' ')[0] || 'there'}! 👋
                </h1>
                <p className="mt-2 text-gray-600">
                  Here's what's happening with your learning journey today.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="rounded-md bg-blue-50 p-3">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Session Balance</dt>
                          <dd className="text-2xl font-semibold text-gray-900">{stats.sessionBalance}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="rounded-md bg-green-50 p-3">
                          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Sessions Completed</dt>
                          <dd className="text-2xl font-semibold text-gray-900">{stats.sessionsCompleted}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="rounded-md bg-yellow-50 p-3">
                          <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Average Rating</dt>
                          <dd className="text-2xl font-semibold text-gray-900">{stats.averageRating}/5</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="rounded-md bg-purple-50 p-3">
                          <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
                          <dd className="text-2xl font-semibold text-gray-900">${stats.totalSpent}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Upcoming Sessions */}
                <div className="lg:col-span-2">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900">{session.subject}</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  session.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {session.status}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">with {session.tutor}</p>
                              <div className="mt-2 flex items-center text-xs text-gray-500">
                                <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {session.date}
                                <svg className="ml-3 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {session.time}
                              </div>
                            </div>
                            <div className="ml-4 flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Join
                              </button>
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-3 bg-gray-50 text-center">
                      <Link href="/sessions" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View all sessions →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-1">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                    </div>
                    <div className="px-6 py-4">
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {recentActivity.map((activity, activityIdx) => (
                            <li key={activity.id}>
                              <div className="relative pb-8">
                                {activityIdx !== recentActivity.length - 1 ? (
                                  <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                      activity.type === 'session_completed' ? 'bg-green-500' :
                                      activity.type === 'payment' ? 'bg-blue-500' :
                                      activity.type === 'message' ? 'bg-purple-500' :
                                      'bg-gray-500'
                                    }`}>
                                      {activity.type === 'session_completed' && (
                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                      {activity.type === 'payment' && (
                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      )}
                                      {activity.type === 'message' && (
                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                      )}
                                      {activity.type === 'session_booked' && (
                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      )}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-600">{activity.description}</p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                                      {activity.time}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}