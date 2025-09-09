/**
 * Test LaTeX/KaTeX formatting preservation
 */

const triangleQuestion = {
  questionText: 'In triangle $ABC$, the measure of angle $B$ is $52^\\circ$ and the measure of angle $C$ is $17^\\circ$. What is the measure of angle $A$?',
  questionType: 'MULTIPLE_CHOICE',
  options: [
    { letter: 'A', text: '$21^\\circ$' },
    { letter: 'B', text: '$35^\\circ$' },
    { letter: 'C', text: '$69^\\circ$' },
    { letter: 'D', text: '$111^\\circ$' }
  ],
  correctAnswer: 'D',
  explanation: 'The sum of angles in a triangle is $180^\\circ$. So $A = 180^\\circ - 52^\\circ - 17^\\circ = 111^\\circ$.'
};

async function testLatexFormatting() {
  console.log('Testing LaTeX formatting preservation...\n');
  console.log('Original question uses LaTeX formatting:');
  console.log('- Triangle $ABC$ notation');
  console.log('- Angle $B$, $C$, $A$ notation');
  console.log('- Degrees as $52^\\circ$\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/questions/generate-similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: triangleQuestion })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Generation successful!\n');
      
      console.log('Generated question:');
      console.log(result.generatedQuestion.questionText);
      console.log('');
      
      // Check if LaTeX formatting is preserved
      const hasLatex = result.generatedQuestion.questionText.includes('$');
      const hasAngleNotation = result.generatedQuestion.questionText.includes('\\angle') || 
                               result.generatedQuestion.questionText.includes('angle $');
      const hasDegreeNotation = result.generatedQuestion.questionText.includes('\\circ') || 
                                result.generatedQuestion.questionText.includes('°');
      
      console.log('LaTeX formatting checks:');
      console.log(`- Uses $ delimiters: ${hasLatex ? '✅' : '❌'}`);
      console.log(`- Has angle notation: ${hasAngleNotation ? '✅' : '❌'}`);
      console.log(`- Has degree notation: ${hasDegreeNotation ? '✅' : '❌'}`);
      console.log('');
      
      console.log('Generated options:');
      result.generatedQuestion.options.forEach(opt => {
        console.log(`${opt.letter}: ${opt.text} ${opt.isCorrect ? '✓' : ''}`);
      });
      
      if (result.generatedQuestion.explanation) {
        console.log('\nExplanation:', result.generatedQuestion.explanation);
      }
      
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLatexFormatting();