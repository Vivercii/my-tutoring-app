'use client'

import React from 'react'
import { StatsCard, MiniStatsCard } from '@/components/admin/StatsCard'
import { Sparkline } from '@/components/charts/Sparkline'
import { 
  DollarSign, Users, TrendingUp, Calendar, Target, 
  Clock, BookOpen, GraduationCap, CreditCard, Activity
} from 'lucide-react'

// Generate sample data for demonstration
const generateTrendData = (points: number, min: number, max: number) => {
  return Array.from({ length: points }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  )
}

const generateGrowthData = (points: number, start: number, growth: number) => {
  const data = [start]
  for (let i = 1; i < points; i++) {
    const prev = data[i - 1]
    const change = (Math.random() - 0.3) * growth
    data.push(Math.max(0, prev + change))
  }
  return data.map(Math.round)
}

export default function AnalyticsPage() {
  // Sample data - in production, this would come from your API
  const revenueData = generateGrowthData(30, 5000, 200)
  const usersData = generateGrowthData(30, 100, 5)
  const sessionsData = generateTrendData(30, 20, 80)
  const hoursData = generateTrendData(30, 100, 300)

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Analytics Dashboard with Sparklines</h1>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value="$124,500"
            subtitle="All time revenue"
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
            trend={23.5}
            trendData={revenueData.slice(-7)}
            sparklineType="area"
          />
          
          <StatsCard
            title="Active Users"
            value="2,845"
            subtitle="Currently active"
            icon={<Users className="h-6 w-6" />}
            color="blue"
            trend={12.3}
            trendData={usersData.slice(-7)}
            sparklineType="line"
          />
          
          <StatsCard
            title="Sessions Today"
            value="156"
            subtitle="Tutoring sessions"
            icon={<BookOpen className="h-6 w-6" />}
            color="purple"
            trend={-5.2}
            trendData={sessionsData.slice(-7)}
            sparklineType="bar"
          />
          
          <StatsCard
            title="Hours Taught"
            value="1,234"
            subtitle="This month"
            icon={<Clock className="h-6 w-6" />}
            color="yellow"
            trend={18.7}
            trendData={hoursData.slice(-7)}
            sparklineType="area"
          />
        </div>

        {/* Detailed Revenue Chart */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Revenue Trend (30 Days)</h2>
          <div className="h-64">
            <Sparkline
              data={revenueData.map((value, index) => ({
                value,
                label: `Day ${index + 1}: $${value.toLocaleString()}`
              }))}
              color="#10b981"
              type="area"
              height={240}
              showGrid={true}
              showTooltip={true}
              gradient={true}
            />
          </div>
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MiniStatsCard
            title="New Students"
            value="48"
            trend={15}
            trendData={generateTrendData(7, 5, 15)}
            color="green"
          />
          
          <MiniStatsCard
            title="New Tutors"
            value="12"
            trend={8}
            trendData={generateTrendData(7, 1, 5)}
            color="blue"
          />
          
          <MiniStatsCard
            title="Completion Rate"
            value="94%"
            trend={2}
            trendData={generateTrendData(7, 88, 96)}
            color="purple"
          />
          
          <MiniStatsCard
            title="Avg Rating"
            value="4.8"
            trend={0.5}
            trendData={generateTrendData(7, 45, 50).map(v => v / 10)}
            color="yellow"
          />
        </div>

        {/* Program Performance */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Program Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">SAT Prep</h3>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-white">342 Students</span>
                  <span className="text-xs text-green-400">+12%</span>
                </div>
                <Sparkline
                  data={generateTrendData(10, 300, 380)}
                  color="#3b82f6"
                  type="line"
                  height={40}
                  showTooltip={false}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">ACT Prep</h3>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-white">198 Students</span>
                  <span className="text-xs text-red-400">-3%</span>
                </div>
                <Sparkline
                  data={generateTrendData(10, 180, 210)}
                  color="#ef4444"
                  type="line"
                  height={40}
                  showTooltip={false}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Academic Support</h3>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-white">456 Students</span>
                  <span className="text-xs text-green-400">+28%</span>
                </div>
                <Sparkline
                  data={generateGrowthData(10, 400, 10)}
                  color="#10b981"
                  type="line"
                  height={40}
                  showTooltip={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline with Sparklines */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Daily Activity Pattern</h2>
          <div className="space-y-4">
            {['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Evening (6pm-12am)'].map((period, index) => {
              const data = generateTrendData(24, 10 + index * 10, 40 + index * 15)
              const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length)
              
              return (
                <div key={period} className="flex items-center space-x-4">
                  <div className="w-40">
                    <p className="text-sm text-gray-400">{period}</p>
                    <p className="text-lg font-semibold text-white">{avg} sessions/hr</p>
                  </div>
                  <div className="flex-1">
                    <Sparkline
                      data={data}
                      color={['#3b82f6', '#10b981', '#f59e0b'][index]}
                      type="bar"
                      height={50}
                      showTooltip={true}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}