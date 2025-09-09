import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Try to find an existing user
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (users.length > 0) {
      console.log('Found existing user:')
      console.log('ID:', users[0].id)
      console.log('Email:', users[0].email)
      console.log('\nUse this command to test the webhook:')
      console.log(`stripe trigger checkout.session.completed --add checkout_session:metadata.userId=${users[0].id} --add checkout_session:metadata.priceId=price_1S2N8KFRbobZR8mHzYxNK5uK`)
    } else {
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'PARENT'
        }
      })
      console.log('Created test user:')
      console.log('ID:', testUser.id)
      console.log('Email:', testUser.email)
      console.log('\nUse this command to test the webhook:')
      console.log(`stripe trigger checkout.session.completed --add checkout_session:metadata.userId=${testUser.id} --add checkout_session:metadata.priceId=price_1S2N8KFRbobZR8mHzYxNK5uK`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()