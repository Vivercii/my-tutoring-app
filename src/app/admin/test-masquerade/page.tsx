'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestMasquerade() {
  const { data: session } = useSession()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testMasquerade = async () => {
    setLoading(true)
    console.log('Testing masquerade...')
    
    try {
      // First, let's get the list of students
      const studentsRes = await fetch('/api/admin/students')
      const studentsData = await studentsRes.json()
      console.log('Students:', studentsData)
      
      if (studentsData.students && studentsData.students.length > 0) {
        const firstStudent = studentsData.students[0]
        console.log('Will masquerade as:', firstStudent)
        
        // Now try to masquerade as the first student
        const masqueradeRes = await fetch('/api/admin/masquerade/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: firstStudent.id })
        })
        
        const masqueradeData = await masqueradeRes.json()
        console.log('Masquerade response:', masqueradeData)
        setResult(masqueradeData)
        
        if (masqueradeRes.ok) {
          console.log('Masquerade successful! Reloading...')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Test Masquerade</h1>
      
      <div className="mb-4">
        <p>Current session: {session?.user?.email}</p>
        <p>Is Admin: {session?.user?.isAdmin ? 'Yes' : 'No'}</p>
        <p>Currently masquerading: {session?.user?.masquerading ? 'Yes' : 'No'}</p>
      </div>
      
      <button
        onClick={testMasquerade}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Masquerade'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}