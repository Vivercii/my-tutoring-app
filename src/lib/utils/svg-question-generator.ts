/**
 * Smart SVG question generator that preserves diagram structure
 */

export function generateSVGVariation(originalSVG: string): {
  newSVG: string;
  replacements: Record<string, string>;
} {
  // Extract all text elements
  const textPattern = /<text[^>]*>([^<]+)<\/text>/g;
  const matches = [...originalSVG.matchAll(textPattern)];
  
  const replacements: Record<string, string> = {};
  let newSVG = originalSVG;
  
  // First pass: collect all single-letter variables to avoid conflicts
  const existingVars = new Set<string>();
  matches.forEach(match => {
    const textContent = match[1].trim();
    if (/^[a-zA-Z]$/.test(textContent)) {
      existingVars.add(textContent);
    }
  });
  
  // Generate replacement map for variables to avoid conflicts
  const varReplacements = new Map<string, string>();
  const availableVars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z'];
  existingVars.forEach(oldVar => {
    const candidates = availableVars.filter(v => !existingVars.has(v) && !Array.from(varReplacements.values()).includes(v));
    if (candidates.length > 0) {
      varReplacements.set(oldVar, candidates[Math.floor(Math.random() * candidates.length)]);
    }
  });
  
  // Build all replacements first
  matches.forEach(match => {
    const textContent = match[1].trim();
    
    if (textContent.includes('°')) {
      // It's an angle - generate a new angle value
      const oldAngle = parseInt(textContent);
      let newAngle;
      
      // Generate angles that make mathematical sense
      if (oldAngle === 180) {
        newAngle = 180; // Keep straight lines as 180
      } else if (oldAngle > 90) {
        // Obtuse angle - generate another obtuse angle
        newAngle = 95 + Math.floor(Math.random() * 75); // 95-169
      } else {
        // Acute angle - generate another acute angle
        newAngle = 15 + Math.floor(Math.random() * 75); // 15-89
      }
      
      replacements[textContent] = `${newAngle}°`;
      
    } else if (/^[a-zA-Z]$/.test(textContent)) {
      // Single letter variable - use pre-generated replacement
      const newVar = varReplacements.get(textContent);
      if (newVar && !replacements[textContent]) {
        replacements[textContent] = newVar;
      }
      
    } else if (/^\d+$/.test(textContent)) {
      // Pure number - generate a different number
      const oldNum = parseInt(textContent);
      const newNum = oldNum + (10 + Math.floor(Math.random() * 20)) * (Math.random() > 0.5 ? 1 : -1);
      replacements[textContent] = String(Math.max(5, newNum));
      
    } else if (textContent.match(/\d+\s*(cm|m|ft|in|mm)/)) {
      // Measurement - generate new measurement
      const match = textContent.match(/(\d+)\s*(cm|m|ft|in|mm)/);
      if (match) {
        const oldValue = parseInt(match[1]);
        const unit = match[2];
        const newValue = oldValue + (5 + Math.floor(Math.random() * 15)) * (Math.random() > 0.5 ? 1 : -1);
        replacements[textContent] = `${Math.max(1, newValue)} ${unit}`;
      }
    }
  });
  
  // Apply all replacements at once, sorted by length to avoid partial replacements
  const sortedReplacements = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
  
  sortedReplacements.forEach(([oldText, newText]) => {
    // Replace all occurrences within text elements only
    const regex = new RegExp(`(<text[^>]*>)${oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(</text>)`, 'g');
    newSVG = newSVG.replace(regex, `$1${newText}$2`);
  });
  
  return { newSVG, replacements };
}

/**
 * Generate appropriate answer choices based on the question type and correct answer
 */
export function generateAnswerChoices(
  correctAnswer: string,
  questionType: 'angle' | 'length' | 'calculation' | 'variable'
): string[] {
  const choices: string[] = [correctAnswer];
  
  if (questionType === 'angle') {
    const correct = parseInt(correctAnswer);
    
    // Generate plausible wrong answers
    const distractors = [
      correct + 10,
      correct - 10,
      180 - correct, // Supplementary angle
      90 - correct,  // Complementary angle (if applicable)
      correct + 20,
      correct - 20,
    ]
      .filter(v => v > 0 && v < 180 && v !== correct)
      .map(v => `${v}°`);
    
    // Pick 3 unique distractors
    while (choices.length < 4 && distractors.length > 0) {
      const idx = Math.floor(Math.random() * distractors.length);
      const distractor = distractors[idx];
      if (!choices.includes(distractor)) {
        choices.push(distractor);
      }
      distractors.splice(idx, 1);
    }
    
  } else if (questionType === 'length') {
    const match = correctAnswer.match(/(\d+)\s*(.*)/);
    if (match) {
      const correct = parseInt(match[1]);
      const unit = match[2];
      
      const distractors = [
        correct + 5,
        correct - 5,
        correct * 2,
        Math.floor(correct / 2),
        correct + 10,
        correct - 10,
      ]
        .filter(v => v > 0 && v !== correct)
        .map(v => `${v} ${unit}`);
      
      while (choices.length < 4 && distractors.length > 0) {
        const idx = Math.floor(Math.random() * distractors.length);
        const distractor = distractors[idx];
        if (!choices.includes(distractor)) {
          choices.push(distractor);
        }
        distractors.splice(idx, 1);
      }
    }
  }
  
  // Shuffle the choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  
  return choices;
}