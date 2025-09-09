'use client'

import { useState } from 'react'

export default function FixQuestionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const handleFix = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/fix-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error + (errorData.details ? ': ' + errorData.details : ''))
        console.error('Error details:', errorData)
      }
    } catch (err) {
      setError('An error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Fix Reading & Writing Questions</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="mb-4">
            This will separate the passage text from the question text for all Reading & Writing questions.
          </p>
          
          <button
            onClick={handleFix}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Fixing Questions...' : 'Fix Questions'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <h3 className="font-bold mb-2">Success!</h3>
            <p>Total questions processed: {result.totalQuestions}</p>
            <p>Total questions fixed: {result.totalFixed}</p>
            {result.passagesCreated && <p>Passages created: {result.passagesCreated}</p>}
            
            {result.examples && result.examples.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold">Sample fixed questions:</h4>
                {result.examples.map((ex: any, i: number) => (
                  <div key={i} className="mt-2 p-2 bg-white rounded">
                    <p className="text-sm"><strong>Passage:</strong> {ex.passage}</p>
                    <p className="text-sm"><strong>Question:</strong> {ex.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}