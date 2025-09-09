/**
 * Test AI-generated SVG
 */

const parallelLinesQuestion = {
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

async function testAISVG() {
  console.log('Testing AI SVG generation...\n');
  
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
      
      // Extract and display the SVG
      const svgMatch = result.generatedQuestion.questionText.match(/<svg[\s\S]*?<\/svg>/);
      if (svgMatch) {
        console.log('Generated SVG:');
        console.log(svgMatch[0]);
        console.log('\n');
      }
      
      // Display question and options
      const questionMatch = result.generatedQuestion.questionText.match(/<p>.*?<\/p>/);
      if (questionMatch) {
        console.log('Question:', questionMatch[0]);
      }
      
      console.log('Options:', result.generatedQuestion.options.map(o => `${o.letter}: ${o.text}`).join(', '));
      console.log('Correct answer:', result.generatedQuestion.correctAnswer);
      
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAISVG();