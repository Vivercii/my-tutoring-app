import { PrismaClient } from '@prisma/client'
import * as cheerio from 'cheerio'

const prisma = new PrismaClient()

// Function to extract clean text from HTML
function extractCleanText(html: string): string {
  // Check if it contains Alpine.js template code
  if (html.includes('x-data') || html.includes('x-show') || html.includes('store.data') || html.includes('$store.data')) {
    // This is template code with embedded answer text
    // The actual answer is typically in <p> tags or <div> with class="self-center"
    
    // First, try to extract content from <p> tags
    const pTagMatch = html.match(/<p>([^<]+)<\/p>/i)
    if (pTagMatch && pTagMatch[1]) {
      const text = pTagMatch[1].trim()
      if (text && text.length > 0 && text.length < 500) {
        return text
      }
    }
    
    // Try to find content in self-center divs
    const selfCenterMatch = html.match(/<div[^>]*class="self-center"[^>]*>([^<]+)<\/div>/i)
    if (selfCenterMatch && selfCenterMatch[1]) {
      const text = selfCenterMatch[1].trim()
      if (text && text.length > 0 && text.length < 500) {
        return text
      }
    }
    
    // Look for answer text patterns after the letter marker
    // Pattern: Letter followed by actual answer text
    const letterPattern = />\s*[A-D]\s*<\/[^>]+>\s*<\/div>\s*<div[^>]*>([^<]+)/i
    const letterMatch = html.match(letterPattern)
    if (letterMatch && letterMatch[1]) {
      const text = letterMatch[1].trim()
      if (text && text.length > 0 && text.length < 500 && !text.match(/^[A-D]$/)) {
        return text
      }
    }
    
    // As a fallback, use cheerio to parse and extract text more carefully
    try {
      const $ = cheerio.load(html, { decodeEntities: false })
      
      // Remove script and style elements
      $('script').remove()
      $('style').remove()
      
      // Look for the actual answer text
      // It's usually in a div with class="self-center" or in a p tag
      let answerText = ''
      
      // Try self-center divs first
      $('.self-center').each((i, elem) => {
        const text = $(elem).text().trim()
        if (text && text.length > answerText.length && !text.includes('$store')) {
          answerText = text
        }
      })
      
      // If not found, try p tags
      if (!answerText) {
        $('p').each((i, elem) => {
          const text = $(elem).text().trim()
          if (text && text.length > answerText.length && !text.includes('$store')) {
            answerText = text
          }
        })
      }
      
      // If still not found, get all text and filter
      if (!answerText) {
        const allText = $.text()
        // Split by common delimiters and find the longest meaningful text
        const parts = allText.split(/[\n\r\t]/).map(s => s.trim()).filter(s => s.length > 2)
        
        for (const part of parts) {
          // Skip if it looks like code or HTML attributes
          if (!part.includes('store') && 
              !part.includes('class') && 
              !part.includes('border') &&
              !part.includes('transition') &&
              !part.match(/^[A-D]\s*$/) &&
              part.length > answerText.length) {
            answerText = part
          }
        }
      }
      
      if (answerText) {
        // Clean up the text
        answerText = answerText
          .replace(/\s+/g, ' ')
          .replace(/^\s*[A-D]\s+/, '') // Remove leading letter
          .trim()
        
        if (answerText && answerText.length > 0 && answerText.length < 500) {
          return answerText
        }
      }
    } catch (e) {
      console.error('Cheerio parsing error:', e)
    }
  }
  
  // If it's regular HTML without Alpine.js, extract text normally
  const $ = cheerio.load(html, { decodeEntities: false })
  $('script').remove()
  $('style').remove()
  
  return $.text().trim()
}

