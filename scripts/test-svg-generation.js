/**
 * Test script for SVG handling in AI question generation
 */

// Sample question with SVG content
const testQuestion = {
  questionText: `
    <p>Find the value of angle x in the diagram below:</p>
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="100" x2="150" y2="100" stroke="black" stroke-width="2"/>
      <line x1="100" y1="100" x2="100" y2="30" stroke="black" stroke-width="2"/>
      <line x1="100" y1="100" x2="150" y2="50" stroke="black" stroke-width="2"/>
      <text x="80" y="95" font-size="14">72°</text>
      <text x="120" y="95" font-size="14">x</text>
      <text x="120" y="70" font-size="14">108°</text>
    </svg>
  `,
  questionType: 'MULTIPLE_CHOICE',
  options: [
    { letter: 'A', text: '80°' },
    { letter: 'B', text: '90°' },
    { letter: 'C', text: '100°' },
    { letter: 'D', text: '108°' }
  ],
  correctAnswer: 'D',
  explanation: 'The angles on a straight line add up to 180°. Since one angle is 72°, the other angle x = 180° - 72° = 108°.'
}

// Test the API endpoint
async function testSVGGeneration() {
  console.log('Testing SVG question generation...')
  console.log('Original question has SVG with values: 72°, x, 108°')
  
  try {
    const response = await fetch('http://localhost:3000/api/questions/generate-similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: testQuestion })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('\n✅ Generation successful!')
      console.log('\nGenerated question:')
      console.log('Question text:', result.generatedQuestion.questionText.substring(0, 200) + '...')
      console.log('Options:', result.generatedQuestion.options)
      console.log('Correct answer:', result.generatedQuestion.correctAnswer)
      
      // Check if SVG was properly handled
      if (result.generatedQuestion.questionText.includes('<svg')) {
        console.log('\n✅ SVG preserved in generated question')
        // Extract the new values from the SVG
        const svgMatch = result.generatedQuestion.questionText.match(/<text[^>]*>([^<]+)<\/text>/g)
        if (svgMatch) {
          const values = svgMatch.map(m => m.match(/>([^<]+)</)[1])
          console.log('New SVG values:', values)
        }
      } else {
        console.log('\n⚠️ SVG not found in generated question')
      }
    } else {
      console.error('❌ Generation failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Error calling API:', error)
  }
}

// Run the test
testSVGGeneration()