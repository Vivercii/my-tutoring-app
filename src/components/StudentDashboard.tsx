'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SeasonalDecoration from './SeasonalDecoration'
import {
  Copy,
  Check,
  BookOpen,
  Clock,
  Calendar,
  Trophy,
  Users,
  Sparkles,
  GraduationCap,
  FileText,
  Settings,
  TrendingUp,
  Award,
  Target,
  ChevronRight,
  Activity,
  BarChart3,
  CheckCircle2,
  X,
  Trash2,
  MessageSquare,
  PlayCircle,
  CalendarDays,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  Video
} from 'lucide-react'
import {
  Line,
  Bar,
  Doughnut,
} from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface StudentDashboardProps {
  user: {
    name?: string | null
    email?: string | null
    inviteKey?: string | null
  }
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [timeRange, setTimeRange] = useState('This Week')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // Hardcode the invite key for Test Student as a quick fix for production
  const [userInviteKey, setUserInviteKey] = useState(
    user.inviteKey || 
    (user.email === 'student@test.com' ? 'UTPNHF' : 
     user.email === 'kharismaticc@gmail.com' ? 'UP-VUOJEB' : null)
  )
  
  // Get next session from fetched sessions
  const nextSession = sessions.length > 0 ? {
    subject: sessions[0].tutor?.tutorProfile?.subjects?.[0] || 'Tutoring',
    date: new Date(sessions[0].startTime),
    zoomLink: sessions[0].zoomLink || 'https://zoom.us/j/1234567890',
    id: sessions[0].id
  } : null
  
  // Fetch sessions and user data on mount
  useEffect(() => {
    fetchSessions()
    // If inviteKey is missing, fetch user data
    if (!userInviteKey && user.email) {
      fetchUserData()
    }
  }, [])
  
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const sessionData = await response.json()
        if (sessionData.user?.inviteKey) {
          setUserInviteKey(sessionData.user.inviteKey)
        } else {
          // If still no inviteKey in session, fetch from database
          const userResponse = await fetch('/api/users/me')
          if (userResponse.ok) {
            const userData = await userResponse.json()
            setUserInviteKey(userData.inviteKey)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }
  
  // Update current time every second for accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions/book')
      if (response.ok) {
        const data = await response.json()
        // Filter for upcoming sessions and sort by start time
        const upcomingSessions = (data || []).filter((s: any) => 
          new Date(s.startTime) > new Date()
        ).sort((a: any, b: any) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
        setSessions(upcomingSessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate if Zoom button should be shown (30 minutes before session)
  const minutesUntilSession = nextSession ? Math.floor((nextSession.date.getTime() - currentTime.getTime()) / 60000) : Infinity
  const showZoomButton = nextSession && minutesUntilSession <= 30 && minutesUntilSession >= -60 // Show from 30 min before to 60 min after start
  
  // Track Zoom button click
  const handleZoomClick = async () => {
    if (!nextSession) return
    
    const clickData = {
      sessionSubject: nextSession.subject,
      sessionTime: nextSession.date.toISOString(),
      minutesBeforeSession: minutesUntilSession,
      zoomLink: nextSession.zoomLink,
      sessionId: nextSession.id
    }
    
    // Log to console for debugging
    console.log('🎥 Zoom button clicked:', {
      ...clickData,
      clickedAt: new Date().toISOString(),
      user: user.email
    })
    
    // Send to API to store in database
    try {
      const response = await fetch('/api/sessions/zoom-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clickData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Zoom click tracked successfully:', result)
      } else {
        console.error('Failed to track Zoom click:', await response.text())
      }
    } catch (error) {
      console.error('Error tracking Zoom click:', error)
      // Don't block the user from joining even if tracking fails
    }
    
    // Open Zoom link regardless of tracking success
    window.open(nextSession.zoomLink, '_blank')
  }
  
  // Format session time display
  const formatSessionTime = () => {
    if (!nextSession) return 'No upcoming sessions'
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = nextSession.date.toDateString() === tomorrow.toDateString()
    const isToday = nextSession.date.toDateString() === new Date().toDateString()
    
    if (isToday) {
      return `Today ${nextSession.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    } else if (isTomorrow) {
      return `Tomorrow ${nextSession.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    } else {
      return nextSession.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    }
  }
  
  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    const name = user.name?.split(' ')[0] || 'Student'
    
    if (hour < 5) {
      return `Good night, ${name}!`
    } else if (hour < 12) {
      return `Good morning, ${name}!`
    } else if (hour < 17) {
      return `Good afternoon, ${name}!`
    } else if (hour < 21) {
      return `Good evening, ${name}!`
    } else {
      return `Good night, ${name}!`
    }
  }
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'feedback',
      icon: '👤',
      message: 'Teacher Mr Lopez left a feedback on a "Reflective essay on self"',
      time: '10:00 19/07/2023',
      action: 'Read it'
    },
    {
      id: 2,
      type: 'feedback',
      icon: '👤',
      message: 'Teacher Ms Lynn left a feedback on a "Behavioural report"',
      time: '16:00 18/07/2023',
      action: 'Read it'
    },
    {
      id: 3,
      type: 'assignment',
      icon: '📝',
      message: 'New assignment posted: SAT Practice Test 2',
      time: '09:00 18/07/2023',
      action: 'View'
    }
  ])

  const handleCopyInviteKey = () => {
    if (userInviteKey) {
      navigator.clipboard.writeText(userInviteKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const deleteActivity = (id: number) => {
    setActivities(activities.filter(activity => activity.id !== id))
  }

  const clearAllActivities = () => {
    setActivities([])
  }

  // Chart data
  const taskProgressData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      label: 'Complete',
      data: [65, 80, 70, 85, 90, 75, 88],
      backgroundColor: '#60a5fa',
      borderRadius: 6,
      barThickness: 24
    }]
  }

  const gradeData = {
    datasets: [{
      data: [76, 24],
      backgroundColor: ['#a78bfa', '#e2e8f0'],
      borderWidth: 0,
      cutout: '75%'
    }]
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        bodyColor: '#fff',
        titleColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        displayColors: false,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        beginAtZero: true,
        max: 100
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    elements: {
      arc: { borderWidth: 0 }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Dark Hero Section - Covers ~40% of viewport */}
      <div className="bg-black pb-12" style={{ minHeight: '40vh' }}>
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="pt-8 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-5xl font-normal text-white mb-2">
                  {getTimeBasedGreeting()}
                </h1>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-400 text-base mb-6">Let's jump into your learning experience</p>
                    
                    {/* Prominent SAT Countdown and Session Info */}
                    <div className="space-y-4">
                      {/* SAT Countdown - Moderately Prominent */}
                      <div className="flex items-center space-x-3">
                        <CalendarDays className="h-6 w-6 text-orange-400" />
                        <div>
                          <span className="text-2xl font-bold text-white">SAT in 47 days</span>
                        </div>
                      </div>
                      
                      {/* Next Session with Zoom Button - Also Prominent */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-blue-400" />
                          <span className="text-lg text-white font-medium">
                            {nextSession ? `Next: ${nextSession.subject} @ ${formatSessionTime()}` : 'No upcoming sessions'}
                          </span>
                        </div>
                        {/* Zoom Join Button - Moderately Prominent */}
                        {showZoomButton ? (
                          <button 
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all text-base font-semibold animate-pulse shadow-md"
                            onClick={handleZoomClick}
                            title={`Join session (${minutesUntilSession > 0 ? `in ${minutesUntilSession} minutes` : 'now'})`}
                          >
                            <Video className="h-4 w-4" />
                            <span>Join Zoom</span>
                          </button>
                        ) : nextSession && minutesUntilSession > 30 ? (
                          <span className="text-sm text-gray-400">
                            Available in {minutesUntilSession - 30} min
                          </span>
                        ) : null}
                      </div>
                      
                      {/* Second Row */}
                      <div className="flex items-center space-x-6">
                        {/* Practice Score Trend */}
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-white">Latest: 1420</span>
                          <span className="text-xs text-green-400 flex items-center">
                            <ArrowUp className="h-3 w-3" />
                            +30
                          </span>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => router.push('/dashboard/exams')}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all group"
                            title="Start Practice Test"
                          >
                            <PlayCircle className="h-4 w-4 text-white group-hover:text-blue-400 transition-colors" />
                          </button>
                          <button 
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all group"
                            title="View Schedule"
                          >
                            <Calendar className="h-4 w-4 text-white group-hover:text-purple-400 transition-colors" />
                          </button>
                          <button 
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all group"
                            title="Message Tutor"
                          >
                            <MessageSquare className="h-4 w-4 text-white group-hover:text-green-400 transition-colors" />
                          </button>
                          <button 
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all group"
                            title="View Progress"
                          >
                            <BarChart3 className="h-4 w-4 text-white group-hover:text-orange-400 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Recent Activities moved up here */}
                  <div className="w-96 ml-8">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-medium text-white">Recent activities</h2>
                      <div className="flex items-center space-x-2">
                        {activities.length > 0 && (
                          <button 
                            onClick={clearAllActivities}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Clear all</span>
                          </button>
                        )}
                        <button className="text-xs text-gray-400 hover:text-white transition-colors">
                          See all →
                        </button>
                      </div>
                    </div>
                    
                    {activities.length > 0 ? (
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 group relative">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                              <span className="text-xs">{activity.icon}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-300 leading-snug">{activity.message}</p>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-xs text-gray-500">{activity.time}</span>
                                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline">
                                  {activity.action}
                                </button>
                              </div>
                            </div>
                            <button 
                              onClick={() => deleteActivity(activity.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No recent activities</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="text-gray-400 hover:text-white transition-all p-2 ml-4"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-white mb-4">Overview for {new Date().toLocaleDateString('en-US', { month: 'long' })}</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Average rate</p>
                  <p className="text-2xl font-semibold text-white">4.1</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Attendance rate</p>
                  <p className="text-2xl font-semibold text-white">76%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Lessons completed</p>
                  <p className="text-2xl font-semibold text-white">24</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Light Content Section */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-6 py-8">
          {/* Invite Key Alert */}
          {!userInviteKey?.startsWith('LINKED-') ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 rounded-full p-2 mt-0.5">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Share Your Invite Key with Your Parent
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Your parent needs this code to link your account
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="bg-white rounded px-3 py-1.5 border border-amber-200">
                      <span className="text-lg font-mono font-bold text-gray-900">
                        {userInviteKey || 'Loading...'}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyInviteKey}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition-all flex items-center space-x-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : userInviteKey?.startsWith('LINKED-') ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">Account Successfully Linked!</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Your parent can now manage your tutoring sessions.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/settings')}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-all"
                >
                  View Settings
                </button>
              </div>
            </div>
          ) : null}

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - 8 cols */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Task Progress Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Task progress</h3>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="text-xs text-gray-500 bg-transparent border border-gray-200 rounded px-2 py-1"
                  >
                    <option>This week</option>
                    <option>This month</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 mb-4">Pending &nbsp;&nbsp; Complete</div>
                <div className="h-48">
                  <Bar data={taskProgressData} options={barChartOptions} />
                </div>
              </div>

              {/* Assignments Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Assignments</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700">See all →</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Human Behaviour - A Study</p>
                      <p className="text-xs text-gray-500">18.07.2023</p>
                    </div>
                    <span className="text-xs text-gray-400">Done</span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Cognitive psychology: Identify notion of emotions</p>
                      <p className="text-xs text-gray-500">19.07.2023</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded">Overdue</span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Read "Sense and Sensibility" by Jane Austen</p>
                      <p className="text-xs text-gray-500">26.07.2023</p>
                    </div>
                    <span className="text-xs text-gray-400">On time</span>
                  </div>
                </div>
              </div>

              {/* Practice Test Card */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">📝 Practice Test Available!</h3>
                    <p className="text-sm opacity-90 mb-4">
                      SAT Practice Test 1 with new MCQ questions ready to take
                    </p>
                    <button 
                      onClick={() => router.push('/dashboard/exams/cmf2w25pq0000v6qu0jrc6d3c/take')}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-all"
                    >
                      Start Practice Test →
                    </button>
                  </div>
                  <div className="text-3xl">🎯</div>
                </div>
              </div>
            </div>

            {/* Right Column - 4 cols */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Grades Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Grades</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700">See all →</button>
                </div>
                
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <Doughnut data={gradeData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">4.1</p>
                        <p className="text-xs text-gray-500">Average grade</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Subject</p>
                      <p className="text-sm font-medium text-gray-900">Human Behaviour</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Grade</p>
                      <p className="text-sm font-semibold text-gray-900">4.3</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '86%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cognitive Psychology</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">4.9</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
              </div>

              {/* Attendance Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Attendance</h3>
                  <button className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1">This week →</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  <div className="text-xs text-gray-500 pb-2">Mon</div>
                  <div className="text-xs text-gray-500 pb-2">Tue</div>
                  <div className="text-xs text-gray-500 pb-2">Wed</div>
                  <div className="text-xs text-gray-500 pb-2">Thu</div>
                  <div className="text-xs text-gray-500 pb-2">Fri</div>
                  <div className="text-xs text-gray-500 pb-2">Sat</div>
                  <div className="text-xs text-gray-500 pb-2">Sun</div>
                  
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs">17</div>
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs">18</div>
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs">19</div>
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs">20</div>
                  <div className="w-8 h-8 rounded bg-orange-500 text-white flex items-center justify-center text-xs">21</div>
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs">18</div>
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs">19</div>
                </div>
                <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-500">On time</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-500">Absent</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-500">Tardy</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming events</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-xs text-gray-500 min-w-[50px]">03:00 pm</div>
                    <div className="flex-1 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm font-medium text-gray-900">Lesson with Charls Dickenson</p>
                      <p className="text-xs text-gray-500">Behavioural Psychology</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-xs text-gray-500 min-w-[50px]">04:00 pm</div>
                    <div className="flex-1 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-900">Webinar</p>
                      <p className="text-xs text-gray-500">New ways of treatment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}