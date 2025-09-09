/**
 * Visual test for AI-generated SVG - shows the actual generated SVG
 */

const testQuestion = {
  questionText: `
    <p>Find the value of angle x in the diagram below:</p>
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="100" x2="150" y2="100" stroke="black" stroke-width="2"/>
      <line x1="100" y1="100" x2="100" y2="30" stroke="black" stroke-width="2"/>
      <line x1="100" y1="100" x2="150" y2="50" stroke="black" stroke-width="2"/>
      <text x="80" y="95" font-size="14">72°</text>
      <text x="120" y="95" font-size="14">x</text>
    </svg>
  `,
  questionType: 'MULTIPLE_CHOICE',
  options: [
    { letter: 'A', text: '108°' },
    { letter: 'B', text: '90°' },
    { letter: 'C', text: '72°' },
    { letter: 'D', text: '118°' }
  ],
  correctAnswer: 'A',
  explanation: 'Angles on a straight line sum to 180°'
};

async function testVisual() {
  console.log('Testing AI SVG generation...\n');
  console.log('ORIGINAL SVG:');
  console.log('- Has 3 lines forming angles');
  console.log('- Shows 72° and x');
  console.log('- Tests angles on a straight line\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/questions/generate-similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: testQuestion })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Generation successful!\n');
      console.log('GENERATED QUESTION:');
      
      // Extract just the SVG part
      const svgMatch = result.generatedQuestion.questionText.match(/<svg[\s\S]*?<\/svg>/);
      
      if (svgMatch) {
        console.log('\nGenerated SVG:');
        console.log(svgMatch[0]);
        
        // Extract text values from the SVG
        const textMatches = svgMatch[0].match(/<text[^>]*>([^<]+)<\/text>/g);
        if (textMatches) {
          const values = textMatches.map(m => m.match(/>([^<]+)</)[1]);
          console.log('\nValues in new SVG:', values.join(', '));
        }
      }
      
      console.log('\nOptions:', result.generatedQuestion.options.map(o => `${o.letter}) ${o.text}`).join(', '));
      console.log('Correct answer:', result.generatedQuestion.correctAnswer);
    } else {
      console.error('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testVisual();