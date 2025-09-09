'use client'

import { useState, useEffect } from 'react'
import { Calendar, Copy, RefreshCw, Check, Info, Smartphone, Monitor } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface CalendarSubscriptionProps {
  userId: string
  userRole: 'STUDENT' | 'PARENT' | 'TUTOR'
  userName?: string
}

export default function CalendarSubscription({ userId, userRole, userName }: CalendarSubscriptionProps) {
  const { data: session } = useSession()
  const [calendarUrl, setCalendarUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    fetchCalendarToken()
  }, [userId])

  const fetchCalendarToken = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/calendar-token`)
      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          setToken(data.token)
          generateCalendarUrl(data.token)
        }
      }
    } catch (error) {
      console.error('Error fetching calendar token:', error)
    }
  }

  const generateCalendarUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    let url = ''
    
    switch (userRole) {
      case 'STUDENT':
        url = `${baseUrl}/api/calendar/student/${userId}/${token}`
        break
      case 'PARENT':
        url = `${baseUrl}/api/calendar/parent/${userId}/${token}`
        break
      case 'TUTOR':
        url = `${baseUrl}/api/calendar/tutor/${userId}/${token}`
        break
    }
    
    setCalendarUrl(url)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const regenerateToken = async () => {
    setRegenerating(true)
    try {
      const response = await fetch(`/api/users/${userId}/calendar-token`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
        generateCalendarUrl(data.token)
      }
    } catch (error) {
      console.error('Error regenerating token:', error)
    } finally {
      setRegenerating(false)
    }
  }

  const getCalendarTypeLabel = () => {
    switch (userRole) {
      case 'STUDENT':
        return 'Your Tutoring Sessions'
      case 'PARENT':
        return 'All Children\'s Sessions'
      case 'TUTOR':
        return 'Your Teaching Schedule'
      default:
        return 'Calendar'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Calendar Subscription</h3>
            <p className="text-sm text-gray-600">{getCalendarTypeLabel()}</p>
          </div>
        </div>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Info className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {showInstructions && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How to Subscribe:</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 font-medium text-blue-900 mb-1">
                <Monitor className="h-4 w-4" />
                <span>Desktop (Google Calendar, Outlook, Apple Calendar)</span>
              </div>
              <ol className="text-sm text-blue-800 ml-6 space-y-1">
                <li>1. Copy the calendar URL below</li>
                <li>2. Open your calendar app</li>
                <li>3. Look for "Add Calendar" or "Subscribe to Calendar"</li>
                <li>4. Paste the URL when prompted</li>
                <li>5. Your sessions will auto-sync!</li>
              </ol>
            </div>
            
            <div>
              <div className="flex items-center gap-2 font-medium text-blue-900 mb-1">
                <Smartphone className="h-4 w-4" />
                <span>iPhone/iPad</span>
              </div>
              <ol className="text-sm text-blue-800 ml-6 space-y-1">
                <li>1. Copy the URL below</li>
                <li>2. Go to Settings → Calendar → Accounts</li>
                <li>3. Tap "Add Account" → "Other"</li>
                <li>4. Tap "Add Subscribed Calendar"</li>
                <li>5. Paste the URL and save</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-stretch gap-2">
          <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700 break-all">
            {calendarUrl || 'Loading calendar URL...'}
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={!calendarUrl}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            This calendar updates automatically when sessions are scheduled
          </p>
          <button
            onClick={regenerateToken}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            disabled={regenerating}
          >
            <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate Link
          </button>
        </div>
      </div>
    </div>
  )
}