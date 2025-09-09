'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function TestCreditsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [hours, setHours] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const addHours = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/credits/manual-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hours,
          description: `Test purchase of ${hours} hours`
        }),
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        // Refresh the page after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to add hours:', error)
      setResult({ error: 'Failed to add hours' })
    } finally {
      setLoading(false)
    }
  }

  if (session?.user?.role !== 'PARENT') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900">Access Denied</h1>
            <p className="text-red-700 mt-2">This test page is only available for parent accounts.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-6">Test Credit Addition</h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ This is a TEST page to manually add hours while we debug the Stripe webhook.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours to Add
              </label>
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 hours</option>
                <option value={10}>10 hours</option>
                <option value={20}>20 hours</option>
                <option value={40}>40 hours</option>
              </select>
            </div>

            <button
              onClick={addHours}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : `Add ${hours} Hours (Test)`}
            </button>

            {result && (
              <div className={`mt-4 p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <div>
                    <p className="font-semibold text-green-900">✅ Success!</p>
                    <p className="text-green-700 mt-1">Added {result.transaction.hours} hours</p>
                    <p className="text-green-700">Balance: {result.transaction.balanceBefore}h → {result.newBalance}h</p>
                    <p className="text-sm text-green-600 mt-2">Redirecting to dashboard...</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-red-900">❌ Error</p>
                    <p className="text-red-700 mt-1">{result.error}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}