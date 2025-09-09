/**
 * Test to verify SVG structure is preserved exactly
 */

const parallelLinesQuestion = {
  questionText: `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <!-- First parallel line -->
      <line x1="50" y1="60" x2="250" y2="60" stroke="black" stroke-width="2"/>
      <!-- Second parallel line -->
      <line x1="50" y1="140" x2="250" y2="140" stroke="black" stroke-width="2"/>
      <!-- Transversal line -->
      <line x1="80" y1="20" x2="180" y2="180" stroke="black" stroke-width="2"/>
      
      <!-- Angle labels -->
      <text x="85" y="55" font-size="14">170°</text>
      <text x="150" y="55" font-size="14">x</text>
      <text x="85" y="135" font-size="14">w</text>
      <text x="150" y="135" font-size="14">y</text>
      
      <!-- Line labels -->
      <text x="255" y="65" font-size="12" font-style="italic">m</text>
      <text x="255" y="145" font-size="12" font-style="italic">n</text>
    </svg>
    <p>In the figure, line m is parallel to line n. What is the value of w?</p>
  `,
  questionType: 'MULTIPLE_CHOICE',
  options: [
    { letter: 'A', text: '10' },
    { letter: 'B', text: '70' },
    { letter: 'C', text: '110' },
    { letter: 'D', text: '170' }
  ],
  correctAnswer: 'D',
  explanation: 'Corresponding angles are equal when parallel lines are cut by a transversal.'
};

async function testStructure() {
  console.log('Testing SVG structure preservation...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/questions/generate-similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: parallelLinesQuestion })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Generation successful!\n');
      
      // Extract the generated SVG
      const svgMatch = result.generatedQuestion.questionText.match(/<svg[\s\S]*?<\/svg>/);
      
      if (svgMatch) {
        console.log('Generated SVG (showing structure):');
        // Show just the line elements
        const lines = svgMatch[0].match(/<line[^>]*>/g);
        if (lines) {
          console.log('\nLine elements (should be identical to original):');
          lines.forEach(line => console.log(line));
        }
        
        // Show text elements
        const texts = svgMatch[0].match(/<text[^>]*>[^<]*<\/text>/g);
        if (texts) {
          console.log('\nText elements (values should be different):');
          texts.forEach(text => console.log(text));
        }
      }
      
      console.log('\n' + '='.repeat(50));
      console.log('Question:', result.generatedQuestion.questionText.match(/<p>.*<\/p>/)?.[0]);
      console.log('Correct answer:', result.generatedQuestion.options.find(o => o.isCorrect)?.text);
    } else {
      console.error('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStructure();