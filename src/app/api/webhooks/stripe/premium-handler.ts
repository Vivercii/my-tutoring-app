import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function handlePremiumPurchase(
  event: Stripe.Event,
  stripe: Stripe
) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      if (!session.customer || !session.metadata?.userId) {
        console.error('Missing customer or userId in session')
        return
      }

      const userId = session.metadata.userId
      const productType = session.metadata.productType

      // Get line items to determine what was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const purchasedItem = lineItems.data[0]
      
      if (!purchasedItem) {
        console.error('No line items found')
        return
      }

      const productName = purchasedItem.description || ''
      const quantity = purchasedItem.quantity || 1

      // Check if this is a tutoring package or standalone premium
      const isTutoringPackage = 
        productType === 'tutoring' ||
        productName.toLowerCase().includes('tutoring') ||
        productName.toLowerCase().includes('package') ||
        productName.toLowerCase().includes('hour')

      const isStandalonePremium = 
        productType === 'premium' ||
        productName.toLowerCase().includes('gold') ||
        productName.toLowerCase().includes('premium')

      if (isTutoringPackage) {
        // TUTORING PACKAGE: Grant premium based on package size
        let premiumMonths = 3 // Default 3 months
        
        // Determine premium duration based on package
        if (productName.includes('Platinum') || quantity >= 20) {
          premiumMonths = 12 // 1 year for platinum/large packages
        } else if (productName.includes('Vantage') || quantity >= 10) {
          premiumMonths = 6 // 6 months for vantage/medium packages
        } else if (productName.includes('Summit') || quantity >= 5) {
          premiumMonths = 3 // 3 months for summit/small packages
        }

        const premiumValidUntil = new Date()
        premiumValidUntil.setMonth(premiumValidUntil.getMonth() + premiumMonths)

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumSince: new Date(),
            premiumValidUntil
          }
        })

        console.log(`✅ Granted ${premiumMonths} months of premium with tutoring package: ${productName}`)
        
      } else if (isStandalonePremium) {
        // STANDALONE PREMIUM: Set up based on subscription
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const premiumValidUntil = new Date(subscription.current_period_end * 1000)

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumSince: new Date(),
            premiumValidUntil,
            stripeCustomerId: session.customer as string
          }
        })

        console.log(`✅ Activated standalone premium subscription until ${premiumValidUntil}`)
      }
      break
    }

    case 'customer.subscription.updated': {
      // Handle subscription renewals
      const subscription = event.data.object as Stripe.Subscription
      
      if (subscription.status === 'active') {
        const customer = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        })

        if (customer) {
          const premiumValidUntil = new Date(subscription.current_period_end * 1000)
          
          await prisma.user.update({
            where: { id: customer.id },
            data: {
              isPremium: true,
              premiumValidUntil
            }
          })

          console.log(`✅ Renewed premium subscription until ${premiumValidUntil}`)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      // Handle subscription cancellations
      const subscription = event.data.object as Stripe.Subscription
      
      const customer = await prisma.user.findFirst({
        where: { stripeCustomerId: subscription.customer as string }
      })

      if (customer) {
        // Check if they have active tutoring credits
        const credits = await prisma.sessionCredit.findUnique({
          where: { studentId: customer.id }
        })

        // Only remove premium if they don't have tutoring credits
        if (!credits || credits.remainingSessions === 0) {
          await prisma.user.update({
            where: { id: customer.id },
            data: {
              isPremium: false,
              premiumValidUntil: null
            }
          })

          console.log(`❌ Cancelled premium subscription for ${customer.email}`)
        } else {
          console.log(`ℹ️ Subscription cancelled but user has tutoring credits, keeping premium`)
        }
      }
      break
    }
  }
}

// Helper to check and update premium status periodically
export async function checkAndUpdatePremiumStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      credits: true
    }
  })

  if (!user) return

  let shouldHavePremium = false
  let validUntil = user.premiumValidUntil

  // Check direct premium subscription
  if (user.premiumValidUntil && user.premiumValidUntil > new Date()) {
    shouldHavePremium = true
  }

  // Check tutoring credits
  if (user.credits && user.credits.remainingSessions > 0) {
    shouldHavePremium = true
    // Extend premium if they have credits but subscription expired
    if (!validUntil || validUntil < new Date()) {
      validUntil = new Date()
      validUntil.setMonth(validUntil.getMonth() + 3) // 3 months buffer
    }
  }

  // Update if status changed
  if (user.isPremium !== shouldHavePremium) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: shouldHavePremium,
        premiumValidUntil: validUntil
      }
    })
  }
}