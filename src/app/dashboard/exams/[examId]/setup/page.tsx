'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Clock, ChevronLeft, CheckCircle, AlertCircle,
  FileText, Calculator, Volume2, Wifi, Monitor,
  Award, Zap, BookOpen, ArrowRight, Timer,
  ClipboardList, Brain, Target, ListChecks
} from 'lucide-react'
import Link from 'next/link'

export default function ExamSetupPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const examId = params?.examId as string

  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchExamDetails()
  }, [examId])

  const fetchExamDetails = async () => {
    try {
      const response = await fetch(`/api/students/exams/${examId}/details`)
      if (response.ok) {
        const data = await response.json()
        setExamData(data)
      }
    } catch (error) {
      console.error('Failed to fetch exam details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBeginExam = async () => {
    setStarting(true)
    
    try {
      // Start the exam session
      const response = await fetch('/api/students/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId })
      })
      
      if (response.ok) {
        // Navigate immediately to the exam
        window.location.href = `/dashboard/exams/${examId}/take`
      } else {
        const error = await response.json()
        alert('Failed to start exam: ' + (error.error || 'Unknown error'))
        setStarting(false)
      }
    } catch (error) {
      console.error('Failed to start exam:', error)
      alert('An error occurred while starting the exam')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-4">This exam could not be loaded.</p>
          <Link
            href="/dashboard/exams"
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Exams
          </Link>
        </div>
      </div>
    )
  }

  const examOverview = [
    { 
      label: 'Duration', 
      value: examData.timeLimit ? `${examData.timeLimit} minutes` : 'Untimed',
      icon: Clock 
    },
    { 
      label: 'Questions', 
      value: examData.totalQuestions || '44',
      icon: FileText 
    },
    { 
      label: 'Structure', 
      value: `${examData.sections?.length || 1} section${examData.sections?.length !== 1 ? 's' : ''} (${examData.modules?.length || 2} modules)`,
      icon: ListChecks 
    },
    { 
      label: 'Format', 
      value: examData.isAdaptive ? 'Adaptive' : 'Standard',
      icon: examData.isAdaptive ? Zap : Target
    }
  ]

  const requirements = [
    { text: 'Quiet environment', icon: Volume2, checked: true },
    { text: 'Stable internet', icon: Wifi, checked: true },
    { text: 'Scratch paper', icon: FileText, checked: true }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Black to match dashboard */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/dashboard/exams"
              className="inline-flex items-center text-gray-400 hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Exams
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-light mb-2">Ready to Excel?</h1>
                <p className="text-gray-300 text-lg">{examData.title}</p>
              </div>
              <div className="flex items-center">
                <Award className="h-12 w-12 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Exam Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Exam Overview</h2>
            </div>
            
            <div className="space-y-4">
              {examOverview.map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Requirements Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">You'll Need</h2>
            </div>
            
            <div className="space-y-3">
              {requirements.map((req, index) => {
                const Icon = req.icon
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-700">{req.text}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Best Experience</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Use a desktop or laptop computer with Chrome, Firefox, or Safari for the best experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Adaptive Testing Notice */}
        {examData.isAdaptive && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Adaptive Testing
                </h3>
                <p className="text-white/90">
                  Your Module 1 performance determines Module 2 difficulty. Give each question your best effort!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Read Carefully</p>
                <p className="text-sm text-gray-600 mt-1">Take time to understand each question</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Manage Time</p>
                <p className="text-sm text-gray-600 mt-1">Keep an eye on the timer</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Stay Focused</p>
                <p className="text-sm text-gray-600 mt-1">Minimize distractions around you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Begin Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleBeginExam}
            disabled={starting}
            className="group bg-black hover:bg-gray-800 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg"
          >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Starting Exam...
              </>
            ) : (
              <>
                Begin Exam
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}