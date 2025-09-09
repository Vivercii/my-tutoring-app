'use client'

import React from 'react'
import { Sparkline, MiniSparkline } from '@/components/charts/Sparkline'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: number // Percentage change
  trendData?: number[] // Data for sparkline
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  sparklineType?: 'line' | 'area' | 'bar'
  onClick?: () => void
}

const colorMap = {
  blue: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-600/50',
    text: 'text-blue-400',
    icon: 'text-blue-500',
    spark: '#3b82f6'
  },
  green: {
    bg: 'bg-green-900/30',
    border: 'border-green-600/50',
    text: 'text-green-400',
    icon: 'text-green-500',
    spark: '#10b981'
  },
  red: {
    bg: 'bg-red-900/30',
    border: 'border-red-600/50',
    text: 'text-red-400',
    icon: 'text-red-500',
    spark: '#ef4444'
  },
  yellow: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-600/50',
    text: 'text-yellow-400',
    icon: 'text-yellow-500',
    spark: '#f59e0b'
  },
  purple: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-600/50',
    text: 'text-purple-400',
    icon: 'text-purple-500',
    spark: '#a855f7'
  },
  gray: {
    bg: 'bg-gray-800',
    border: 'border-gray-700',
    text: 'text-gray-400',
    icon: 'text-gray-500',
    spark: '#6b7280'
  }
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendData,
  color = 'gray',
  sparklineType = 'area',
  onClick
}: StatsCardProps) {
  const colors = colorMap[color]
  const isPositiveTrend = trend && trend > 0
  const isNegativeTrend = trend && trend < 0
  
  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg p-4 transition-all hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            {trend !== undefined && (
              <div className={`flex items-center text-xs font-medium ${
                isPositiveTrend ? 'text-green-400' : 
                isNegativeTrend ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {isPositiveTrend ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : isNegativeTrend ? (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                ) : (
                  <Minus className="h-3 w-3 mr-0.5" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`${colors.icon} opacity-50`}>
            {icon}
          </div>
        )}
      </div>
      
      {trendData && trendData.length > 0 && (
        <div className="mt-3 -mx-2">
          <Sparkline
            data={trendData}
            color={colors.spark}
            type={sparklineType}
            height={40}
            showTooltip={true}
            gradient={true}
          />
        </div>
      )}
    </div>
  )
}

// Compact version for smaller displays
export function MiniStatsCard({
  title,
  value,
  trend,
  trendData,
  color = 'gray'
}: {
  title: string
  value: string | number
  trend?: number
  trendData?: number[]
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
}) {
  const colors = colorMap[color]
  const isPositiveTrend = trend && trend > 0
  
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{title}</p>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-lg font-semibold text-white">{value}</span>
            {trend !== undefined && (
              <span className={`text-xs ${
                isPositiveTrend ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositiveTrend ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
        {trendData && trendData.length > 0 && (
          <MiniSparkline
            data={trendData}
            color={colors.spark}
            type="line"
            width={60}
            height={30}
          />
        )}
      </div>
    </div>
  )
}