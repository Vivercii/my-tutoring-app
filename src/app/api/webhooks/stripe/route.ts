import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { handlePremiumPurchase } from './premium-handler'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Define the hours for each price (tutoring packages)
const PRICE_TO_HOURS: Record<string, number> = {
  'price_1S2M7NLDoRMBiHI8IBMbQEpB': 5, // Gold Package - 5 hours
  'price_1S2N8KFRbobZR8mHzYxNK5uK': 5, // Test product - 5 hours
  'price_1S2N7UFRbobZR8mHfOSRZ24Y': 5, // Test product - 5 hours
  'price_10_hours': 10,
  'price_20_hours': 20,
  'price_40_hours': 40,
  // Add your actual Stripe Price IDs here
}

// Premium subscription price IDs
const PREMIUM_PRICE_IDS = {
  monthly: 'price_1S4OAPLDoRMBiHI8RuOwEllB',
  quarterly: 'price_1S4OCwLDoRMBiHI8WwH9AA53',
  semiannual: 'price_1S4OQ6LDoRMBiHI89E9Hq8jY',
  annual: 'price_1S4ORVLDoRMBiHI8LBPDJ7oz'
}

// Check if a price ID is for premium subscription
const isPremiumSubscription = (priceId: string) => {
  return Object.values(PREMIUM_PRICE_IDS).includes(priceId)
}

