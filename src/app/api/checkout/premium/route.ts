import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

// Premium subscription price IDs
const PREMIUM_PRICE_IDS = {
  monthly: 'price_1S4OAPLDoRMBiHI8RuOwEllB',
  quarterly: 'price_1S4OCwLDoRMBiHI8WwH9AA53',
  semiannual: 'price_1S4OQ6LDoRMBiHI89E9Hq8jY',
  annual: 'price_1S4ORVLDoRMBiHI8LBPDJ7oz'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceType } = await req.json()
    
    if (!priceType || !PREMIUM_PRICE_IDS[priceType as keyof typeof PREMIUM_PRICE_IDS]) {
      return NextResponse.json({ error: 'Invalid price type' }, { status: 400 })
    }

    const priceId = PREMIUM_PRICE_IDS[priceType as keyof typeof PREMIUM_PRICE_IDS]

    // Initialize Stripe inside the function to avoid build-time errors
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured')
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://my-tutoring-app-bev2-xi.vercel.app'}/dashboard?success=true&type=premium`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://my-tutoring-app-bev2-xi.vercel.app'}/dashboard?canceled=true`,
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email!,
        productType: 'premium',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}