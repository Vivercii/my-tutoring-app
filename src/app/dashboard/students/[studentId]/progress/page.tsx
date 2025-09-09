'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BarChart3,
  Activity,
  Brain,
  Calculator,
  BookOpen,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

interface ScoreData {
  date: string
  total: number
  math: number
  reading: number
  type: 'baseline' | 'mock' | 'practice' | 'official'
}

interface ProgressMetric {
  subject: string
  currentScore: number
  targetScore: number
  improvement: number
  percentToGoal: number
  predictedScore: number
  confidence: number
}

interface StrengthWeakness {
  area: string
  score: number
  trend: 'improving' | 'declining' | 'stable'
  percentile: number
}

interface PracticeStats {
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  timeSpent: number
  avgTimePerQuestion: number
  questionsThisWeek: number
}

export default function ProgressTrackingPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedTimeRange, setSelectedTimeRange] = useState('3months')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [loading, setLoading] = useState(true)
  
  // Mock data states
  const [scoreHistory, setScoreHistory] = useState<ScoreData[]>([])
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetric[]>([])
  const [strengths, setStrengths] = useState<StrengthWeakness[]>([])
  const [weaknesses, setWeaknesses] = useState<StrengthWeakness[]>([])
  const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role === 'PARENT') {
      fetchProgressData()
    }
  }, [status, session, studentId])

  const fetchProgressData = async () => {
    try {
      // Mock data - will be replaced with API calls
      const mockScoreHistory: ScoreData[] = [
        { date: '2025-05-15', total: 1420, math: 740, reading: 680, type: 'baseline' },
        { date: '2025-06-01', total: 1440, math: 750, reading: 690, type: 'practice' },
        { date: '2025-06-15', total: 1460, math: 760, reading: 700, type: 'mock' },
        { date: '2025-07-01', total: 1480, math: 770, reading: 710, type: 'mock' },
        { date: '2025-07-15', total: 1500, math: 780, reading: 720, type: 'practice' }
      ]

      const mockProgressMetrics: ProgressMetric[] = [
        {
          subject: 'Overall',
          currentScore: 1500,
          targetScore: 1550,
          improvement: 80,
          percentToGoal: 62,
          predictedScore: 1540,
          confidence: 78
        },
        {
          subject: 'Math',
          currentScore: 780,
          targetScore: 800,
          improvement: 40,
          percentToGoal: 67,
          predictedScore: 795,
          confidence: 82
        },
        {
          subject: 'Reading & Writing',
          currentScore: 720,
          targetScore: 750,
          improvement: 40,
          percentToGoal: 57,
          predictedScore: 745,
          confidence: 75
        }
      ]

      const mockStrengths: StrengthWeakness[] = [
        { area: 'Algebra', score: 95, trend: 'stable', percentile: 92 },
        { area: 'Geometry', score: 88, trend: 'improving', percentile: 85 },
        { area: 'Data Analysis', score: 85, trend: 'improving', percentile: 82 }
      ]

      const mockWeaknesses: StrengthWeakness[] = [
        { area: 'Reading Comprehension', score: 68, trend: 'improving', percentile: 55 },
        { area: 'Grammar & Usage', score: 72, trend: 'stable', percentile: 60 },
        { area: 'Problem Solving', score: 75, trend: 'declining', percentile: 65 }
      ]

      const mockPracticeStats: PracticeStats = {
        totalQuestions: 2450,
        correctAnswers: 1960,
        accuracy: 80,
        timeSpent: 48.5,
        avgTimePerQuestion: 1.2,
        questionsThisWeek: 350
      }

      setScoreHistory(mockScoreHistory)
      setProgressMetrics(mockProgressMetrics)
      setStrengths(mockStrengths)
      setWeaknesses(mockWeaknesses)
      setPracticeStats(mockPracticeStats)
    } catch (error) {
      console.error('Failed to fetch progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate prediction confidence
  const getPredictionStatus = (confidence: number) => {
    if (confidence >= 80) return { color: 'text-green-600', bg: 'bg-green-100', label: 'High Confidence' }
    if (confidence >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Moderate Confidence' }
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Low Confidence' }
  }

  // Simple line chart component
  const LineChart = ({ data, subject }: { data: ScoreData[], subject: 'total' | 'math' | 'reading' }) => {
    const values = data.map(d => subject === 'total' ? d.total : subject === 'math' ? d.math : d.reading)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1
    const width = 600
    const height = 200
    const padding = 20

    const points = data.map((d, i) => {
      const value = subject === 'total' ? d.total : subject === 'math' ? d.math : d.reading
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value - min) / range) * (height - 2 * padding)
      return { x, y, value, date: d.date, type: d.type }
    })

    const pathD = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ')

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            y1={padding + i * (height - 2 * padding) / 4}
            x2={width - padding}
            y2={padding + i * (height - 2 * padding) / 4}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill={p.type === 'official' ? '#dc2626' : p.type === 'mock' ? '#3b82f6' : '#9ca3af'}
            />
            <text
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="text-xs font-medium fill-gray-900"
            >
              {p.value}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <h1 className="text-3xl font-light mb-2">Progress Tracking</h1>
                <p className="text-gray-300">Score trends, predictions, and performance analytics</p>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Score Predictions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {progressMetrics.map((metric, index) => {
            const status = getPredictionStatus(metric.confidence)
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{metric.subject}</h3>
                    <p className="text-sm text-gray-700">Score Prediction</p>
                  </div>
                  {metric.subject === 'Overall' ? (
                    <Brain className="h-5 w-5 text-purple-600" />
                  ) : metric.subject === 'Math' ? (
                    <Calculator className="h-5 w-5 text-blue-600" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-green-600" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">{metric.predictedScore}</span>
                      <span className="text-sm text-gray-700">predicted</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bg} ${status.color} mt-2`}>
                      <Activity className="h-3 w-3" />
                      {status.label} ({metric.confidence}%)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Current</span>
                      <span className="font-medium text-gray-900">{metric.currentScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Target</span>
                      <span className="font-medium text-gray-900">{metric.targetScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Improvement</span>
                      <span className="font-medium text-green-600">+{metric.improvement}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700">Progress to Goal</span>
                      <span className="text-gray-900">{metric.percentToGoal}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        style={{ width: `${metric.percentToGoal}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Score History Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Score History</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedSubject === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Total Score
              </button>
              <button
                onClick={() => setSelectedSubject('math')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedSubject === 'math'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Math
              </button>
              <button
                onClick={() => setSelectedSubject('reading')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedSubject === 'reading'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Reading & Writing
              </button>
            </div>
          </div>

          <div className="mb-4">
            <LineChart 
              data={scoreHistory} 
              subject={selectedSubject === 'all' ? 'total' : selectedSubject === 'math' ? 'math' : 'reading'} 
            />
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-gray-700">Mock Test</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-gray-700">Practice Test</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-700">Official Test</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Strengths
            </h3>
            <div className="space-y-3">
              {strengths.map((strength, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{strength.area}</span>
                      {strength.trend === 'improving' && (
                        <ChevronUp className="h-4 w-4 text-green-600" />
                      )}
                      {strength.trend === 'declining' && (
                        <ChevronDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">{strength.percentile}th %ile</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Areas for Improvement
            </h3>
            <div className="space-y-3">
              {weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{weakness.area}</span>
                      {weakness.trend === 'improving' && (
                        <ChevronUp className="h-4 w-4 text-green-600" />
                      )}
                      {weakness.trend === 'declining' && (
                        <ChevronDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${weakness.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">{weakness.percentile}th %ile</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Practice Statistics */}
        {practiceStats && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Practice Statistics</h3>
            <div className="grid grid-cols-6 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-blue-600">
                    {practiceStats.accuracy}%
                  </span>
                </div>
                <p className="text-sm text-gray-700">Accuracy</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-purple-600">
                    {practiceStats.totalQuestions}
                  </span>
                </div>
                <p className="text-sm text-gray-700">Questions</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-green-600">
                    {practiceStats.timeSpent}h
                  </span>
                </div>
                <p className="text-sm text-gray-700">Time Spent</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-orange-600">
                    {practiceStats.avgTimePerQuestion}m
                  </span>
                </div>
                <p className="text-sm text-gray-700">Avg Time/Q</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-red-600">
                    {practiceStats.questionsThisWeek}
                  </span>
                </div>
                <p className="text-sm text-gray-700">This Week</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-700">On Track</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Insights</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Strong upward trend in Math scores - maintain current study approach</span>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Reading comprehension showing steady improvement - consider increasing practice frequency</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>Grammar accuracy plateauing - recommend focused grammar drills next 2 weeks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-purple-600 mt-0.5" />
                  <span>Based on current trajectory, 85% chance of reaching target score by test date</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}