export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received!')
  console.log('📍 Webhook endpoint hit at:', new Date().toISOString())
  
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!
    
    console.log('📝 Request body length:', body.length)
    console.log('🔑 Webhook signature present:', !!signature)
    console.log('🔑 Webhook signature:', signature?.substring(0, 20) + '...')
    console.log('🔐 Expected webhook secret:', webhookSecret?.substring(0, 20) + '...')

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
      console.log('✅ Webhook signature verified successfully')
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      console.error('Full error:', err)
      return NextResponse.json(
        { error: `Invalid signature: ${err.message}` },
        { status: 400 }
      )
    }

    console.log(`📦 Event type: ${event.type}`)
    console.log(`Event ID: ${event.id}`)
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('💳 Checkout session completed:', session.id)
      console.log('📊 Full session object keys:', Object.keys(session))
      console.log('📋 Session metadata:', JSON.stringify(session.metadata, null, 2))
      console.log('💰 Amount:', session.amount_total)
      console.log('👤 Customer:', session.customer)
      console.log('📧 Customer email:', session.customer_email)
      console.log('💳 Payment status:', session.payment_status)

      // Get the user ID from metadata
      const userId = session.metadata?.userId
      console.log('🔍 Extracted userId from metadata:', userId)
      
      if (!userId) {
        console.error('❌ Missing userId in checkout session metadata')
        console.error('📋 Available metadata:', JSON.stringify(session.metadata, null, 2))
        console.error('🔍 Metadata keys:', Object.keys(session.metadata || {}))
        return NextResponse.json(
          { error: 'Missing userId in metadata' },
          { status: 400 }
        )
      }
      
      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        console.error(`❌ User not found in database: ${userId}`)
        console.error('📧 Customer email from session:', session.customer_email)
        
        // For test webhooks, we might not have a real user
        // In production, this should never happen as checkout creates the user
        if (process.env.NODE_ENV === 'development' && userId.startsWith('test-')) {
          console.log('⚠️ Test user detected, skipping database update')
          return NextResponse.json({ received: true })
        }
        
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      console.log('👤 Processing for user:', user.email)

      // Get line items to determine what was purchased
      let lineItems
      try {
        // Try to expand line_items if they're not already included
        if (!session.line_items) {
          lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            limit: 10,
            expand: ['data.price.product']
          })
          console.log(`📋 Found ${lineItems.data.length} line items from API`)
        } else {
          lineItems = session.line_items
          console.log(`📋 Found ${lineItems.data.length} line items from session`)
        }
      } catch (lineItemError: any) {
        console.error('⚠️ Error fetching line items:', lineItemError.message)
        
        // For test webhooks, we might not have real line items
        // Check if we have price information directly in the session
        if (session.metadata?.priceId) {
          console.log('📦 Using price ID from metadata:', session.metadata.priceId)
          lineItems = {
            data: [{
              price: { id: session.metadata.priceId }
            }]
          }
        } else {
          console.log('⚠️ No line items or price ID found, skipping...')
          return NextResponse.json({ received: true })
        }
      }
      
      for (const item of lineItems.data) {
        const priceId = item.price?.id
        console.log('Processing price ID:', priceId)
        
        if (!priceId) {
          console.log('⚠️ No price ID for item, skipping')
          continue
        }

        // Check if this is a premium subscription
        if (isPremiumSubscription(priceId)) {
          console.log('Processing premium subscription purchase:', priceId)
          
          // Determine premium duration based on price ID
          let premiumMonths = 1
          if (priceId === PREMIUM_PRICE_IDS.monthly) {
            premiumMonths = 1
          } else if (priceId === PREMIUM_PRICE_IDS.quarterly) {
            premiumMonths = 3
          } else if (priceId === PREMIUM_PRICE_IDS.semiannual) {
            premiumMonths = 6
          } else if (priceId === PREMIUM_PRICE_IDS.annual) {
            premiumMonths = 12
          }

          const premiumValidUntil = new Date()
          premiumValidUntil.setMonth(premiumValidUntil.getMonth() + premiumMonths)

          // Update user to premium
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              premiumSince: new Date(),
              premiumValidUntil,
              stripeCustomerId: session.customer as string
            }
          })

          console.log(`✅ Activated premium subscription for ${premiumMonths} months`)

        } else {
          // This is a tutoring package
          const hoursToAdd = PRICE_TO_HOURS[priceId] || 0
          console.log(`📚 Tutoring package detected: ${hoursToAdd} hours for price ${priceId}`)
          
          if (hoursToAdd > 0) {
            console.log(`➕ Adding ${hoursToAdd} hours to user ${userId}`)
            // Update or create SessionCredit for the user with audit trail
            const existingCredit = await prisma.sessionCredit.findUnique({
              where: { userId },
            })

            let creditRecord
            const balanceBefore = existingCredit?.hours || 0
            const balanceAfter = balanceBefore + hoursToAdd

            if (existingCredit) {
              // Update existing credits
              creditRecord = await prisma.sessionCredit.update({
                where: { userId },
                data: {
                  hours: balanceAfter,
                  totalPurchased: existingCredit.totalPurchased + hoursToAdd,
                },
              })
            } else {
              // Create new credits
              creditRecord = await prisma.sessionCredit.create({
                data: {
                  userId,
                  hours: hoursToAdd,
                  totalPurchased: hoursToAdd,
                  totalUsed: 0,
                },
              })
            }

            // Create transaction record for audit trail
            await prisma.hourTransaction.create({
              data: {
                type: 'PURCHASE',
                hours: hoursToAdd,
                balanceBefore,
                balanceAfter,
                description: `Purchased ${hoursToAdd} hours tutoring package`,
                stripePaymentId: session.payment_intent as string,
                userId,
                creditId: creditRecord.id,
              }
            })

            // Record payment with hours
            await prisma.payment.create({
              data: {
                amount: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency || 'usd',
                status: 'succeeded',
                description: `${hoursToAdd} hours tutoring package`,
                stripePaymentId: session.payment_intent as string,
                packageHours: hoursToAdd,
                metadata: {
                  priceId,
                  sessionId: session.id,
                  hoursGranted: hoursToAdd,
                },
                userId,
              }
            })

            console.log(`✅ Successfully added ${hoursToAdd} hours to user ${userId}`)
            console.log(`   Balance: ${balanceBefore}h → ${balanceAfter}h`)
            console.log(`   Transaction ID: ${creditRecord.id}`)
          } else {
            console.log(`⚠️ No hours configured for price ID: ${priceId}`)
          }
        }
      }
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

