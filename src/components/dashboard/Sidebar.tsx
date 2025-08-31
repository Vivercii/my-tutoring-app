'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { navigationItems, bottomNavigationItems, type NavigationItem } from '@/lib/constants'
import { useSidebar } from './DashboardLayout'
import Icon from './Icon'

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <div className={`hidden md:fixed md:inset-y-0 md:flex ${collapsed ? 'md:w-20' : 'md:w-64'} md:flex-col transition-all duration-300 ease-in-out`}>
      <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Logo and Brand */}
          <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
            <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">U</span>
                </div>
                {!collapsed && (
                  <span className="ml-3 text-white font-semibold text-lg">UpstartPrep</span>
                )}
              </div>
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Icon name="chevronLeft" className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* User Profile Section */}
          <div className={`px-4 py-4 border-b border-gray-800 ${collapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {userEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Main Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigationItems.map((item: NavigationItem) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-gray-800 text-white shadow-lg shadow-gray-900/50'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.name : ''}
              >
                <Icon 
                  name={item.icon} 
                  className={`${collapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 ${
                    isActive(item.href) ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-600 text-white">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-medium rounded-full bg-red-600 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="px-3 py-4 space-y-1 border-t border-gray-800">
            {bottomNavigationItems.map((item: NavigationItem) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.name : ''}
              >
                <Icon 
                  name={item.icon} 
                  className={`${collapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 ${
                    isActive(item.href) ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
              </Link>
            ))}
            
            {/* Logout Button */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-800 hover:text-white"
              title={collapsed ? 'Sign out' : ''}
            >
              <Icon 
                name="logout" 
                className={`${collapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-300`}
              />
              {!collapsed && (
                <span className="flex-1 text-left">Sign out</span>
              )}
            </button>
          </div>
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Icon name="chevronRight" className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}