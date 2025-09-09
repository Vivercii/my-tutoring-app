const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function generateCalendarTokens() {
  try {
    // Generate tokens for all users who don't have them
    const users = await prisma.user.findMany({
      where: {
        calendarToken: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    console.log(`Found ${users.length} users without calendar tokens`)
    
    for (const user of users) {
      const token = crypto.randomBytes(32).toString('hex')
      
      await prisma.user.update({
        where: { id: user.id },
        data: { calendarToken: token }
      })
      
      console.log(`Generated token for ${user.name || user.email} (${user.role})`)
      
      // Generate calendar URLs for testing
      const baseUrl = 'http://localhost:3001/api/calendar'
      let calendarUrl = ''
      
      switch (user.role) {
        case 'STUDENT':
          calendarUrl = `${baseUrl}/student/${user.id}/${token}/calendar.ics`
          break
        case 'PARENT':
          calendarUrl = `${baseUrl}/parent/${user.id}/${token}/calendar.ics`
          break
        case 'TUTOR':
          calendarUrl = `${baseUrl}/tutor/${user.id}/${token}/calendar.ics`
          break
      }
      
      if (calendarUrl) {
        console.log(`  Calendar URL: ${calendarUrl}`)
      }
    }
    
    console.log('\n✅ Calendar tokens generated successfully!')
    
    // Show example parent calendar URL for testing
    const parentUser = await prisma.user.findFirst({
      where: { 
        role: 'PARENT',
        email: 'kharis.yeboah@gmail.com'
      },
      select: {
        id: true,
        name: true,
        calendarToken: true
      }
    })
    
    if (parentUser && parentUser.calendarToken) {
      console.log('\n📅 Test Parent Calendar URL:')
      console.log(`http://localhost:3001/api/calendar/parent/${parentUser.id}/${parentUser.calendarToken}/calendar.ics`)
      console.log('\nYou can test this URL by:')
      console.log('1. Opening it in your browser')
      console.log('2. Adding it to Google Calendar: Settings → Add calendar → From URL')
      console.log('3. Adding it to Apple Calendar: File → New Calendar Subscription')
    }
    
  } catch (error) {
    console.error('Error generating calendar tokens:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateCalendarTokens()