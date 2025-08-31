'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { navigationItems, type NavigationItem } from '@/lib/constants'
import { useSidebar } from './DashboardLayout'

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebar()

  return (
    <div className={`hidden md:fixed md:inset-y-0 md:flex ${collapsed ? 'md:w-20' : 'md:w-64'} md:flex-col transition-all duration-300`}>
      <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          {/* Logo and collapse button */}
          <div className="flex items-center justify-between flex-shrink-0 px-4">
            <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
              <img 
                src="/logo.svg" 
                alt="UpstartPrep Logo" 
                className="h-8 w-auto"
              />
              {!collapsed && (
                <span className="ml-2 text-xl font-semibold text-gray-900">UpstartPrep</span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`${collapsed ? 'mx-auto mt-2' : ''} p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigationItems.map((item: NavigationItem) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                } group flex items-center ${collapsed ? 'justify-center px-2' : 'px-2'} py-2 text-sm font-medium rounded-md transition-all duration-150 relative`}
                title={collapsed ? item.name : ''}
              >
                <span className={`${collapsed ? '' : 'mr-3'} text-lg`}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* User info and logout */}
        <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
          <div className={`flex items-center w-full ${collapsed ? 'justify-center' : ''}`}>
            {!collapsed ? (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                  title="Sign out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-gray-400 hover:text-gray-600"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}