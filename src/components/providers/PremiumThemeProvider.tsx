'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface PremiumThemeContextType {
  isPremium: boolean
  premiumReason?: 'direct_subscription' | 'tutoring_package' | 'admin_granted'
  premiumColor: string
  premiumGradient: string
  primaryColor: string
  accentColor: string
}

const PremiumThemeContext = createContext<PremiumThemeContextType>({
  isPremium: false,
  premiumColor: '#D4AF37', // UpstartPrep Gold
  premiumGradient: 'from-[#D4AF37] to-[#B8941F]',
  primaryColor: '#111827', // Default gray-900
  accentColor: '#111827'
})

export function usePremiumTheme() {
  return useContext(PremiumThemeContext)
}

export function PremiumThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [isPremium, setIsPremium] = useState(false)
  const [premiumReason, setPremiumReason] = useState<'direct_subscription' | 'tutoring_package' | 'admin_granted'>()

  useEffect(() => {
    // Check if user is premium (through direct subscription OR tutoring package)
    if (session?.user) {
      // Premium if they have:
      // 1. Direct premium subscription
      // 2. Active tutoring package (will be set by webhook)
      // 3. Admin status
      const hasPremium = session.user.isPremium || session.user.isAdmin || false
      setIsPremium(hasPremium)
      
      if (session.user.isAdmin) {
        setPremiumReason('admin_granted')
      } else if (session.user.isPremium) {
        // Will be set to true when they have tutoring or direct subscription
        setPremiumReason('direct_subscription')
      }
    }
  }, [session])

  const themeValues = {
    isPremium,
    premiumReason,
    premiumColor: '#D4AF37', // UpstartPrep Gold
    premiumGradient: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
    primaryColor: isPremium ? '#D4AF37' : '#111827',
    accentColor: isPremium ? '#B8941F' : '#1f2937'
  }

  useEffect(() => {
    // Apply CSS variables for premium theme - but don't add the premium-user class to avoid unwanted styling
    if (isPremium) {
      document.documentElement.style.setProperty('--primary-color', '#D4AF37')
      document.documentElement.style.setProperty('--accent-color', '#B8941F')
      // Removed: document.documentElement.classList.add('premium-user')
    } else {
      document.documentElement.style.setProperty('--primary-color', '#111827')
      document.documentElement.style.setProperty('--accent-color', '#1f2937')
      // Removed: document.documentElement.classList.remove('premium-user')
    }
  }, [isPremium])

  return (
    <PremiumThemeContext.Provider value={themeValues}>
      {children}
    </PremiumThemeContext.Provider>
  )
}