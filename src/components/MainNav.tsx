'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
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
  GraduationCap
} from 'lucide-react'

export default function MainNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navigation = session?.user?.role === 'PARENT' ? [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Students', href: '/dashboard/students', icon: Users },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
    { name: 'Billing', href: '/dashboard/billing', icon: DollarSign },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-purple-400" />
              <span className="text-xl font-bold text-white">UpstartPrep</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2
                    ${isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span>{session?.user?.name || 'User'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session?.user?.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Role: {session?.user?.role}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => signOut()}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-md border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block px-3 py-2 rounded-lg text-base font-medium transition-all flex items-center space-x-2
                    ${isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t border-white/10">
            <div className="mb-3">
              <p className="text-sm font-medium text-white">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-300">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}