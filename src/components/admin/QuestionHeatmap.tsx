'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface HeatmapData {
  domains: Array<{
    id: string
    name: string
    code: string
    skills: Array<{
      id: string
      name: string
      meanImportance: number
      questionCount: number
    }>
    totalQuestions: number
  }>
  totalQuestions: number
  maxQuestionsPerSkill: number
}

export default function QuestionHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeatmapData()
  }, [])

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch('/api/admin/questions/heatmap')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching heatmap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHeatColor = (count: number, maxCount: number, importance: number) => {
    if (count === 0) return 'bg-gray-100'
    
    // Normalize count (0-1)
    const normalizedCount = count / maxCount
    
    // Factor in importance (skills with higher importance should be "hotter" with fewer questions)
    const importanceWeight = importance / 4 // Normalize importance to 0-1
    const adjustedIntensity = normalizedCount * (2 - importanceWeight)
    
    // Color scale from light blue (few questions) to deep red (many questions)
    if (adjustedIntensity < 0.2) return 'bg-blue-200 hover:bg-blue-300'
    if (adjustedIntensity < 0.4) return 'bg-green-200 hover:bg-green-300'
    if (adjustedIntensity < 0.6) return 'bg-yellow-200 hover:bg-yellow-300'
    if (adjustedIntensity < 0.8) return 'bg-orange-300 hover:bg-orange-400'
    return 'bg-red-400 hover:bg-red-500'
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 3.5) return 'text-red-600 font-bold'
    if (importance >= 3.0) return 'text-orange-600 font-semibold'
    if (importance >= 2.5) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">Loading heatmap...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.domains) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Question Distribution Heatmap</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Total Questions: {data.totalQuestions}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Coverage:</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-gray-100 rounded" title="No questions" />
                <div className="w-4 h-4 bg-blue-200 rounded" title="Few questions" />
                <div className="w-4 h-4 bg-green-200 rounded" title="Some questions" />
                <div className="w-4 h-4 bg-yellow-200 rounded" title="Good coverage" />
                <div className="w-4 h-4 bg-orange-300 rounded" title="Many questions" />
                <div className="w-4 h-4 bg-red-400 rounded" title="Saturated" />
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-6">
            {data.domains.map(domain => (
              <div key={domain.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">
                    {domain.name} ({domain.code})
                  </h3>
                  <Badge variant="secondary">
                    {domain.totalQuestions} questions
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {domain.skills
                    .sort((a, b) => (b.meanImportance || 0) - (a.meanImportance || 0))
                    .map(skill => (
                      <Tooltip key={skill.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${getHeatColor(
                              skill.questionCount,
                              data.maxQuestionsPerSkill,
                              skill.meanImportance
                            )}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate pr-2" title={skill.name}>
                                  {skill.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs ${getImportanceColor(skill.meanImportance)}`}>
                                    ★ {skill.meanImportance.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {skill.questionCount} Q's
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-semibold">{skill.name}</p>
                            <p>Importance: {skill.meanImportance.toFixed(2)}/4.00</p>
                            <p>Questions: {skill.questionCount}</p>
                            <p className="text-xs text-gray-400">
                              {skill.questionCount === 0 && 'No coverage - needs questions!'}
                              {skill.questionCount > 0 && skill.questionCount < 10 && 'Low coverage'}
                              {skill.questionCount >= 10 && skill.questionCount < 30 && 'Moderate coverage'}
                              {skill.questionCount >= 30 && 'Good coverage'}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
        
        {/* Summary Statistics */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Coverage Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {data.domains.map(domain => {
              const coveredSkills = domain.skills.filter(s => s.questionCount > 0).length
              const totalSkills = domain.skills.length
              const coverage = (coveredSkills / totalSkills * 100).toFixed(0)
              
              return (
                <div key={domain.id}>
                  <p className="font-medium">{domain.code}</p>
                  <p className="text-gray-600">
                    {coveredSkills}/{totalSkills} skills ({coverage}%)
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}