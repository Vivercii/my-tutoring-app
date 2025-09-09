import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function ensureAdminUser() {
  const adminEmail = 'admin@upstartprep.com'
  const adminPassword = 'admin123'
  
  try {
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      // Update to ensure admin privileges
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
          isActive: true,
          role: 'PARENT' // Admin can be any role, but let's use PARENT
        }
      })
      console.log('Admin user updated:', updated.email)
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin',
          hashedPassword,
          role: 'PARENT',
          isAdmin: true,
          isActive: true
        }
      })
      console.log('Admin user created:', newAdmin.email)
    }

    console.log('\nAdmin credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\nLogin at: http://localhost:3000/admin/login')
    
  } catch (error) {
    console.error('Error ensuring admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

ensureAdminUser()