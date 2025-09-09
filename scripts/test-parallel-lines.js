/**
 * Test for parallel lines SVG question generation
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
      
      <!-- Note -->
      <text x="10" y="190" font-size="11">Note: Figure not drawn to scale.</text>
    </svg>
    <p>In the figure, line m is parallel to line n. What is the value of w?</p>
  `,
  questionType: 'MULTIPLE_CHOICE',
  options: [
    { letter: 'A', text: '17' },
    { letter: 'B', text: '30' },
    { letter: 'C', text: '70' },
    { letter: 'D', text: '170' }
  ],
  correctAnswer: 'D',
  explanation: 'Lines m and n are parallel, and the transversal creates corresponding angles that are equal.'
};

async function testParallelLines() {
  console.log('Testing parallel lines SVG generation...\n');
  console.log('Original question:');
  console.log('- Shows parallel lines m and n with a transversal');
  console.log('- Has angle 170° marked');
  console.log('- Variables: x, w, y');
  console.log('- Tests corresponding angles property\n');
  
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
      
      // Extract the SVG
      const svgMatch = result.generatedQuestion.questionText.match(/<svg[\s\S]*?<\/svg>/);
      
      if (svgMatch) {
        // Count lines to verify structure preserved
        const lineCount = (svgMatch[0].match(/<line/g) || []).length;
        console.log(`Line elements preserved: ${lineCount} (should be 3)`);
        
        // Extract text values
        const textMatches = svgMatch[0].match(/<text[^>]*>([^<]+)<\/text>/g);
        if (textMatches) {
          const values = textMatches.map(m => m.match(/>([^<]+)</)[1]);
          console.log('New values in SVG:', values.filter(v => !v.includes('Note')).join(', '));
        }
        
        // Check if geometry is preserved
        const hasParallelLines = svgMatch[0].includes('y1="60"') && svgMatch[0].includes('y1="140"');
        console.log(`Parallel lines geometry preserved: ${hasParallelLines ? '✅' : '❌'}`);
      }
      
      console.log('\nGenerated question text:');
      const questionText = result.generatedQuestion.questionText.replace(/<svg[\s\S]*?<\/svg>/, '[SVG DIAGRAM]');
      console.log(questionText);
      
      console.log('\nOptions:', result.generatedQuestion.options.map(o => `${o.letter}) ${o.text}`).join(', '));
      console.log('Correct answer:', result.generatedQuestion.correctAnswer);
    } else {
      console.error('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testParallelLines();