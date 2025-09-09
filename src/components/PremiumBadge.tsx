'use client'

import { Crown, Sparkles } from 'lucide-react'
import { usePremiumTheme } from '@/components/providers/PremiumThemeProvider'

export function PremiumBadge({ className = '' }: { className?: string }) {
  const { isPremium } = usePremiumTheme()

  if (!isPremium) return null

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full premium-badge ${className}`}>
      <Crown className="h-4 w-4 text-white" />
      <span className="text-xs font-bold text-white">GOLD</span>
      <Sparkles className="h-3.5 w-3.5 text-white" />
    </div>
  )
}

export function PremiumIndicator() {
  const { isPremium } = usePremiumTheme()

  if (!isPremium) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] rounded-lg shadow-md">
      <Crown className="h-5 w-5 text-white animate-pulse" />
      <span className="text-sm font-semibold text-white">Premium Member</span>
    </div>
  )
}