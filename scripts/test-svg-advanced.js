/**
 * Advanced test for AI-generated SVG questions
 */

const testQuestions = [
  {
    name: "Angle on a line",
    question: {
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
    }
  },
  {
    name: "Triangle angles",
    question: {
      questionText: `
        <p>Find the missing angle in this triangle:</p>
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,120 100,30 150,120" stroke="black" stroke-width="2" fill="none"/>
          <text x="45" y="110" font-size="14">45°</text>
          <text x="95" y="50" font-size="14">x</text>
          <text x="140" y="110" font-size="14">60°</text>
        </svg>
      `,
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { letter: 'A', text: '75°' },
        { letter: 'B', text: '85°' },
        { letter: 'C', text: '90°' },
        { letter: 'D', text: '65°' }
      ],
      correctAnswer: 'A',
      explanation: 'Angles in a triangle sum to 180°'
    }
  }
];

async function testAllQuestions() {
  console.log('Testing AI generation with various SVG question types...\n');
  
  for (const test of testQuestions) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing: ${test.name}`);
    console.log('='.repeat(50));
    
    try {
      const response = await fetch('http://localhost:3000/api/questions/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: test.question })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Generation successful!');
        
        // Check if SVG was generated
        const hasSVG = result.generatedQuestion.questionText.includes('<svg');
        console.log(`SVG included: ${hasSVG ? '✅' : '❌'}`);
        
        if (hasSVG) {
          // Extract SVG dimensions
          const widthMatch = result.generatedQuestion.questionText.match(/width="(\d+)"/);
          const heightMatch = result.generatedQuestion.questionText.match(/height="(\d+)"/);
          console.log(`SVG dimensions: ${widthMatch?.[1]}x${heightMatch?.[1]}`);
          
          // Count SVG elements
          const lineCount = (result.generatedQuestion.questionText.match(/<line/g) || []).length;
          const polygonCount = (result.generatedQuestion.questionText.match(/<polygon/g) || []).length;
          const textCount = (result.generatedQuestion.questionText.match(/<text/g) || []).length;
          
          console.log(`Elements: ${lineCount} lines, ${polygonCount} polygons, ${textCount} text labels`);
        }
        
        console.log(`Correct answer: ${result.generatedQuestion.correctAnswer}`);
      } else {
        console.error('❌ Generation failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Testing complete!');
}

// Run tests
testAllQuestions();