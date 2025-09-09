import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin() {
  try {
    // Find the first user (you can change the email to target a specific user)
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'asc' }
    })

    if (users.length === 0) {
      console.log('No users found in database')
      return
    }

    console.log('\nExisting users:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - Role: ${user.role} - Admin: ${user.isAdmin}`)
    })

    // Make the first user an admin (change this to the user you want)
    const firstUser = users[0]
    
    const updatedUser = await prisma.user.update({
      where: { id: firstUser.id },
      data: { isAdmin: true }
    })

    console.log(`\n✅ Successfully made ${updatedUser.email} an admin!`)
    console.log('\nYou can now log in at:')
    console.log('👉 http://localhost:3000/admin/login')
    console.log(`\nUse email: ${updatedUser.email}`)
    console.log('And the password you set when registering this account')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()