'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Shield, X, AlertTriangle } from 'lucide-react'

export default function MasqueradeIndicator() {
  const { data: session, update } = useSession()
  const [stopping, setStopping] = useState(false)

  if (!session?.user?.masquerading) {
    return null
  }

  const stopMasquerade = async () => {
    setStopping(true)
    try {
      const response = await fetch('/api/admin/masquerade/stop', {
        method: 'POST'
      })

      if (response.ok) {
        // Clear masquerade data from session
        await update({
          masquerading: null
        })
        
        // Force page reload to pick up normal session
        setTimeout(() => {
          window.location.href = '/admin/dashboard'
        }, 500)
      } else {
        alert('Failed to stop masquerade')
      }
    } catch (error) {
      console.error('Error stopping masquerade:', error)
      alert('Failed to stop masquerade')
    } finally {
      setStopping(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-600 to-orange-600 border-b-2 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-100" />
              <AlertTriangle className="h-5 w-5 text-yellow-100" />
            </div>
            <div className="text-yellow-100">
              <span className="font-semibold">MASQUERADING AS:</span>
              <span className="ml-2 font-bold">
                {session.user.email} ({session.user.role})
              </span>
              <span className="ml-4 text-yellow-200 text-sm">
                Original admin: {session.user.masquerading.originalUserEmail}
              </span>
            </div>
          </div>
          <button
            onClick={stopMasquerade}
            disabled={stopping}
            className="flex items-center gap-2 px-3 py-1 bg-yellow-800 hover:bg-yellow-700 text-yellow-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stopping ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-100"></div>
                Stopping...
              </>
            ) : (
              <>
                <X className="h-3 w-3" />
                Stop Masquerading
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}