async function cleanAnswerChoices() {
  console.log('🧹 Starting answer choice cleanup...\n')
  
  // Get all answer options that might need cleaning
  const options = await prisma.answerOption.findMany({
    where: {
      OR: [
        { text: { contains: 'x-data' } },
        { text: { contains: 'x-show' } },
        { text: { contains: 'store.data' } },
        { text: { contains: '$store.data' } },
        { text: { contains: 'class=' } },
        { text: { contains: '@click' } },
        { text: { contains: ':class' } }
      ]
    },
    include: {
      question: {
        select: {
          id: true,
          questionCode: true,
          subject: true
        }
      }
    }
  })
  
  console.log(`Found ${options.length} answer options that need cleaning\n`)
  
  let cleanedCount = 0
  let failedCount = 0
  const updates: { id: string, original: string, cleaned: string, questionCode?: string }[] = []
  
  for (const option of options) {
    try {
      const cleanedText = extractCleanText(option.text)
      
      if (cleanedText && cleanedText !== option.text && cleanedText.length > 0) {
        updates.push({
          id: option.id,
          original: option.text.substring(0, 100) + '...',
          cleaned: cleanedText,
          questionCode: option.question.questionCode || undefined
        })
        cleanedCount++
        
        // Show progress every 100 items
        if (cleanedCount % 100 === 0) {
          console.log(`Progress: ${cleanedCount}/${options.length}`)
        }
      }
    } catch (error) {
      console.error(`Failed to clean option ${option.id}:`, error)
      failedCount++
    }
  }
  
  console.log(`\n📊 Analysis Complete:`)
  console.log(`  - Options to clean: ${updates.length}`)
  console.log(`  - Failed to process: ${failedCount}`)
  
  if (updates.length > 0) {
    console.log(`\n📝 Sample of changes (first 10):`)
    updates.slice(0, 10).forEach((update, i) => {
      console.log(`\n  ${i + 1}. Option ID: ${update.id}`)
      if (update.questionCode) {
        console.log(`     Question: ${update.questionCode}`)
      }
      console.log(`     Original: ${update.original}`)
      console.log(`     Cleaned: "${update.cleaned}"`)
    })
    
    // Ask for confirmation
    console.log(`\n⚠️  Ready to update ${updates.length} answer options.`)
    console.log(`   Run with --apply flag to apply changes.`)
    
    // Check if we should apply changes
    const shouldApply = process.argv.includes('--apply')
    
    if (shouldApply) {
      console.log('\n✅ Applying changes...')
      
      let successCount = 0
      let updateErrors = 0
      
      for (const update of updates) {
        try {
          await prisma.answerOption.update({
            where: { id: update.id },
            data: { text: update.cleaned }
          })
          successCount++
          
          if (successCount % 100 === 0) {
            console.log(`  Updated ${successCount}/${updates.length}`)
          }
        } catch (error) {
          console.error(`Failed to update option ${update.id}:`, error)
          updateErrors++
        }
      }
      
      console.log(`\n🎉 Successfully updated ${successCount} answer options!`)
      if (updateErrors > 0) {
        console.log(`⚠️  Failed to update ${updateErrors} options`)
      }
    } else {
      console.log('\n💡 To apply these changes, run:')
      console.log('   npx tsx scripts/clean-answer-choices.ts --apply')
    }
  } else {
    console.log('\n✅ No answer options need cleaning!')
  }
  
  await prisma.$disconnect()
}

// Also check for questions with similar issues
async function checkQuestions() {
  console.log('\n🔍 Checking questions for similar issues...')
  
  const questions = await prisma.questionBankItem.findMany({
    where: {
      OR: [
        { questionText: { contains: 'x-data' } },
        { questionText: { contains: '$store.data' } },
        { explanation: { contains: 'x-data' } },
        { explanation: { contains: '$store.data' } }
      ]
    },
    select: {
      id: true,
      questionCode: true,
      questionText: true,
      subject: true
    }
  })
  
  if (questions.length > 0) {
    console.log(`\n⚠️  Found ${questions.length} questions with similar issues`)
    console.log('   These may also need cleaning.')
    
    // Show sample
    questions.slice(0, 3).forEach((q, i) => {
      console.log(`\n   ${i + 1}. Question ${q.questionCode || q.id}`)
      console.log(`      Subject: ${q.subject}`)
      console.log(`      Text preview: ${q.questionText.substring(0, 100)}...`)
    })
  } else {
    console.log('   ✅ No questions found with template code issues')
  }
}

// Run the cleanup
cleanAnswerChoices()
  .then(() => checkQuestions())
  .catch(console.error)
  .finally(() => process.exit())