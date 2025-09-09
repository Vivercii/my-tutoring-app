import { prisma } from '../src/lib/prisma'

async function testCreditsAPI() {
  console.log('📊 Testing Credits API Data\n')
  
  const user = await prisma.user.findUnique({
    where: { email: 'kharis.yeboah@gmail.com' },
    include: { 
      credits: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  })
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log('👤 User:', user.email)
  console.log('📦 Credits Record:')
  console.log('   ID:', user.credits?.id)
  console.log('   Current Hours:', user.credits?.hours || 0)
  console.log('   Total Purchased:', user.credits?.totalPurchased || 0)
  console.log('   Total Used:', user.credits?.totalUsed || 0)
  console.log('   Last Updated:', user.credits?.updatedAt)
  
  console.log('\n💳 Recent Payments:')
  user.payments.forEach(p => {
    console.log(`   - ${p.createdAt.toLocaleString()}: $${p.amount} - ${p.description}`)
  })
  
  // Now simulate what the API should return
  console.log('\n🔍 Expected API Response:')
  console.log(JSON.stringify({
    hours: user.credits?.hours || 0,
    totalPurchased: user.credits?.totalPurchased || 0,
    totalUsed: user.credits?.totalUsed || 0,
    userId: user.id,
  }, null, 2))
  
  await prisma.$disconnect()
}

testCreditsAPI()