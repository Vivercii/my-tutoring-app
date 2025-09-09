const fs = require('fs');

// Read the unfixed questions
const questions = JSON.parse(fs.readFileSync('unfixed_questions.json', 'utf8'));

console.log('Generating URLs for all 88 truncated questions:\n');
console.log('Question ID | URL');
console.log('------------|----');

// Generate URLs for each question
const urls = questions.map((q, index) => {
  // Extract the numeric part from the ID if needed
  // Using index + 1 as a simple question number, but you might need to map to actual OnePrep IDs
  const url = `https://oneprep.xyz/question/${2630 + index}/?question_set=exam&exam_id=25`;
  return {
    id: q.id,
    url: url,
    sectionTitle: q.sectionTitle,
    moduleTitle: q.moduleTitle
  };
});

// Output as markdown table
urls.forEach(item => {
  console.log(`${item.id} | ${item.url}`);
});

// Also save to a CSV file for easy import
const csvContent = 'Question ID,URL,Section,Module\n' + 
  urls.map(item => `${item.id},"${item.url}","${item.sectionTitle}","${item.moduleTitle}"`).join('\n');

fs.writeFileSync('truncated_questions_urls.csv', csvContent);
console.log('\nAlso saved to truncated_questions_urls.csv');

// Save as JSON too
fs.writeFileSync('truncated_questions_urls.json', JSON.stringify(urls, null, 2));
console.log('And saved to truncated_questions_urls.json');