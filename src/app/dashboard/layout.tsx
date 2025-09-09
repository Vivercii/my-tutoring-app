'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import MessagingSidebar from '@/components/MessagingSidebar'
import ExpandingSearch from '@/components/ExpandingSearch'
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  Bell,
  Search,
  MessageSquare,
  CreditCard
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [messagingModalOpen, setMessagingModalOpen] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchExpanded(true)
      }
    }

    // Listen for custom event to open messaging
    const handleOpenMessaging = () => {
      setMessagingModalOpen(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('openMessaging', handleOpenMessaging)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('openMessaging', handleOpenMessaging)
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setUserMenuOpen(false)
      }
      if (notificationMenuOpen && !(event.target as Element).closest('.notification-menu-container')) {
        setNotificationMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen, notificationMenuOpen])

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

  // Define navigation based on user role
  const navigation = session?.user?.role === 'PARENT' ? [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Students', href: '/dashboard/students', icon: Users },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
    { name: 'Billing', href: '/dashboard/billing', icon: DollarSign },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ] : session?.user?.role === 'TUTOR' ? [
    { name: 'Dashboard', href: '/dashboard/tutor', icon: Home },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
    { name: 'Students', href: '/dashboard/students', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/tutor') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Check if we're on the exam taking page
  const isExamTakingPage = pathname.includes('/exams/') && pathname.includes('/take')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation - Hide on exam taking page */}
      {!isExamTakingPage && (
        <header className="bg-black text-white sticky top-0 z-40">
        <div className="px-6 flex items-center justify-between" style={{ height: '80px' }}>
          {/* Logo and Exam Info */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center">
              <img 
                src="https://res.cloudinary.com/dsoo2uoow/image/upload/c_crop,w_900,h_200,y_0/v1757102414/Upstart_Prep_Logo_uqiba4.svg"
                alt="Upstart Prep"
                style={{ width: '200px', height: 'auto', marginTop: '8px' }}
              />
            </Link>
            {/* Exam Name for Students */}
            {session?.user?.role === 'STUDENT' && (
              <div className="flex items-center border-l border-gray-600 pl-4">
                <span className="text-base font-semibold text-white pulse-text">SAT</span>
              </div>
            )}
          </div>
          
          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    text-base font-semibold transition-colors flex items-center space-x-1
                    ${isActive(item.href)
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            <ExpandingSearch
              isOpen={searchExpanded}
              onOpen={() => setSearchExpanded(true)}
              onClose={() => setSearchExpanded(false)}
            />
            <button 
              onClick={() => setMessagingModalOpen(true)}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors relative"
            >
              <MessageSquare className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
              {/* Unread indicator */}
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
            </button>
            
            {/* Notification Menu */}
            <div className="relative notification-menu-container">
              <button 
                onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                className="relative p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <Bell className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notification Dropdown */}
              {notificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  
                  {/* Notification Items */}
                  <div className="divide-y divide-gray-100">
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">New session scheduled</p>
                          <p className="text-xs text-gray-500 mt-1">Math tutoring with John Smith tomorrow at 3:00 PM</p>
                          <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Practice test completed</p>
                          <p className="text-xs text-gray-500 mt-1">SAT Practice Test 1 - Score: 1420/1600</p>
                          <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Reminder: SAT Registration</p>
                          <p className="text-xs text-gray-500 mt-1">Registration deadline for March SAT is in 3 days</p>
                          <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* View All Link */}
                  <div className="px-4 py-2 border-t border-gray-100 mt-2">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <div className="relative user-menu-container">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center hover:ring-2 hover:ring-white/50 transition-all"
              >
                <span className="text-xs font-bold">
                  {session.user?.name?.charAt(0) || 'U'}
                </span>
              </button>
              
              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">Role: {session.user?.role?.toLowerCase()}</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/settings')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="inline h-4 w-4 mr-2" />
                    Settings
                  </button>
                  {session.user?.role === 'PARENT' && (
                    <button
                      onClick={() => router.push('/dashboard/billing')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <CreditCard className="inline h-4 w-4 mr-2" />
                      Billing
                    </button>
                  )}
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive(item.href)
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
        </header>
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Messaging Sidebar */}
      <MessagingSidebar 
        isOpen={messagingModalOpen} 
        onClose={() => setMessagingModalOpen(false)} 
      />
    </div>
  )
}