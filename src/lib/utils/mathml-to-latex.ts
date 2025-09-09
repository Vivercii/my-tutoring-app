// Utility to convert MathML to LaTeX notation for KaTeX rendering

export function convertMathMLToLatex(html: string): string {
  // Common MathML to LaTeX conversions
  const conversions: [RegExp, string | ((match: string, ...args: any[]) => string)][] = [
    // Basic math elements
    [/<math[^>]*>(.*?)<\/math>/gis, (match, content) => {
      return `$${convertMathMLContent(content)}$`
    }],
  ]

  let result = html
  
  // Apply conversions
  for (const [pattern, replacement] of conversions) {
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement)
    } else {
      result = result.replace(pattern, replacement)
    }
  }
  
  // Clean up any remaining MathML tags within the content
  result = result.replace(/<math[^>]*>/gi, '$')
  result = result.replace(/<\/math>/gi, '$')
  
  return result
}

function convertMathMLContent(content: string): string {
  // First handle nested structures before processing individual elements
  let latex = content
  
  // Remove extra whitespace and newlines for easier processing
  latex = latex.replace(/\s+/g, ' ').trim()
  
  // Handle superscripts BEFORE converting individual elements
  // This preserves the structure for proper conversion
  latex = latex.replace(/<msup>\s*<mi>([a-zA-Z])<\/mi>\s*<mn>(\d+)<\/mn>\s*<\/msup>/g, '$1^{$2}')
  latex = latex.replace(/<msup>\s*<mi>([a-zA-Z])<\/mi>\s*<mi>([a-zA-Z])<\/mi>\s*<\/msup>/g, '$1^{$2}')
  latex = latex.replace(/<msup>\s*<mrow>(.*?)<\/mrow>\s*<mrow>(.*?)<\/mrow>\s*<\/msup>/g, (match, base, exp) => {
    const processedBase = convertMathMLContent(base)
    const processedExp = convertMathMLContent(exp)
    return `{${processedBase}}^{${processedExp}}`
  })
  latex = latex.replace(/<msup>\s*<mrow>(.*?)<\/mrow>\s*<mn>(\d+)<\/mn>\s*<\/msup>/g, (match, base, exp) => {
    const processedBase = convertMathMLContent(base)
    return `{${processedBase}}^{${exp}}`
  })
  
  // Handle subscripts
  latex = latex.replace(/<msub>\s*<mi>([a-zA-Z])<\/mi>\s*<mn>(\d+)<\/mn>\s*<\/msub>/g, '$1_{$2}')
  latex = latex.replace(/<msub>\s*<mi>([a-zA-Z])<\/mi>\s*<mi>([a-zA-Z])<\/mi>\s*<\/msub>/g, '$1_{$2}')
  
  // Handle fractions
  latex = latex.replace(/<mfrac>\s*<mrow>(.*?)<\/mrow>\s*<mrow>(.*?)<\/mrow>\s*<\/mfrac>/g, (match, num, den) => {
    const processedNum = convertMathMLContent(num)
    const processedDen = convertMathMLContent(den)
    return `\\frac{${processedNum}}{${processedDen}}`
  })
  latex = latex.replace(/<mfrac>\s*<mn>(\d+)<\/mn>\s*<mn>(\d+)<\/mn>\s*<\/mfrac>/g, '\\frac{$1}{$2}')
  
  // Square roots
  latex = latex.replace(/<msqrt>(.*?)<\/msqrt>/g, (match, content) => {
    const processed = convertMathMLContent(content)
    return `\\sqrt{${processed}}`
  })
  latex = latex.replace(/<mroot>\s*<mrow>(.*?)<\/mrow>\s*<mn>(\d+)<\/mn>\s*<\/mroot>/g, (match, content, root) => {
    const processed = convertMathMLContent(content)
    return `\\sqrt[${root}]{${processed}}`
  })
  
  // Parentheses and fences
  latex = latex.replace(/<mfenced>\s*<mrow>(.*?)<\/mrow>\s*<\/mfenced>/g, (match, content) => {
    const processed = convertMathMLContent(content)
    return `(${processed})`
  })
  latex = latex.replace(/<mfenced>(.*?)<\/mfenced>/g, (match, content) => {
    const processed = convertMathMLContent(content)
    return `(${processed})`
  })
  
  // Basic elements (process these AFTER complex structures)
  latex = latex.replace(/<mn>(\d+)<\/mn>/g, '$1')
  latex = latex.replace(/<mi>([a-zA-Z])<\/mi>/g, '$1')
  latex = latex.replace(/<mo>([+\-*/=])<\/mo>/g, ' $1 ')
  latex = latex.replace(/<mo>×<\/mo>/g, ' \\times ')
  latex = latex.replace(/<mo>÷<\/mo>/g, ' \\div ')
  latex = latex.replace(/<mo>±<\/mo>/g, ' \\pm ')
  latex = latex.replace(/<mo>≤<\/mo>/g, ' \\leq ')
  latex = latex.replace(/<mo>≥<\/mo>/g, ' \\geq ')
  latex = latex.replace(/<mo>≠<\/mo>/g, ' \\neq ')
  
  // Groups (process last)
  latex = latex.replace(/<mrow>(.*?)<\/mrow>/g, '$1')
  
  // Clean up any remaining tags
  latex = latex.replace(/<[^>]+>/g, '')
  
  // Clean up extra spaces
  latex = latex.replace(/\s+/g, ' ')
  latex = latex.replace(/\s*([+\-*/=])\s*/g, ' $1 ')
  latex = latex.trim()
  
  return latex
}

// Convert HTML tables to markdown-style representation
export function convertHTMLTablesToMarkdown(html: string): string {
  // For complex HTML tables, we'll keep them as HTML but clean them up
  // KaTeX can't render tables, so we'll need to handle them differently
  
  // Remove unnecessary attributes and styles from tables
  let cleaned = html
    .replace(/style="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    .replace(/aria-[^=]*="[^"]*"/gi, '')
    .replace(/role="[^"]*"/gi, '')
    .replace(/scope="[^"]*"/gi, '')
    .replace(/border="[^"]*"/gi, '')
    .replace(/<figure[^>]*>/gi, '')
    .replace(/<\/figure>/gi, '')
    .replace(/\s+>/g, '>')
    .replace(/>\s+</g, '><')
  
  // Convert any MathML within tables
  cleaned = convertMathMLToLatex(cleaned)
  
  return cleaned
}

// Main processing function for question content
export function processQuestionContent(content: string): string {
  // First convert MathML to LaTeX
  let processed = convertMathMLToLatex(content)
  
  // Handle tables if present
  if (content.includes('<table')) {
    processed = convertHTMLTablesToMarkdown(processed)
  }
  
  // Clean up HTML entities (handle both single and double-encoded)
  processed = processed
    .replace(/&amp;nbsp;/gi, ' ')  // Double-encoded nbsp
    .replace(/&nbsp;/gi, ' ')      // Regular nbsp
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\bcm2\b/g, 'cm²')  // Convert cm2 to cm²
    .replace(/\bm2\b/g, 'm²')    // Convert m2 to m²
    .replace(/\bft2\b/g, 'ft²')  // Convert ft2 to ft²
    .replace(/\bin2\b/g, 'in²')  // Convert in2 to in²
  
  // Remove any div wrappers but keep content
  processed = processed.replace(/<div[^>]*>(.*?)<\/div>/gis, '$1\n')
  processed = processed.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n')
  
  // Trim and clean up
  processed = processed.trim()
  
  return processed
}