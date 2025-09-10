'use client'

import { useState } from 'react'
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
  RadialLinearScale,
} from 'chart.js'
import { Bar, Doughnut, Radar, Line } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, DollarSign, GraduationCap, Users, Target } from 'lucide-react'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
)

interface College {
  id: string
  name: string
  admissionRate?: number | string
  satTotalLow?: number
  satTotalHigh?: number
  actCompositeLow?: number
  actCompositeHigh?: number
  inStateTuition?: number
  outStateTuition?: number
  totalEnrollment?: number
  ranking?: number
}

interface StudentProfile {
  satScore?: number
  actScore?: number
  gpa?: number
}

interface CollegeDataVizProps {
  college: College
  studentProfile?: StudentProfile
  similarColleges?: College[]
}

export default function CollegeDataViz({ college, studentProfile, similarColleges = [] }: CollegeDataVizProps) {
  const [activeChart, setActiveChart] = useState<'acceptance' | 'scores' | 'cost' | 'comparison'>('acceptance')

  // Calculate acceptance rate
  const getAcceptanceRate = () => {
    if (!college.admissionRate) return 0
    if (typeof college.admissionRate === 'string') {
      const parsed = parseFloat(college.admissionRate.replace('%', ''))
      return isNaN(parsed) ? 0 : parsed
    }
    return college.admissionRate * 100
  }

  const acceptanceRate = getAcceptanceRate()

  // Acceptance Rate Donut Chart
  const acceptanceData = {
    labels: ['Accepted', 'Rejected'],
    datasets: [{
      data: [acceptanceRate, 100 - acceptanceRate],
      backgroundColor: [
        acceptanceRate > 50 ? '#10b981' : acceptanceRate > 25 ? '#f59e0b' : '#ef4444',
        '#e5e7eb'
      ],
      borderWidth: 0,
    }],
  }

  // Test Scores Range Chart
  const scoresData = {
    labels: ['SAT Range', 'ACT Range'],
    datasets: [{
      label: 'Low',
      data: [college.satTotalLow || 0, (college.actCompositeLow || 0) * 40],
      backgroundColor: '#3b82f6',
    }, {
      label: 'High',
      data: [college.satTotalHigh || 0, (college.actCompositeHigh || 0) * 40],
      backgroundColor: '#10b981',
    }],
  }

  // Cost Comparison Chart
  const costData = {
    labels: ['In-State', 'Out-of-State'],
    datasets: [{
      label: 'Tuition',
      data: [college.inStateTuition || 0, college.outStateTuition || 0],
      backgroundColor: ['#3b82f6', '#8b5cf6'],
    }],
  }

  // Student Match Radar Chart
  const matchData = studentProfile ? {
    labels: ['Academic Fit', 'SAT Match', 'ACT Match', 'Cost Fit', 'Size Preference'],
    datasets: [{
      label: 'Your Profile',
      data: [
        85, // Academic fit calculation
        studentProfile.satScore && college.satTotalLow && college.satTotalHigh
          ? Math.min(100, Math.max(0, ((studentProfile.satScore - college.satTotalLow) / (college.satTotalHigh - college.satTotalLow)) * 100))
          : 50,
        studentProfile.actScore && college.actCompositeLow && college.actCompositeHigh
          ? Math.min(100, Math.max(0, ((studentProfile.actScore - college.actCompositeLow) / (college.actCompositeHigh - college.actCompositeLow)) * 100))
          : 50,
        70, // Cost fit
        80, // Size preference
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      pointBackgroundColor: 'rgb(59, 130, 246)',
    }],
  } : null

  // Historical Acceptance Rate Trend (mock data)
  const trendData = {
    labels: ['2020', '2021', '2022', '2023', '2024'],
    datasets: [{
      label: 'Acceptance Rate (%)',
      data: [
        acceptanceRate + 5,
        acceptanceRate + 3,
        acceptanceRate + 1,
        acceptanceRate - 1,
        acceptanceRate,
      ],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  // Calculate match percentage
  const calculateMatchScore = () => {
    if (!studentProfile) return 0
    let score = 50 // Base score
    
    // SAT match
    if (studentProfile.satScore && college.satTotalLow && college.satTotalHigh) {
      if (studentProfile.satScore >= college.satTotalLow && studentProfile.satScore <= college.satTotalHigh) {
        score += 25
      } else if (studentProfile.satScore > college.satTotalHigh) {
        score += 30
      } else {
        score -= 10
      }
    }
    
    // ACT match
    if (studentProfile.actScore && college.actCompositeLow && college.actCompositeHigh) {
      if (studentProfile.actScore >= college.actCompositeLow && studentProfile.actScore <= college.actCompositeHigh) {
        score += 25
      } else if (studentProfile.actScore > college.actCompositeHigh) {
        score += 30
      } else {
        score -= 10
      }
    }
    
    return Math.min(100, Math.max(0, score))
  }

  const matchScore = calculateMatchScore()

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acceptance Rate</p>
                <p className="text-2xl font-bold">
                  {acceptanceRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {acceptanceRate < 25 ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : acceptanceRate > 50 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <Minus className="h-3 w-3 text-yellow-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {acceptanceRate < 25 ? 'Highly Selective' : acceptanceRate > 50 ? 'Less Selective' : 'Selective'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Match</p>
                <p className="text-2xl font-bold text-blue-600">
                  {matchScore}%
                </p>
                <Progress value={matchScore} className="h-1 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">SAT Range</p>
              <p className="text-lg font-bold">
                {college.satTotalLow && college.satTotalHigh 
                  ? `${college.satTotalLow}-${college.satTotalHigh}`
                  : 'N/A'}
              </p>
              {studentProfile?.satScore && college.satTotalLow && college.satTotalHigh && (
                <Badge 
                  variant={
                    studentProfile.satScore >= college.satTotalHigh ? 'default' :
                    studentProfile.satScore >= college.satTotalLow ? 'secondary' : 'outline'
                  }
                  className="mt-1"
                >
                  Your Score: {studentProfile.satScore}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Enrollment</p>
              <p className="text-lg font-bold">
                {college.totalEnrollment?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {college.totalEnrollment 
                  ? college.totalEnrollment < 5000 ? 'Small' 
                    : college.totalEnrollment < 15000 ? 'Medium' : 'Large'
                  : 'Size unknown'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Card>
        <CardHeader>
          <CardTitle>College Analytics</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge 
              variant={activeChart === 'acceptance' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveChart('acceptance')}
            >
              Acceptance
            </Badge>
            <Badge 
              variant={activeChart === 'scores' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveChart('scores')}
            >
              Test Scores
            </Badge>
            <Badge 
              variant={activeChart === 'cost' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveChart('cost')}
            >
              Costs
            </Badge>
            {studentProfile && (
              <Badge 
                variant={activeChart === 'comparison' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveChart('comparison')}
              >
                Your Fit
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {activeChart === 'acceptance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div>
                  <h4 className="text-sm font-medium mb-2">Acceptance Rate</h4>
                  <Doughnut data={acceptanceData} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: true,
                        position: 'bottom',
                      },
                    },
                  }} />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">5-Year Trend</h4>
                  <Line data={trendData} options={chartOptions} />
                </div>
              </div>
            )}
            
            {activeChart === 'scores' && (
              <Bar data={scoresData} options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 1600,
                  },
                },
              }} />
            )}
            
            {activeChart === 'cost' && (
              <Bar data={costData} options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toLocaleString()
                      },
                    },
                  },
                },
              }} />
            )}
            
            {activeChart === 'comparison' && studentProfile && matchData && (
              <Radar data={matchData} options={{
                ...chartOptions,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {acceptanceRate < 25 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded">
                <Target className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Highly Competitive</p>
                  <p className="text-sm text-gray-600">
                    With an acceptance rate of {acceptanceRate.toFixed(1)}%, this is a reach school for most applicants.
                  </p>
                </div>
              </div>
            )}
            
            {studentProfile?.satScore && college.satTotalLow && college.satTotalHigh && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                <GraduationCap className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">SAT Score Analysis</p>
                  <p className="text-sm text-gray-600">
                    {studentProfile.satScore >= college.satTotalHigh 
                      ? "Your SAT score is above the 75th percentile - strong position!"
                      : studentProfile.satScore >= college.satTotalLow
                      ? "Your SAT score is within the middle 50% range."
                      : "Consider retaking the SAT to improve your chances."}
                  </p>
                </div>
              </div>
            )}
            
            {college.inStateTuition && college.outStateTuition && (
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded">
                <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Cost Difference</p>
                  <p className="text-sm text-gray-600">
                    In-state students save ${((college.outStateTuition - college.inStateTuition) || 0).toLocaleString()} per year.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}