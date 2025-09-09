import Stripe from 'stripe'
import { prisma } from '../src/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

async function testWebhookIntegration() {
  console.log('🧪 Testing Stripe Webhook Integration\n')
  
  try {
    // 1. Check current user balance
    const user = await prisma.user.findFirst({
      where: { email: 'kharis.yeboah@gmail.com' },
      include: {
        credits: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('👤 User:', user.email)
    console.log('💳 Stripe Customer ID:', user.stripeCustomerId || 'Not set')
    console.log('⏰ Current Balance:', user.credits?.hours || 0, 'hours')
    console.log('\n📜 Recent Payments:')
    
    if (user.payments.length === 0) {
      console.log('   No payments found')
    } else {
      user.payments.forEach(payment => {
        console.log(`   - ${payment.createdAt.toLocaleDateString()}: $${payment.amount} - ${payment.description}`)
      })
    }
    
    // 2. Check webhook endpoint configuration
    console.log('\n🔗 Webhook Configuration:')
    console.log('   Endpoint: http://localhost:3000/api/webhooks/stripe')
    console.log('   Secret: whsec_...', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10))
    
    // 3. Check Stripe Price IDs
    console.log('\n💰 Configured Price IDs:')
    const priceIds = {
      'Gold Package (5 hours)': 'price_1S2M7NLDoRMBiHI8IBMbQEpB',
      'Growth Pack (10 hours)': 'price_10_hours',
      'Accelerator Pack (20 hours)': 'price_20_hours',
      'Intensive Pack (40 hours)': 'price_40_hours',
    }
    
    for (const [name, id] of Object.entries(priceIds)) {
      console.log(`   - ${name}: ${id}`)
    }
    
    // 4. Test creating a checkout session
    console.log('\n🛒 Creating Test Checkout Session:')
    
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1S2M7NLDoRMBiHI8IBMbQEpB', // Gold Package - 5 hours
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/dashboard/billing?success=true',
      cancel_url: 'http://localhost:3000/dashboard/billing?canceled=true',
      metadata: {
        userId: user.id,
        priceId: 'price_1S2M7NLDoRMBiHI8IBMbQEpB',
      },
    })
    
    console.log('   ✅ Checkout session created:', session.id)
    console.log('   📎 Metadata included:')
    console.log('      - userId:', session.metadata?.userId)
    console.log('      - priceId:', session.metadata?.priceId)
    console.log('\n🌐 Test Payment URL:')
    console.log('   ', session.url)
    console.log('\n⚡ Instructions:')
    console.log('   1. Click the URL above to make a test payment')
    console.log('   2. Use test card: 4242 4242 4242 4242')
    console.log('   3. Any future date for expiry, any CVC')
    console.log('   4. Check your dashboard for updated hours')
    console.log('\n📊 Monitoring:')
    console.log('   - Webhook events will appear in the Stripe CLI terminal')
    console.log('   - Check http://localhost:3000/dashboard/billing for balance updates')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWebhookIntegration()