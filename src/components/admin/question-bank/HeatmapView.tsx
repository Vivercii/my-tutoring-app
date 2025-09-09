'use client'

import dynamic from 'next/dynamic'
import { BarChart3 } from 'lucide-react'

const QuestionHeatmap = dynamic(() => import('@/components/admin/QuestionHeatmap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-900 border border-gray-700 rounded-lg animate-pulse" />
})

interface HeatmapViewProps {
  // No props needed as the heatmap component is self-contained
}

export default function HeatmapView({}: HeatmapViewProps) {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold text-white">SAT Question Heatmap</h2>
        </div>
        <p className="text-gray-400">
          Visualize question distribution across SAT Math domains and skills. 
          Click on any cell to see questions for that skill.
        </p>
      </div>
      
      <QuestionHeatmap />
    </>
  )
}