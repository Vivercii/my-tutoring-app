'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  FileText,
  Download,
  Share2,
  Bell,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Zap,
  Star,
  BarChart3,
  Timer,
  User,
  Mail,
  Phone,
  MapPin,
  School
} from 'lucide-react'

interface ProgramOverview {
  student: {
    id: string
    name: string
    email: string
    phone?: string
    school?: string
    gradeLevel?: string
    inviteKey?: string
  }
  parents: Array<{
    name: string
    email: string
    phone?: string
    relationship: string
    isPrimary: boolean
  }>
  program: {
    type: string
    package: string
    totalHours: number
    usedHours: number
    remainingHours: number
    startDate: string
    endDate: string
    duration: string
  }
  scores: {
    baseline: {
      total: number
      math: number
      reading: number
      date: string
    }
    current: {
      total: number
      math: number
      reading: number
      date: string
    }
    target: {
      total: number
      math: number
      reading: number
    }
    improvement: number
  }
  tutors: Array<{
    name: string
    subject: string
    email: string
    phone?: string
    totalHours: number
    completedHours: number
    schedulingLink?: string
  }>
  schedule: {
    nextSession: {
      date: string
      time: string
      subject: string
      tutor: string
    } | null
    upcomingSessions: Array<{
      date: string
      time: string
      subject: string
      tutor: string
    }>
    completedSessions: number
    totalSessions: number
  }
  tests: {
    mockTests: Array<{
      date: string
      completed: boolean
      score?: number
    }>
    officialTests: Array<{
      date: string
      registered: boolean
    }>
  }
}

