import Stripe from 'stripe'
import { prisma } from '../src/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

async function generateTestPayments() {
  console.log('🎯 Generating Test Payment Links\n')
  
  // Get user
  const user = await prisma.user.findFirst({
    where: { email: 'kharis.yeboah@gmail.com' },
    include: { credits: true }
  })
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log('👤 User:', user.email)
  console.log('💰 Current Balance:', user.credits?.hours || 0, 'hours\n')
  console.log('📦 Available Packages:\n')
  
  const packages = [
    { name: 'Gold Package', hours: 5, priceId: 'price_1S2M7NLDoRMBiHI8IBMbQEpB', price: 1099.75 },
    { name: 'Growth Pack', hours: 10, priceId: 'price_10_hours', price: 700 },
    { name: 'Accelerator Pack', hours: 20, priceId: 'price_20_hours', price: 1300 },
    { name: 'Intensive Pack', hours: 40, priceId: 'price_40_hours', price: 2400 },
  ]
  
  for (const pkg of packages) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId || undefined,
        customer_email: user.stripeCustomerId ? undefined : user.email,
        payment_method_types: ['card'],
        line_items: [{
          price: pkg.priceId,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:3000/dashboard/billing?success=true',
        cancel_url: 'http://localhost:3000/dashboard/billing?canceled=true',
        metadata: {
          userId: user.id,
          priceId: pkg.priceId,
        },
      })
      
      console.log(`${pkg.name} (${pkg.hours} hours - $${pkg.price})`)
      console.log(`🔗 ${session.url}\n`)
    } catch (error: any) {
      // If price doesn't exist in Stripe, create a test product/price
      if (error.code === 'resource_missing' && pkg.priceId !== 'price_1S2M7NLDoRMBiHI8IBMbQEpB') {
        console.log(`⚠️  ${pkg.name}: Price ID not found in Stripe (${pkg.priceId})`)
        console.log(`    Creating test product...`)
        
        const product = await stripe.products.create({
          name: pkg.name,
          description: `${pkg.hours} hours of tutoring`,
        })
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: pkg.price * 100,
          currency: 'usd',
        })
        
        const session = await stripe.checkout.sessions.create({
          customer: user.stripeCustomerId || undefined,
          customer_email: user.stripeCustomerId ? undefined : user.email,
          payment_method_types: ['card'],
          line_items: [{
            price: price.id,
            quantity: 1,
          }],
          mode: 'payment',
          success_url: 'http://localhost:3000/dashboard/billing?success=true',
          cancel_url: 'http://localhost:3000/dashboard/billing?canceled=true',
          metadata: {
            userId: user.id,
            priceId: pkg.priceId, // Use original priceId for webhook mapping
            actualPriceId: price.id,
          },
        })
        
        console.log(`✅  Created and ready!`)
        console.log(`🔗 ${session.url}\n`)
      } else {
        console.log(`❌  ${pkg.name}: ${error.message}\n`)
      }
    }
  }
  
  console.log('💡 Instructions:')
  console.log('1. Click any link above to purchase that package')
  console.log('2. Use test card: 4242 4242 4242 4242')
  console.log('3. Each purchase will add hours to your balance')
  console.log('4. Your balance will update immediately after payment')
  console.log('\n📊 Current balance updates:')
  console.log(`   Now: ${user.credits?.hours || 0} hours`)
  console.log('   After Gold: ' + ((user.credits?.hours || 0) + 5) + ' hours')
  console.log('   After Growth: ' + ((user.credits?.hours || 0) + 10) + ' hours')
  console.log('   After Accelerator: ' + ((user.credits?.hours || 0) + 20) + ' hours')
  console.log('   After Intensive: ' + ((user.credits?.hours || 0) + 40) + ' hours')
  
  await prisma.$disconnect()
}

generateTestPayments()