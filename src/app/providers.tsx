'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { PremiumThemeProvider } from '@/components/providers/PremiumThemeProvider'
import MasqueradeIndicator from '@/components/admin/MasqueradeIndicator'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryProvider>
        <PremiumThemeProvider>
          <MasqueradeIndicator />
          {children}
        </PremiumThemeProvider>
      </QueryProvider>
    </SessionProvider>
  )
}