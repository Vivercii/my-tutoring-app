const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModules() {
  const modules = await prisma.examModule.findMany({
    where: {
      section: {
        OR: [
          { title: { contains: 'Reading' } },
          { title: { contains: 'Writing' } }
        ]
      }
    },
    include: {
      section: {
        include: {
          exam: true
        }
      }
    },
    orderBy: [
      { sectionId: 'asc' },
      { order: 'asc' }
    ]
  });
  
  console.log('Current modules in database:');
  const byTest = {};
  
  modules.forEach(m => {
    const testNum = m.section.exam.examNumber;
    if (!byTest[testNum]) {
      byTest[testNum] = [];
    }
    byTest[testNum].push(m);
  });
  
  Object.keys(byTest).sort((a, b) => a - b).forEach(testNum => {
    console.log(`\nTest ${testNum}:`);
    byTest[testNum].forEach(m => {
      console.log(`  ${m.section.title} - Module ${m.order}${m.difficulty ? ` (${m.difficulty})` : ''} - Module ID: ${m.id}`);
    });
  });
  
  console.log(`\nTotal modules: ${modules.length}`);
}

checkModules()
  .catch(console.error)
  .finally(() => prisma.$disconnect());