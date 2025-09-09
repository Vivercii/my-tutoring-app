import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    // Find all users with PARENT role
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' },
      include: {
        credits: true
      }
    })
    
    console.log(`Found ${parents.length} parent users:\n`)
    
    for (const parent of parents) {
      console.log(`Name: ${parent.name}`)
      console.log(`Email: ${parent.email}`)
      console.log(`Role: ${parent.role}`)
      console.log(`Credits: ${parent.credits?.hours || 0} hours`)
      console.log(`Total Purchased: ${parent.credits?.totalPurchased || 0} hours`)
      console.log(`Total Used: ${parent.credits?.totalUsed || 0} hours`)
      console.log('---')
    }
    
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkUsers()