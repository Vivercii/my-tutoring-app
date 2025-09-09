'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CheckMasquerade() {
  const { data: session, status } = useSession()
  const [cookies, setCookies] = useState<string>('')
  const [masqueradeCookie, setMasqueradeCookie] = useState<any>(null)

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie
    setCookies(allCookies)
    
    // Try to find masquerade cookie
    const masqueradeCookieStr = document.cookie
      .split('; ')
      .find(row => row.startsWith('masquerade='))
    
    if (masqueradeCookieStr) {
      try {
        const cookieValue = masqueradeCookieStr.split('=')[1]
        const decoded = decodeURIComponent(cookieValue)
        const parsed = JSON.parse(decoded)
        setMasqueradeCookie(parsed)
      } catch (e) {
        console.error('Error parsing masquerade cookie:', e)
      }
    }
  }, [])

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Check Masquerade State</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p>Status: {status}</p>
          {session && (
            <>
              <p>Email: {session.user?.email}</p>
              <p>Name: {session.user?.name || 'No name'}</p>
              <p>ID: {session.user?.id}</p>
              <p>Role: {session.user?.role}</p>
              <p>Is Admin: {session.user?.isAdmin ? 'Yes' : 'No'}</p>
              <p>Masquerading: {session.user?.masquerading ? 'Yes' : 'No'}</p>
              {session.user?.masquerading && (
                <div className="mt-2 p-2 bg-yellow-900 rounded">
                  <p>Original User: {session.user.masquerading.originalUserEmail}</p>
                  <p>Target User: {session.user.masquerading.targetUserEmail}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Cookies</h2>
          <p className="text-xs break-all">{cookies || 'No cookies found'}</p>
        </div>

        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Masquerade Cookie (if exists)</h2>
          {masqueradeCookie ? (
            <pre className="text-xs">{JSON.stringify(masqueradeCookie, null, 2)}</pre>
          ) : (
            <p>No masquerade cookie found</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
          <button
            onClick={() => window.location.href = '/admin/test-masquerade'}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Test Page
          </button>
        </div>
      </div>
    </div>
  )
}