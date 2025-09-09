'use client'

import { signOut } from 'next-auth/react'
import { AlertTriangle, LogOut, Mail } from 'lucide-react'

export default function AccountDisabledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Account Disabled</h1>
          
          <p className="text-gray-300 mb-8">
            Your account has been temporarily disabled. This may be due to a violation of our terms of service or for security reasons.
          </p>

          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">To restore your account, please contact support:</p>
            <a 
              href="mailto:support@upstartprep.com" 
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              support@upstartprep.com
            </a>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}