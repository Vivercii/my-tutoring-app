/**
 * Test deterministic SVG generation
 */

const svgQuestion = {
  questionText: `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="60" x2="250" y2="60" stroke="black" stroke-width="2"/>
      <line x1="50" y1="140" x2="250" y2="140" stroke="black" stroke-width="2"/>
      <line x1="80" y1="20" x2="180" y2="180" stroke="black" stroke-width="2"/>
      <text x="85" y="55" font-size="14">170°</text>
      <text x="150" y="55" font-size="14">x</text>
      <text x="85" y="135" font-size="14">w</text>
      <text x="255" y="65" font-size="12" font-style="italic">m</text>
      <text x="255" y="145" font-size="12" font-style="italic">n</text>
    </svg>
    <p>In the figure, line m is parallel to line n. What is the value of w?</p>
  `,
  questionType: 'MULTIPLE_CHOICE',
  options: [
    { letter: 'A', text: '10°' },
    { letter: 'B', text: '70°' },
    { letter: 'C', text: '110°' },
    { letter: 'D', text: '170°' }
  ],
  correctAnswer: 'D',
  explanation: 'Corresponding angles are equal.'
};

async function testDeterministic() {
  console.log('Testing deterministic SVG generation...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/questions/generate-similar-svg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: svgQuestion })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Generation successful!\n');
      console.log('Replacements made:', result.replacements);
      
      // Extract the new SVG
      const svgMatch = result.generatedQuestion.questionText.match(/<svg[\s\S]*?<\/svg>/);
      if (svgMatch) {
        // Extract text values to verify changes
        const textMatches = svgMatch[0].match(/<text[^>]*>([^<]+)<\/text>/g);
        if (textMatches) {
          const values = textMatches.map(m => m.match(/>([^<]+)</)[1]);
          console.log('\nNew SVG values:', values);
        }
      }
      
      console.log('\nNew question:', result.generatedQuestion.questionText.match(/<p>.*<\/p>/)?.[0]);
      console.log('New options:', result.generatedQuestion.options.map(o => `${o.letter}: ${o.text}`).join(', '));
      console.log('Correct answer:', result.generatedQuestion.correctAnswer);
      
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeterministic();