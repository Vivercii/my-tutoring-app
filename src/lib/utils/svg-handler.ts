/**
 * Utility functions for handling SVG and visual content in questions
 */

export interface VisualContent {
  type: 'svg' | 'figure' | 'table' | 'image'
  originalCode: string
  extractedValues: ExtractedValue[]
  description: string
}

export interface ExtractedValue {
  original: string
  type: 'angle' | 'length' | 'coordinate' | 'label' | 'number'
  context?: string
}

/**
 * Detects if question contains visual content
 */
export function detectVisualContent(html: string): boolean {
  return html.includes('<svg') || 
         html.includes('<figure') || 
         html.includes('<table') ||
         html.includes('<img');
}

/**
 * Extracts visual content from question HTML
 */
export function extractVisualContent(html: string): VisualContent | null {
  if (!detectVisualContent(html)) return null;

  // Extract SVG
  const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return {
      type: 'svg',
      originalCode: svgMatch[0],
      extractedValues: extractSVGValues(svgMatch[0]),
      description: describeSVG(svgMatch[0])
    };
  }

  // Extract figure
  const figureMatch = html.match(/<figure[\s\S]*?<\/figure>/i);
  if (figureMatch) {
    return {
      type: 'figure',
      originalCode: figureMatch[0],
      extractedValues: extractFigureValues(figureMatch[0]),
      description: 'Figure with visual content'
    };
  }

  // Extract table
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (tableMatch) {
    return {
      type: 'table',
      originalCode: tableMatch[0],
      extractedValues: extractTableValues(tableMatch[0]),
      description: 'Data table'
    };
  }

  return null;
}

/**
 * Extracts numerical values from SVG code
 */
function extractSVGValues(svgCode: string): ExtractedValue[] {
  const values: ExtractedValue[] = [];
  
  // Extract text content
  const textMatches = svgCode.matchAll(/<text[^>]*>([^<]+)<\/text>/gi);
  for (const match of textMatches) {
    const text = match[1].trim();
    if (text) {
      values.push({
        original: text,
        type: detectValueType(text)
      });
    }
  }

  // Extract tspan content (nested text)
  const tspanMatches = svgCode.matchAll(/<tspan[^>]*>([^<]+)<\/tspan>/gi);
  for (const match of tspanMatches) {
    const text = match[1].trim();
    if (text && !values.some(v => v.original === text)) {
      values.push({
        original: text,
        type: detectValueType(text)
      });
    }
  }

  return values;
}

/**
 * Extracts values from figure elements
 */
function extractFigureValues(figureCode: string): ExtractedValue[] {
  const values: ExtractedValue[] = [];
  
  // Extract any text that looks like measurements or labels
  const textPattern = /(\d+\.?\d*°?|[a-zA-Z]\d*|∠[A-Z]+)/g;
  const matches = figureCode.match(textPattern) || [];
  
  for (const match of matches) {
    if (!figureCode.includes(`="${match}"`)) { // Avoid attribute values
      values.push({
        original: match,
        type: detectValueType(match)
      });
    }
  }

  return values;
}

/**
 * Extracts values from table cells
 */
function extractTableValues(tableCode: string): ExtractedValue[] {
  const values: ExtractedValue[] = [];
  
  // Extract td and th content
  const cellMatches = tableCode.matchAll(/<t[dh][^>]*>([^<]+)<\/t[dh]>/gi);
  for (const match of cellMatches) {
    const text = match[1].trim();
    if (text && /\d/.test(text)) { // Only if contains numbers
      values.push({
        original: text,
        type: 'number'
      });
    }
  }

  return values;
}

/**
 * Detects the type of a value
 */
function detectValueType(text: string): ExtractedValue['type'] {
  if (text.includes('°') || text.includes('∠')) return 'angle';
  if (text.includes('cm') || text.includes('m') || text.includes('ft') || text.includes('in')) return 'length';
  if (text.match(/\(\s*-?\d+\s*,\s*-?\d+\s*\)/)) return 'coordinate';
  if (/^[A-Z]$/.test(text)) return 'label';
  return 'number';
}

/**
 * Creates a text description of SVG content with structure
 */
