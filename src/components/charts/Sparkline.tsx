'use client'

import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

interface SparklineProps {
  data: number[] | { value: number; label?: string }[]
  width?: number | string
  height?: number
  color?: string
  type?: 'line' | 'area' | 'bar'
  showGrid?: boolean
  showTooltip?: boolean
  strokeWidth?: number
  gradient?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = '100%',
  height = 60,
  color = '#ef4444', // red-500
  type = 'line',
  showGrid = false,
  showTooltip = true,
  strokeWidth = 2,
  gradient = true,
  className = ''
}: SparklineProps) {
  // Convert simple number array to data objects
  const chartData = Array.isArray(data) && typeof data[0] === 'number'
    ? data.map((value, index) => ({ index, value }))
    : data.map((item, index) => ({ 
        index, 
        value: (item as any).value,
        label: (item as any).label 
      }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-gray-800 px-2 py-1 rounded shadow-lg border border-gray-700">
          <p className="text-white text-xs font-medium">
            {payload[0].payload.label || `Value: ${payload[0].value}`}
          </p>
        </div>
      )
    }
    return null
  }

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  const commonProps = {
    data: chartData,
    margin: { top: 5, right: 0, left: 0, bottom: 5 }
  }

  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        {type === 'line' ? (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey="index" hide />
            <YAxis hide />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              animationDuration={500}
            />
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart {...commonProps}>
            {gradient && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
            )}
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey="index" hide />
            <YAxis hide />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={strokeWidth}
              fill={gradient ? `url(#${gradientId})` : color}
              fillOpacity={gradient ? 1 : 0.3}
              animationDuration={500}
            />
          </AreaChart>
        ) : (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey="index" hide />
            <YAxis hide />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Bar
              dataKey="value"
              fill={color}
              animationDuration={500}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

// Mini sparkline for inline use (smaller, no tooltip)
export function MiniSparkline({
  data,
  color = '#10b981', // green-500
  type = 'line',
  width = 80,
  height = 20
}: {
  data: number[]
  color?: string
  type?: 'line' | 'area'
  width?: number
  height?: number
}) {
  return (
    <Sparkline
      data={data}
      color={color}
      type={type}
      width={width}
      height={height}
      showTooltip={false}
      showGrid={false}
      strokeWidth={1.5}
      gradient={false}
    />
  )
}