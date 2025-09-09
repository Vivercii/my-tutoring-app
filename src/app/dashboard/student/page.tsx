'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StudentOnboarding from '@/components/students/StudentOnboarding'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Target, Clock, TrendingUp, BookOpen, Award, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchStudentProfile()
    }
  }, [session])

  const fetchStudentProfile = async () => {
    try {
      const response = await fetch(`/api/students/onboarding?studentId=${session?.user?.id}`)
      const data = await response.json()
      
      if (!data || !data.hasCompletedOnboarding) {
        setShowOnboarding(true)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    fetchStudentProfile()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return (
      <StudentOnboarding 
        studentId={session?.user?.id || ''} 
        onComplete={handleOnboardingComplete}
      />
    )
  }

  const daysUntilExam = profile?.examDate 
    ? Math.ceil((new Date(profile.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const activeGoals = profile?.goals?.filter((g: any) => g.type === 'OBJECTIVE') || []
  const keyResults = profile?.goals?.filter((g: any) => g.type === 'KEY_RESULT') || []
  const completedKeyResults = keyResults.filter((kr: any) => kr.status === 'COMPLETED').length
  const overallProgress = keyResults.length > 0 
    ? Math.round((completedKeyResults / keyResults.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Black to match app design */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-light">
                  Welcome back, {session?.user?.name || 'Student'}!
                </h1>
                <p className="text-gray-300 mt-2">
                  {daysUntilExam && daysUntilExam > 0 
                    ? `${daysUntilExam} days until your ${profile.program} exam - let's make them count!`
                    : 'Track your progress and achieve your goals'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard/student/colleges')}
                  className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-light transition-colors flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  My Colleges
                </button>
                <button
                  onClick={() => router.push('/dashboard/exams')}
                  className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-light transition-colors flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Practice Tests
                </button>
                <button
                  onClick={() => router.push('/dashboard/schedule')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-light transition-colors border border-gray-700"
                >
                  Book Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Target Score</p>
                  <p className="text-2xl font-bold">
                    {profile?.targetScore || 'Not set'}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Score</p>
                  <p className="text-2xl font-bold">
                    {profile?.currentScore || 'Take a test'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Days to Exam</p>
                  <p className="text-2xl font-bold">
                    {daysUntilExam && daysUntilExam > 0 ? daysUntilExam : 'Not set'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
                <Award className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals and Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Objectives */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Your Objectives</CardTitle>
              <CardDescription>What you're working towards</CardDescription>
            </CardHeader>
            <CardContent>
              {activeGoals.length > 0 ? (
                <div className="space-y-4">
                  {activeGoals.map((goal: any) => (
                    <div key={goal.id} className="border-l-4 border-blue-600 pl-4">
                      <h4 className="font-medium">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      )}
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        goal.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : goal.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No objectives set yet</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-light transition-colors"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Set Your Goals
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Results */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Key Results</CardTitle>
              <CardDescription>How you'll measure success</CardDescription>
            </CardHeader>
            <CardContent>
              {keyResults.length > 0 ? (
                <div className="space-y-3">
                  {keyResults.slice(0, 5).map((result: any) => (
                    <div key={result.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{result.title}</p>
                        {result.targetValue && (
                          <span className="text-xs text-gray-500">{result.targetValue}</span>
                        )}
                      </div>
                      <Progress 
                        value={result.status === 'COMPLETED' ? 100 : result.status === 'IN_PROGRESS' ? 50 : 0} 
                        className="h-2"
                      />
                      {result.deadline && (
                        <p className="text-xs text-gray-500">
                          Due: {format(new Date(result.deadline), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No key results defined</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Key results help you track progress towards your objectives
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Study Plan */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Today's Focus</CardTitle>
            <CardDescription>Based on your goals and upcoming exam</CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.weaknesses ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Areas to Focus On:</h4>
                  <p className="text-sm text-blue-800">{profile.weaknesses}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => router.push('/dashboard/exams')}
                    className="px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-light transition-colors"
                  >
                    Start Practice Test
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard/schedule')}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-light transition-colors"
                  >
                    Schedule Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Complete your profile to get personalized recommendations</p>
                <button 
                  className="mt-4 px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-light transition-colors"
                  onClick={() => setShowOnboarding(true)}
                >
                  Complete Profile
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}