export default function ProgramOverviewPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [programData, setProgramData] = useState<ProgramOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role === 'PARENT') {
      fetchProgramData()
    }
  }, [status, session, studentId])

  const fetchProgramData = async () => {
    try {
      // For now, using mock data - will connect to API later
      const mockData: ProgramOverview = {
        student: {
          id: studentId,
          name: 'Nana Wiafe',
          email: 'kharismatic0@gmail.com',
          phone: '(646) 841-3936',
          school: 'Bergen County Academies',
          gradeLevel: 'Sophomore',
          inviteKey: 'UP-VUOJEB'
        },
        parents: [
          {
            name: 'Kharis Yeboah',
            email: 'kharis.yeboah@gmail.com',
            phone: '(917) 842-0535',
            relationship: 'Parent',
            isPrimary: true
          }
        ],
        program: {
          type: 'SAT Comprehensive',
          package: 'Gold Package',
          totalHours: 15,
          usedHours: 7.5,
          remainingHours: 7.5,
          startDate: '2025-06-01',
          endDate: '2025-08-31',
          duration: '3 months'
        },
        scores: {
          baseline: {
            total: 1420,
            math: 740,
            reading: 680,
            date: '2025-05-15'
          },
          current: {
            total: 1480,
            math: 770,
            reading: 710,
            date: '2025-07-01'
          },
          target: {
            total: 1550,
            math: 800,
            reading: 750
          },
          improvement: 60
        },
        tutors: [
          {
            name: 'Ulises Gonzalez',
            subject: 'SAT Reading & Writing',
            email: 'ulises@upstartprep.com',
            phone: '(310) 292-5813',
            totalHours: 7.5,
            completedHours: 3,
            schedulingLink: 'upstartprep.com/schedule/ulises'
          },
          {
            name: 'Kharis Yeboah',
            subject: 'SAT Math',
            email: 'kharis@upstartprep.com',
            phone: '(832) 916-9103',
            totalHours: 7.5,
            completedHours: 4.5,
            schedulingLink: 'upstartprep.com/schedule/kharis'
          }
        ],
        schedule: {
          nextSession: {
            date: '2025-07-15',
            time: '3:00 PM',
            subject: 'SAT Math',
            tutor: 'Kharis Yeboah'
          },
          upcomingSessions: [
            {
              date: '2025-07-17',
              time: '4:00 PM',
              subject: 'SAT Reading',
              tutor: 'Ulises Gonzalez'
            },
            {
              date: '2025-07-20',
              time: '3:00 PM',
              subject: 'SAT Math',
              tutor: 'Kharis Yeboah'
            }
          ],
          completedSessions: 5,
          totalSessions: 10
        },
        tests: {
          mockTests: [
            { date: '2025-07-01', completed: true, score: 1480 },
            { date: '2025-07-15', completed: false },
            { date: '2025-08-01', completed: false }
          ],
          officialTests: [
            { date: '2025-08-23', registered: true }
          ]
        }
      }
      setProgramData(mockData)
    } catch (error) {
      console.error('Failed to fetch program data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!programData) return null

  const progressPercentage = (programData.program.usedHours / programData.program.totalHours) * 100
  const scoreProgress = ((programData.scores.current.total - programData.scores.baseline.total) / 
                        (programData.scores.target.total - programData.scores.baseline.total)) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Black to match dashboard */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href={`/dashboard/students/${studentId}`}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Student Details
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-light mb-2">Program Overview</h1>
                <p className="text-gray-300">{programData.student.name} • {programData.program.type}</p>
              </div>
              
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-gray-700 font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{programData.program.remainingHours}h</p>
            <p className="text-sm text-gray-700">Hours Remaining</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">+{programData.scores.improvement}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{programData.scores.current.total}</p>
            <p className="text-sm text-gray-700">Current Score</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-gray-700">{scoreProgress.toFixed(0)}% there</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{programData.scores.target.total}</p>
            <p className="text-sm text-gray-700">Target Score</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-xs text-gray-700">Aug 23</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">47</p>
            <p className="text-sm text-gray-700">Days Until Test</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {['overview', 'schedule', 'tutors', 'progress', 'resources'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Program Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-1">Package</p>
                      <p className="font-semibold text-gray-900">{programData.program.package}</p>
                      <p className="text-sm text-gray-700">{programData.program.totalHours} total hours</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-1">Duration</p>
                      <p className="font-semibold text-gray-900">{programData.program.duration}</p>
                      <p className="text-sm text-gray-700">Jun 1 - Aug 31</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-1">Progress</p>
                      <p className="font-semibold text-gray-900">{programData.schedule.completedSessions}/{programData.schedule.totalSessions} sessions</p>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-700 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{programData.student.name}</p>
                        <p className="text-sm text-gray-700">{programData.student.email}</p>
                        {programData.student.phone && (
                          <p className="text-sm text-gray-700">{programData.student.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    {programData.parents.map((parent, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-gray-700 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {parent.name} {parent.isPrimary && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">Primary</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-700">{parent.email}</p>
                          {parent.phone && (
                            <p className="text-sm text-gray-700">{parent.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Tests */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Schedule</h3>
                  <div className="space-y-3">
                    {programData.tests.officialTests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <Award className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">Official SAT Test</p>
                            <p className="text-sm text-gray-700">{new Date(test.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        </div>
                        {test.registered && (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Registered
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {programData.tests.mockTests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Mock Test #{index + 1}</p>
                            <p className="text-sm text-gray-700">{new Date(test.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {test.completed ? (
                          <span className="text-sm text-gray-700">Score: {test.score}</span>
                        ) : (
                          <span className="text-sm text-gray-700">Scheduled</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tutors' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutor Assignments</h3>
                {programData.tutors.map((tutor, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{tutor.name}</h4>
                        <p className="text-gray-700 mb-3">{tutor.subject}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-700">Contact</p>
                            <p className="text-sm font-medium text-gray-900">{tutor.email}</p>
                            {tutor.phone && <p className="text-sm text-gray-700">{tutor.phone}</p>}
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">Progress</p>
                            <p className="text-sm font-medium text-gray-900">{tutor.completedHours}/{tutor.totalHours} hours</p>
                            <div className="mt-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(tutor.completedHours / tutor.totalHours) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Schedule Session
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}