function describeSVG(svgCode: string): string {
  const elements = [];
  
  if (svgCode.includes('<circle')) elements.push('circle');
  if (svgCode.includes('<rect')) elements.push('rectangle');
  if (svgCode.includes('<line')) elements.push('line');
  if (svgCode.includes('<polygon')) elements.push('polygon');
  if (svgCode.includes('<path')) elements.push('path');
  if (svgCode.includes('<ellipse')) elements.push('ellipse');
  
  if (elements.length === 0) return 'geometric figure';
  
  return `geometric figure with ${elements.join(', ')}`;
}

/**
 * Analyzes SVG structure for AI guidance
 */
export function analyzeSVGStructure(svgCode: string): {
  width: string;
  height: string;
  elements: Array<{type: string, count: number}>;
  hasText: boolean;
  textCount: number;
} {
  // Extract dimensions
  const widthMatch = svgCode.match(/width="(\d+)"/);
  const heightMatch = svgCode.match(/height="(\d+)"/);
  
  // Count elements
  const elementTypes = [
    { type: 'line', regex: /<line/g },
    { type: 'circle', regex: /<circle/g },
    { type: 'rect', regex: /<rect/g },
    { type: 'polygon', regex: /<polygon/g },
    { type: 'path', regex: /<path/g },
    { type: 'ellipse', regex: /<ellipse/g },
    { type: 'text', regex: /<text/g }
  ];
  
  const elements = [];
  let textCount = 0;
  
  for (const el of elementTypes) {
    const matches = svgCode.match(el.regex);
    if (matches && matches.length > 0) {
      if (el.type === 'text') {
        textCount = matches.length;
      } else {
        elements.push({ type: el.type, count: matches.length });
      }
    }
  }
  
  return {
    width: widthMatch ? widthMatch[1] : '200',
    height: heightMatch ? heightMatch[1] : '150',
    elements,
    hasText: textCount > 0,
    textCount
  };
}

/**
 * Replaces values in visual content with new values from AI
 */
export function replaceVisualValues(
  originalCode: string, 
  replacements: Record<string, string>
): string {
  let updatedCode = originalCode;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedReplacements = Object.entries(replacements)
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [oldValue, newValue] of sortedReplacements) {
    // Replace in text elements (between > and <)
    const textPattern = new RegExp(`(>[^<]*)${escapeRegExp(oldValue)}([^<]*<)`, 'g');
    updatedCode = updatedCode.replace(textPattern, `$1${newValue}$2`);
    
    // Replace in tspan elements specifically
    const tspanPattern = new RegExp(`(<tspan[^>]*>)${escapeRegExp(oldValue)}(</tspan>)`, 'g');
    updatedCode = updatedCode.replace(tspanPattern, `$1${newValue}$2`);
    
    // Replace in text elements with attributes
    const textAttrPattern = new RegExp(`(<text[^>]*>)${escapeRegExp(oldValue)}(</text>)`, 'g');
    updatedCode = updatedCode.replace(textAttrPattern, `$1${newValue}$2`);
  }
  
  return updatedCode;
}

/**
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Prepares question for AI by extracting visual content
 */
export function prepareQuestionForAI(questionHtml: string) {
  const visualContent = extractVisualContent(questionHtml);
  
  if (visualContent) {
    // Replace visual content with placeholder
    const placeholder = `[VISUAL: ${visualContent.description} with values: ${
      visualContent.extractedValues.map(v => v.original).join(', ')
    }]`;
    
    const textWithoutVisual = questionHtml.replace(
      visualContent.originalCode,
      placeholder
    );
    
    return {
      processedText: textWithoutVisual,
      hasVisual: true,
      visualContent
    };
  }
  
  return {
    processedText: questionHtml,
    hasVisual: false,
    visualContent: null
  };
}

/**
 * Merges AI-generated content with original visual
 */
export function mergeGeneratedWithVisual(
  generatedText: string,
  originalVisual: VisualContent | null,
  replacements?: Record<string, string>
): string {
  if (!originalVisual) return generatedText;
  
  // If AI provided replacements, update the visual
  const updatedVisual = replacements 
    ? replaceVisualValues(originalVisual.originalCode, replacements)
    : originalVisual.originalCode;
  
  // Replace placeholder with actual visual
  const placeholderPattern = /\[VISUAL:[^\]]+\]/;
  if (placeholderPattern.test(generatedText)) {
    return generatedText.replace(placeholderPattern, updatedVisual);
  }
  
  // If no placeholder, append visual at appropriate location
  // (This is a fallback - AI should include placeholder)
  return generatedText + '\n' + updatedVisual;
}