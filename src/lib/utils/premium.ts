import { prisma } from '@/lib/prisma'

export async function checkUserPremiumStatus(userId: string): Promise<{
  isPremium: boolean
  reason?: 'direct_subscription' | 'tutoring_package' | 'admin_granted'
  validUntil?: Date | null
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      credits: true,
      payments: {
        where: {
          status: 'succeeded',
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!user) {
    return { isPremium: false }
  }

  // 1. Check if user has direct premium subscription
  if (user.isPremium && user.premiumValidUntil) {
    if (user.premiumValidUntil > new Date()) {
      return {
        isPremium: true,
        reason: 'direct_subscription',
        validUntil: user.premiumValidUntil
      }
    }
  }

  // 2. Check if user has active tutoring credits
  if (user.credits && user.credits.remainingSessions > 0) {
    return {
      isPremium: true,
      reason: 'tutoring_package',
      validUntil: null // Premium lasts as long as they have credits
    }
  }

  // 3. Check recent tutoring package purchases (grace period)
  const recentTutoringPurchase = user.payments.find(payment => {
    const metadata = payment.metadata as any
    return metadata?.type === 'tutoring_package' || 
           metadata?.productName?.includes('Tutoring') ||
           metadata?.productName?.includes('Package')
  })

  if (recentTutoringPurchase) {
    // Give 30 days of premium after last tutoring purchase
    const gracePeriodEnd = new Date(recentTutoringPurchase.createdAt)
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30)
    
    if (gracePeriodEnd > new Date()) {
      return {
        isPremium: true,
        reason: 'tutoring_package',
        validUntil: gracePeriodEnd
      }
    }
  }

  // 4. Admin can manually grant premium
  if (user.isAdmin) {
    return {
      isPremium: true,
      reason: 'admin_granted',
      validUntil: null
    }
  }

  return { isPremium: false }
}

// Helper function to grant premium when tutoring is purchased
export async function grantPremiumWithTutoring(
  userId: string,
  packageName: string,
  hoursCount: number
) {
  // Calculate premium validity based on package
  let premiumMonths = 3 // Default 3 months
  
  if (hoursCount >= 20) {
    premiumMonths = 12 // 1 year for large packages
  } else if (hoursCount >= 10) {
    premiumMonths = 6 // 6 months for medium packages
  }

  const validUntil = new Date()
  validUntil.setMonth(validUntil.getMonth() + premiumMonths)

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumSince: new Date(),
      premiumValidUntil: validUntil
    }
  })

  console.log(`✅ Granted ${premiumMonths} months of premium with ${packageName}`)
}