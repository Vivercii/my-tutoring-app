'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { navigationItems, bottomNavigationItems, type NavigationItem } from '@/lib/constants'
import Icon from './Icon'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string | null
  userEmail?: string | null
}

export default function MobileSidebar({ isOpen, onClose, userName, userEmail }: MobileSidebarProps) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href

  return (
    <div className={`md:hidden fixed inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div 
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-900 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Logo and Close Button */}
            <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">U</span>
                </div>
                <span className="ml-3 text-white font-semibold text-lg">UpstartPrep</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Profile Section */}
            <div className="px-4 py-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigationItems.map((item: NavigationItem) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gray-800 text-white shadow-lg shadow-gray-900/50'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    name={item.icon} 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive(item.href) ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-600 text-white">
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
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    name={item.icon} 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive(item.href) ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                </Link>
              ))}
              
              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Icon 
                  name="logout" 
                  className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                />
                <span className="flex-1 text-left">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}