/**
 * Generate sample trend data for demonstration
 * In production, this would come from your API/database
 */
export function generateTrendData(points: number, min: number, max: number): number[] {
  return Array.from({ length: points }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  )
}

export function generateGrowthData(points: number, start: number, growth: number): number[] {
  const data = [start]
  for (let i = 1; i < points; i++) {
    const prev = data[i - 1]
    const change = (Math.random() - 0.3) * growth
    data.push(Math.max(0, prev + change))
  }
  return data.map(Math.round)
}

export function generateRealisticRevenueData(days: number): number[] {
  const baseRevenue = 5000
  const data: number[] = []
  
  for (let i = 0; i < days; i++) {
    // Simulate weekly patterns (higher on weekdays)
    const dayOfWeek = i % 7
    const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.2
    
    // Add some randomness
    const randomVariation = 0.8 + Math.random() * 0.4
    
    // Calculate daily revenue
    const dailyRevenue = baseRevenue * weekdayMultiplier * randomVariation
    data.push(Math.round(dailyRevenue))
  }
  
  return data
}

export function generateSessionData(days: number): number[] {
  const baseSessions = 20
  const data: number[] = []
  
  for (let i = 0; i < days; i++) {
    // Simulate weekly patterns
    const dayOfWeek = i % 7
    const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.5 : 1.3
    
    // Add some randomness
    const randomVariation = 0.7 + Math.random() * 0.6
    
    // Calculate daily sessions
    const dailySessions = baseSessions * weekdayMultiplier * randomVariation
    data.push(Math.round(dailySessions))
  }
  
  return data
}