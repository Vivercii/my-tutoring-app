const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addTutorAvailability() {
  try {
    // Find all tutors
    const tutors = await prisma.user.findMany({
      where: { role: 'TUTOR' },
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    console.log(`Found ${tutors.length} tutors`)
    
    for (const tutor of tutors) {
      console.log(`\nAdding availability for ${tutor.name} (${tutor.email})`)
      
      // Clear existing availability
      await prisma.tutorAvailability.deleteMany({
        where: { tutorId: tutor.id }
      })
      
      // Add availability for weekdays (Monday-Friday)
      const availabilitySlots = [
        // Monday
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
        // Tuesday
        { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 2, startTime: '14:00', endTime: '18:00' },
        // Wednesday
        { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
        // Thursday
        { dayOfWeek: 4, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 4, startTime: '14:00', endTime: '18:00' },
        // Friday
        { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 5, startTime: '14:00', endTime: '17:00' },
        // Saturday
        { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' },
      ]
      
      for (const slot of availabilitySlots) {
        await prisma.tutorAvailability.create({
          data: {
            tutorId: tutor.id,
            ...slot
          }
        })
      }
      
      console.log(`Added ${availabilitySlots.length} availability slots`)
    }
    
    console.log('\n✅ Successfully added availability for all tutors')
    
    // Show summary
    const totalAvailability = await prisma.tutorAvailability.count()
    console.log(`Total availability slots in database: ${totalAvailability}`)
    
  } catch (error) {
    console.error('Error adding tutor availability:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTutorAvailability()