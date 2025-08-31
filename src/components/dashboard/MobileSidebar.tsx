'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { navigationItems, type NavigationItem } from '@/lib/constants'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string | null
  userEmail?: string | null
}

export default function MobileSidebar({ isOpen, onClose, userName, userEmail }: MobileSidebarProps) {
  return (
    <div className={`md:hidden fixed inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div 
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              {navigationItems.map((item: NavigationItem) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
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
                <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
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
  )
}