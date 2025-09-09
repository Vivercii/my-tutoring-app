const studentId = 'cmf11dwhs0000v68snmzi9ct6'

async function testAPI() {
  console.log('Testing student API endpoint...')
  
  try {
    // Test the main student endpoint
    const response = await fetch(`http://localhost:3001/api/students/${studentId}`, {
      headers: {
        'Cookie': 'next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..0WNa3qvWUvSNYdcl.cSu6hWm_U0hM9bQ4KPvMRaLRuNJFH6a4jvgJxA0YEu5XTRRRaGqzFUDAbPu8PQx2BvJo2eoKJIHYVzRE3HuSjMUUdCRy83m2yAyLgXXG1fz8pKJwMUhRvLnMJrb5LJ9gPEAa8jOcflJ4NWTLRJHKOFCaSnIaEyKaAD8MWxNwL5YxTSJDFxQdWkQGGy1bqhGGwfpqFMnKWsJLAEQ0cxRRBb-9n5O5AYNZ7LItOMRzYbgTLjg0iAoTlQz5E5GvTcU1k8M_Wf1ZAQRNN5K_xIJQwbhf81EQzabuL-e2CiX7.hLOUfN5NqjIGwGrJOvP4kg'
      }
    })
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('Student data received:')
      console.log('- ID:', data.id)
      console.log('- Name:', data.name)
      console.log('- Has profile:', !!data.studentProfile)
      console.log('- Number of tutors:', data.tutors?.length || 0)
      
      if (data.tutors && data.tutors.length > 0) {
        console.log('\nAssigned tutors:')
        data.tutors.forEach(t => {
          console.log(`  - ${t.tutor.name} (${t.tutor.email})`)
        })
      }
    } else {
      const error = await response.text()
      console.error('Error response:', error)
    }
    
    // Test the tutors endpoint
    console.log('\n\nTesting tutors API endpoint...')
    const tutorsResponse = await fetch(`http://localhost:3001/api/students/${studentId}/tutors`, {
      headers: {
        'Cookie': 'next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..0WNa3qvWUvSNYdcl.cSu6hWm_U0hM9bQ4KPvMRaLRuNJFH6a4jvgJxA0YEu5XTRRRaGqzFUDAbPu8PQx2BvJo2eoKJIHYVzRE3HuSjMUUdCRy83m2yAyLgXXG1fz8pKJwMUhRvLnMJrb5LJ9gPEAa8jOcflJ4NWTLRJHKOFCaSnIaEyKaAD8MWxNwL5YxTSJDFxQdWkQGGy1bqhGGwfpqFMnKWsJLAEQ0cxRRBb-9n5O5AYNZ7LItOMRzYbgTLjg0iAoTlQz5E5GvTcU1k8M_Wf1ZAQRNN5K_xIJQwbhf81EQzabuL-e2CiX7.hLOUfN5NqjIGwGrJOvP4kg'
      }
    })
    
    console.log('Response status:', tutorsResponse.status)
    
    if (tutorsResponse.ok) {
      const tutors = await tutorsResponse.json()
      console.log('Tutors data received:')
      console.log('- Number of tutors:', tutors.length)
      
      if (tutors.length > 0) {
        console.log('\nTutors:')
        tutors.forEach(t => {
          console.log(`  - ${t.name} (${t.email})`)
          if (t.tutorProfile) {
            console.log(`    Subjects: ${t.tutorProfile.subjects?.join(', ') || 'None'}`)
          }
        })
      }
    } else {
      const error = await tutorsResponse.text()
      console.error('Error response:', error)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testAPI()