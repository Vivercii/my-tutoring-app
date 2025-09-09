import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetCredits() {
  try {
    console.log('🔄 Starting credit reset...')
    
    // Get all users with PARENT role
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' },
      select: { id: true, email: true, name: true }
    })
    
    console.log(`Found ${parents.length} parent accounts`)
    
    for (const parent of parents) {
      console.log(`\nResetting credits for ${parent.name || parent.email}...`)
      
      // Delete existing transactions for this user
      const existingCredit = await prisma.sessionCredit.findUnique({
        where: { userId: parent.id }
      })
      
      if (existingCredit) {
        // Delete all transactions first
        await prisma.hourTransaction.deleteMany({
          where: { creditId: existingCredit.id }
        })
        console.log('  ✓ Deleted existing transactions')
        
        // Reset the credit record to 0
        await prisma.sessionCredit.update({
          where: { userId: parent.id },
          data: {
            hours: 0,
            totalPurchased: 0,
            totalUsed: 0,
          }
        })
        console.log('  ✓ Reset credit balance to 0')
      } else {
        // Create a new credit record with 0 balance
        await prisma.sessionCredit.create({
          data: {
            userId: parent.id,
            hours: 0,
            totalPurchased: 0,
            totalUsed: 0,
          }
        })
        console.log('  ✓ Created new credit record with 0 balance')
      }
      
      // Optionally delete payment records (comment out if you want to keep payment history)
      // await prisma.payment.deleteMany({
      //   where: { userId: parent.id }
      // })
      // console.log('  ✓ Deleted payment records')
    }
    
    console.log('\n✅ Credit reset complete!')
    console.log('You can now test purchasing hours through the dashboard.')
    
  } catch (error) {
    console.error('❌ Error resetting credits:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the reset
resetCredits()