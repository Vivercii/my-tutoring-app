export const mockStats = {
  sessionBalance: 12,
  sessionsCompleted: 45,
  averageRating: 4.8,
  totalSpent: 2340
}

export const mockUpcomingSessions = [
  {
    id: 1,
    subject: 'Advanced Mathematics',
    tutor: 'Dr. Sarah Johnson',
    date: 'Today',
    time: '3:00 PM - 4:00 PM',
    status: 'confirmed' as const
  },
  {
    id: 2,
    subject: 'Physics - Mechanics',
    tutor: 'Prof. Michael Chen',
    date: 'Tomorrow',
    time: '2:00 PM - 3:30 PM',
    status: 'confirmed' as const
  },
  {
    id: 3,
    subject: 'Chemistry Lab Review',
    tutor: 'Dr. Emily Williams',
    date: 'Dec 28',
    time: '4:00 PM - 5:00 PM',
    status: 'pending' as const
  }
]

export const mockRecentActivity = [
  {
    id: 1,
    type: 'session_completed' as const,
    description: 'Completed session with Dr. Sarah Johnson',
    time: '2 hours ago'
  },
  {
    id: 2,
    type: 'payment' as const,
    description: 'Payment of $120 processed',
    time: '1 day ago'
  },
  {
    id: 3,
    type: 'message' as const,
    description: 'New message from Prof. Michael Chen',
    time: '2 days ago'
  },
  {
    id: 4,
    type: 'session_booked' as const,
    description: 'Booked session for Chemistry Lab Review',
    time: '3 days ago'
  }
]

export type UpcomingSession = typeof mockUpcomingSessions[0]
export type RecentActivityItem = {
  id: string
  type: string
  description: string
  time: string
}
export type Stats = typeof mockStats