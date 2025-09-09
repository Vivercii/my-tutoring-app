const fetch = require('node-fetch');

async function runExtraction() {
  console.log('Starting enhanced Reading & Writing extraction...\n');
  
  try {
    // First, check current status
    console.log('📊 Checking current status...');
    const statusResponse = await fetch('http://localhost:3000/api/admin/fix-reading-writing-enhanced', {
      headers: {
        'Cookie': 'next-auth.session-token=your-session-token-here' // We'll need to get this from browser
      }
    });
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('Current statistics:');
      console.log(JSON.stringify(status.statistics, null, 2));
    }
    
    // Now run the extraction
    console.log('\n🚀 Running extraction (this may take a few minutes)...\n');
    const response = await fetch('http://localhost:3000/api/admin/fix-reading-writing-enhanced', {
      method: 'POST',
      headers: {
        'Cookie': 'next-auth.session-token=your-session-token-here' // We'll need to get this from browser
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      
      // If unauthorized, provide instructions
      if (response.status === 401) {
        console.log('\n📝 To run this script:');
        console.log('1. Log into the app in your browser');
        console.log('2. Open Developer Tools (F12)');
        console.log('3. Go to Application/Storage > Cookies');
        console.log('4. Find the "next-auth.session-token" cookie');
        console.log('5. Copy its value and replace "your-session-token-here" in this script');
        console.log('6. Run the script again');
      }
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ Extraction complete!\n');
    console.log('📈 Summary:');
    console.log(`- Total processed: ${result.summary.totalProcessed}`);
    console.log(`- Successfully fixed: ${result.summary.totalFixed}`);
    console.log(`- Skipped: ${result.summary.totalSkipped}`);
    console.log(`- Passages created: ${result.summary.passagesCreated}`);
    console.log(`- Total passages in DB: ${result.summary.totalPassagesInDB}`);
    console.log(`- Questions with passages: ${result.summary.questionsWithPassages}`);
    
    if (result.examples && result.examples.length > 0) {
      console.log('\n📚 Sample extractions:');
      result.examples.forEach((ex, i) => {
        console.log(`\n${i + 1}. Question ID: ${ex.questionId}`);
        console.log(`   Original length: ${ex.originalLength} chars`);
        console.log(`   Passage: ${ex.passagePreview}`);
        console.log(`   Question: ${ex.questionPreview}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to run extraction:', error.message);
  }
}

// Check if we're running directly
if (require.main === module) {
  runExtraction();
}

module.exports = { runExtraction };