'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BookOpen, FileText, Home, ClipboardCheck, AlertCircle,
  Clock, PlayCircle, CheckCircle, RotateCcw, Lock,
  Calendar, TrendingUp, Award, Target, ChevronLeft
} from 'lucide-react'
import Link from 'next/link'

interface ExamAssignment {
  id: string
  status: string
  score?: number
  startedAt?: string
  completedAt?: string
}

interface Exam {
  id: string
  title: string
  description?: string
  program: string
  examType: string
  type?: string
  subProgram?: string
  examNumber?: number
  timeLimit?: number
  tags?: string[]
  _count?: {
    sections: number
  }
  assignment?: ExamAssignment | null
}

const examTypeConfig = {
  PRACTICE_TEST: {
    label: 'Practice Tests',
    icon: FileText,
    color: 'bg-blue-500',
    description: 'Full-length practice exams to prepare for the real test'
  },
  HOMEWORK: {
    label: 'Homework',
    icon: Home,
    color: 'bg-green-500',
    description: 'Assigned homework to reinforce learning'
  },
  QUIZ: {
    label: 'Quizzes',
    icon: ClipboardCheck,
    color: 'bg-purple-500',
    description: 'Quick assessments to check your understanding'
  },
  DIAGNOSTIC: {
    label: 'Diagnostic Tests',
    icon: AlertCircle,
    color: 'bg-orange-500',
    description: 'Identify your strengths and areas for improvement'
  },
  CUSTOM: {
    label: 'Custom Exams',
    icon: BookOpen,
    color: 'bg-gray-500',
    description: 'Special assignments from your tutor'
  }
}

export default function StudentExamsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [exams, setExams] = useState<Record<string, Exam[]>>({})
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalExams: 0,
    completedCount: 0,
    inProgressCount: 0
  })
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/students/exams')
      if (response.ok) {
        const data = await response.json()
        setExams(data.exams || {})
        setStats({
          totalExams: data.totalExams || 0,
          completedCount: data.completedCount || 0,
          inProgressCount: data.inProgressCount || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const startExam = async (examId: string) => {
    try {
      const response = await fetch('/api/students/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId })
      })
      
      if (response.ok) {
        const assignment = await response.json()
        router.push(`/dashboard/exams/${examId}/take`)
      }
    } catch (error) {
      console.error('Failed to start exam:', error)
    }
  }

  const retakeExam = async (examId: string) => {
    try {
      const response = await fetch(`/api/students/exams/${examId}/retake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        router.push(`/dashboard/exams/${examId}/take`)
      } else {
        alert('Failed to start retake. Please try again.')
      }
    } catch (error) {
      console.error('Failed to retake exam:', error)
      alert('Failed to start retake. Please try again.')
    }
  }

  const getExamStatus = (exam: Exam) => {
    if (!exam.assignment) return 'not_started'
    return exam.assignment.status.toLowerCase()
  }

  const getExamAction = (exam: Exam) => {
    const status = getExamStatus(exam)
    switch (status) {
      case 'completed':
        return {
          label: 'Review',
          icon: CheckCircle,
          action: () => router.push(`/dashboard/exams/${exam.id}/review`),
          className: 'bg-green-600 hover:bg-green-700'
        }
      case 'in_progress':
        return {
          label: 'Continue',
          icon: PlayCircle,
          action: () => router.push(`/dashboard/exams/${exam.id}/take`),
          className: 'bg-yellow-600 hover:bg-yellow-700'
        }
      default:
        return {
          label: 'Start',
          icon: PlayCircle,
          action: () => startExam(exam.id),
          className: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const filteredExams = selectedType === 'all' 
    ? exams 
    : { [selectedType]: exams[selectedType] || [] }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Black to match main dashboard */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-400 hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-light mb-2">My Exams</h1>
                <p className="text-gray-300">Practice tests, homework, and quizzes to track your progress</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Study Streak</p>
                  <p className="text-2xl font-bold">7 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalExams}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Average Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.completedCount > 0 ? '85%' : '--'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-6 py-2.5 rounded-full whitespace-nowrap transition-all font-medium ${
              selectedType === 'all'
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Exams
          </button>
          {Object.entries(examTypeConfig).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-6 py-2.5 rounded-full whitespace-nowrap transition-all flex items-center gap-2 font-medium ${
                selectedType === type
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <config.icon className="h-4 w-4" />
              {config.label}
              {exams[type] && exams[type].length > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  selectedType === type ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {exams[type].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : Object.keys(filteredExams).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No exams available</h3>
            <p className="text-gray-600">
              Your exams will appear here once your instructor publishes them
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredExams).map(([type, typeExams]) => {
              const config = examTypeConfig[type as keyof typeof examTypeConfig] || examTypeConfig.CUSTOM
              const Icon = config.icon
              
              if (!typeExams || typeExams.length === 0) return null
              
              return (
                <div key={type} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {config.label}
                    </h3>
                    <span className="text-sm text-gray-500">
                      • {typeExams.length} available
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {typeExams.map((exam: Exam) => {
                      const action = getExamAction(exam)
                      const status = getExamStatus(exam)
                      const ActionIcon = action.icon
                      
                      return (
                        <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-xl font-semibold text-gray-900">
                                  {exam.title}
                                </h4>
                                {status === 'completed' && exam.assignment?.score !== undefined && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold text-green-700">
                                      {exam.assignment.score}%
                                    </span>
                                  </div>
                                )}
                                {status === 'in_progress' && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-lg">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm font-semibold text-yellow-700">
                                      In Progress
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {exam.description && (
                                <p className="text-gray-600 mb-4">
                                  {exam.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                                  {exam.program}
                                </span>
                                {exam.subProgram && (
                                  <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                                    {exam.subProgram}
                                  </span>
                                )}
                                {exam.timeLimit && (
                                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    {exam.timeLimit} minutes
                                  </span>
                                )}
                                {exam._count && (
                                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                    <FileText className="h-4 w-4" />
                                    {exam._count.sections} sections
                                  </span>
                                )}
                              </div>
                              
                              {exam.tags && exam.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {exam.tags.map(tag => (
                                    <span key={tag} className="text-xs px-2.5 py-1 bg-blue-50 rounded-full text-blue-700 font-medium">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 ml-6">
                              <button
                                onClick={action.action}
                                className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
                                  status === 'completed' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                                    : status === 'in_progress'
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                }`}
                              >
                                <ActionIcon className="h-4 w-4" />
                                {action.label}
                              </button>
                              {status === 'completed' && (
                                <button
                                  onClick={() => retakeExam(exam.id)}
                                  className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium flex items-center gap-2 transition-all"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Retake
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}