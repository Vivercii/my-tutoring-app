'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface ExamResults {
  success: boolean
  assignment: {
    score: number | null
    completedAt: string
    status: string
  }
  results: {
    totalQuestions: number
    answeredQuestions: number
    scoredQuestions: number
    correctAnswers: number
    score: number | null
  }
  exam?: {
    type: string
    allowRetakes: boolean
  }
}

export default function ExamReviewPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string
  const [results, setResults] = useState<ExamResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [retaking, setRetaking] = useState(false)

  useEffect(() => {
    // Get results from sessionStorage (set by the take page after submission)
    const savedResults = sessionStorage.getItem(`exam-results-${examId}`)
    if (savedResults) {
      setResults(JSON.parse(savedResults))
      sessionStorage.removeItem(`exam-results-${examId}`)
    } else {
      // If no results, redirect back to exams
      router.push('/dashboard/exams')
    }
    setLoading(false)
  }, [examId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading results...</div>
      </div>
    )
  }

  if (!results) {
    return null
  }

  const { assignment, results: examResults, exam } = results
  const scorePercentage = examResults.score || 0
  const isPassing = scorePercentage >= 70
  const canRetake = true // Always allow retakes for all exams

  const handleRetake = async () => {
    setRetaking(true)
    try {
      const response = await fetch(`/api/students/exams/${examId}/retake`, {
        method: 'POST'
      })

      if (response.ok) {
        router.push(`/dashboard/exams/${examId}/take`)
      } else {
        alert('Failed to start retake. Please try again.')
        setRetaking(false)
      }
    } catch (error) {
      console.error('Error starting retake:', error)
      alert('Failed to start retake. Please try again.')
      setRetaking(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Link href="/dashboard/exams">
        <Button variant="ghost" className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Exams
        </Button>
      </Link>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Exam Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            {examResults.scoredQuestions > 0 ? (
              <>
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${isPassing ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isPassing ? (
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-600" />
                  )}
                </div>
                
                <div>
                  <div className="text-4xl font-bold mb-2">{scorePercentage.toFixed(1)}%</div>
                  <div className="text-lg text-gray-600">
                    {examResults.correctAnswers} out of {examResults.scoredQuestions} questions correct
                  </div>
                </div>

                {isPassing ? (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800 font-semibold">Great job! You passed the exam.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-800 font-semibold">Keep practicing! You can do better next time.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-blue-100">
                  <CheckCircle className="w-16 h-16 text-blue-600" />
                </div>
                
                <div>
                  <div className="text-2xl font-bold mb-2">Exam Submitted Successfully</div>
                  <div className="text-lg text-gray-600">
                    You answered {examResults.answeredQuestions} out of {examResults.totalQuestions} questions
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">This exam will be graded by your instructor.</p>
                </div>
              </>
            )}

            <div className="pt-6 space-y-2 text-sm text-gray-500">
              <p>Completed at: {new Date(assignment.completedAt).toLocaleString()}</p>
              {examResults.answeredQuestions < examResults.totalQuestions && (
                <p className="text-orange-600">
                  Note: You left {examResults.totalQuestions - examResults.answeredQuestions} questions unanswered
                </p>
              )}
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Link href="/dashboard/exams">
                <Button size="lg" variant="outline">Back to Exams</Button>
              </Link>
              {canRetake && (
                <Button 
                  size="lg" 
                  onClick={handleRetake}
                  disabled={retaking}
                >
                  {retaking ? 'Starting Retake...' : 'Retake Exam'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}