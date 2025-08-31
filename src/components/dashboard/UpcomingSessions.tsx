import Link from 'next/link'
import { type UpcomingSession } from '@/data/mock'

interface UpcomingSessionsProps {
  sessions: UpcomingSession[]
}

export default function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
      </div>
      {sessions.length > 0 ? (
        <>
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <SessionItem key={session.id} session={session} />
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 text-center">
            <Link href="/sessions" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all sessions →
            </Link>
          </div>
        </>
      ) : (
        <div className="px-6 py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming sessions</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by booking your first tutoring session.</p>
          <div className="mt-6">
            <Link
              href="/tutors"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Find Tutors
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionItem({ session }: { session: UpcomingSession }) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">{session.subject}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              session.status === 'confirmed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {session.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">with {session.tutor}</p>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {session.date}
            <svg className="ml-3 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {session.time}
          </div>
        </div>
        <div className="ml-4 flex items-center space-x-2">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Join
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}