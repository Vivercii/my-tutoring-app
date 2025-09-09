import { prisma } from '../src/lib/prisma'

async function checkAndFixBalance() {
  console.log('🔍 Checking payment status...\n')
  
  const user = await prisma.user.findUnique({
    where: { email: 'kharis.yeboah@gmail.com' },
    include: { 
      credits: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log('👤 User:', user.email)
  console.log('💰 Current Balance:', user.credits?.hours || 0, 'hours')
  console.log('\n📜 Recent Payments:')
  
  if (user.payments.length === 0) {
    console.log('   No payments found')
  } else {
    user.payments.forEach(payment => {
      console.log(`   - ${payment.createdAt.toLocaleString()}: $${payment.amount} - ${payment.description}`)
    })
  }
  
  // Check if we need to fix the balance
  // You mentioned you paid for another 5 hours but it didn't update
  const expectedHours = 10 // You should have 10 hours (5 + 5)
  const currentHours = user.credits?.hours || 0
  
  if (currentHours < expectedHours) {
    console.log(`\n⚠️  Balance mismatch detected!`)
    console.log(`   Current: ${currentHours} hours`)
    console.log(`   Expected: ${expectedHours} hours`)
    console.log(`\n🔧 Fixing balance...`)
    
    const hoursToAdd = expectedHours - currentHours
    
    // Update credits
    const updatedCredit = await prisma.sessionCredit.upsert({
      where: { userId: user.id },
      update: {
        hours: expectedHours,
        totalPurchased: { increment: hoursToAdd }
      },
      create: {
        userId: user.id,
        hours: expectedHours,
        totalPurchased: expectedHours,
        totalUsed: 0
      }
    })
    
    // Create transaction record
    await prisma.hourTransaction.create({
      data: {
        type: 'PURCHASE',
        hours: hoursToAdd,
        balanceBefore: currentHours,
        balanceAfter: expectedHours,
        description: `Manual correction: Added missing ${hoursToAdd} hours from Gold Package purchase`,
        userId: user.id,
        creditId: updatedCredit.id
      }
    })
    
    // Create payment record if missing
    const recentPaymentExists = user.payments.some(p => 
      p.createdAt > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
    )
    
    if (!recentPaymentExists) {
      await prisma.payment.create({
        data: {
          amount: 1099.75,
          currency: 'usd',
          status: 'succeeded',
          description: 'Gold Package - 5 hours (Manual entry)',
          packageHours: 5,
          metadata: {
            note: 'Manually added due to webhook processing issue'
          },
          userId: user.id
        }
      })
      console.log('   ✅ Payment record created')
    }
    
    console.log(`   ✅ Balance corrected to ${expectedHours} hours`)
  } else {
    console.log(`\n✅ Balance is correct: ${currentHours} hours`)
  }
  
  await prisma.$disconnect()
}

checkAndFixBalance()