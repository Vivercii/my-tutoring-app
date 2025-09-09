import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeUserPremium(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        isPremium: true,
        premiumSince: new Date(),
        premiumValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    })
    
    console.log(`✅ User ${user.email} is now a premium member!`)
    console.log(`   Premium since: ${user.premiumSince}`)
    console.log(`   Valid until: ${user.premiumValidUntil}`)
  } catch (error) {
    console.error('Error making user premium:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('Please provide an email address')
  console.log('Usage: npx tsx scripts/make-user-premium.ts user@example.com')
  process.exit(1)
}

makeUserPremium(email)