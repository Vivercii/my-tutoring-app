import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'student@test.com' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      inviteKey: true
    }
  })
  
  console.log('Test Student Data:')
  console.log('==================')
  console.log('ID:', user?.id)
  console.log('Email:', user?.email)
  console.log('Name:', user?.name)
  console.log('Role:', user?.role)
  console.log('Invite Key:', user?.inviteKey || 'NULL - No invite key set!')
  
  if (!user?.inviteKey) {
    console.log('\n⚠️  The Test student does not have an invite key!')
    console.log('Generating a new invite key...')
    
    const updatedUser = await prisma.user.update({
      where: { email: 'student@test.com' },
      data: {
        inviteKey: Math.random().toString(36).substring(2, 8).toUpperCase()
      }
    })
    
    console.log('✅ New invite key generated:', updatedUser.inviteKey)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })