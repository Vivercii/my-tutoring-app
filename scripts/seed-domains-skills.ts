import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// SAT Math domains and skills from the official guide
const satMathDomains = [
  {
    name: 'Algebra',
    code: 'ALG',
    description: 'Linear equations, inequalities, and systems',
    order: 1,
    skills: [
      { name: 'Solve a linear equation', meanImportance: 3.77, stdDeviation: 0.54 },
      { name: 'Interpret variables, constants, and/or terms in a linear equation', meanImportance: 3.73, stdDeviation: 0.59 },
      { name: 'Evaluate a linear expression', meanImportance: 3.71, stdDeviation: 0.61 },
      { name: 'Graph a linear equation', meanImportance: 3.71, stdDeviation: 0.63 },
      { name: 'Represent contexts using a linear expression or equation in one variable', meanImportance: 3.67, stdDeviation: 0.66 },
      { name: 'Represent contexts using a linear equation in two variables', meanImportance: 3.26, stdDeviation: 0.91 },
      { name: 'Graph a linear inequality', meanImportance: 3.06, stdDeviation: 0.95 },
      { name: 'Solve a system of two linear equations', meanImportance: 2.96, stdDeviation: 0.98 },
      { name: 'Represent contexts using a system of linear equations', meanImportance: 2.93, stdDeviation: 0.96 },
      { name: 'Graph a system of two linear equations', meanImportance: 2.86, stdDeviation: 0.99 },
      { name: 'Represent contexts using a linear inequality in one or two variables', meanImportance: 2.82, stdDeviation: 0.95 },
      { name: 'Represent contexts using a system of linear inequalities', meanImportance: 2.39, stdDeviation: 0.92 },
      { name: 'Graph a system of two linear inequalities', meanImportance: 2.30, stdDeviation: 1.00 },
    ]
  },
  {
    name: 'Advanced Math',
    code: 'ADV',
    description: 'Quadratics, polynomials, exponentials, and functions',
    order: 2,
    skills: [
      { name: 'Isolate one variable in terms of other variables of an equation', meanImportance: 3.59, stdDeviation: 0.71 },
      { name: 'Add, subtract, and multiply polynomials', meanImportance: 3.55, stdDeviation: 0.78 },
      { name: 'Understand numbers and number systems, including radicals and exponents', meanImportance: 3.48, stdDeviation: 0.74 },
      { name: 'Evaluate a polynomial expression', meanImportance: 3.45, stdDeviation: 0.76 },
      { name: 'Use and interpret function notation', meanImportance: 3.34, stdDeviation: 0.93 },
      { name: 'Interpret variables, constants, and/or terms in a quadratic equation', meanImportance: 3.33, stdDeviation: 0.91 },
      { name: 'Factor polynomials', meanImportance: 3.32, stdDeviation: 0.93 },
      { name: 'Solve a quadratic equation', meanImportance: 3.31, stdDeviation: 0.91 },
      { name: 'Graph a quadratic equation', meanImportance: 3.22, stdDeviation: 0.98 },
      { name: 'Evaluate a rational or radical expression', meanImportance: 3.12, stdDeviation: 0.99 },
      { name: 'Evaluate an exponential expression', meanImportance: 3.04, stdDeviation: 0.98 },
      { name: 'Interpret variables, constants, and/or terms in an exponential equation', meanImportance: 2.90, stdDeviation: 0.99 },
      { name: 'Divide polynomials', meanImportance: 2.86, stdDeviation: 0.96 },
      { name: 'Solve a rational or radical equation in one variable', meanImportance: 2.79, stdDeviation: 0.95 },
      { name: 'Choose and produce equivalent forms of a quadratic or exponential equation', meanImportance: 2.66, stdDeviation: 0.94 },
      { name: 'Graph an exponential equation in one variable', meanImportance: 2.63, stdDeviation: 1.03 },
      { name: 'Represent contexts using a quadratic equation in two variables', meanImportance: 2.56, stdDeviation: 1.02 },
      { name: 'Graph a polynomial (degree three or higher) equation in one variable', meanImportance: 2.50, stdDeviation: 0.99 },
      { name: 'Solve a polynomial (degree three or higher) equation in one variable', meanImportance: 2.48, stdDeviation: 0.96 },
      { name: 'Solve a system of one linear equation and one nonlinear equation', meanImportance: 2.28, stdDeviation: 1.01 },
      { name: 'Represent contexts using an exponential equation in two variables', meanImportance: 2.27, stdDeviation: 1.02 },
    ]
  },
  {
    name: 'Problem-Solving and Data Analysis',
    code: 'PSA',
    description: 'Rates, ratios, percents, statistics, and probability',
    order: 3,
    skills: [
      { name: 'Solve problems with rates, ratios, and percents', meanImportance: 3.49, stdDeviation: 0.76 },
      { name: 'Understand absolute value of real numbers', meanImportance: 3.38, stdDeviation: 0.75 },
      { name: 'Understand elementary number theory (primes, factorization, divisibility)', meanImportance: 3.26, stdDeviation: 0.87 },
      { name: 'Use units and unit analysis to solve problems', meanImportance: 3.20, stdDeviation: 0.88 },
      { name: 'Identify and distinguish linear and exponential growth', meanImportance: 2.74, stdDeviation: 0.98 },
      { name: 'Given a scatterplot, model statistical data with a linear function', meanImportance: 2.65, stdDeviation: 1.12 },
      { name: 'Solve problems using measures of center (mean, median, mode)', meanImportance: 2.60, stdDeviation: 1.04 },
      { name: 'Read and interpret statistical graphs', meanImportance: 2.48, stdDeviation: 1.08 },
      { name: 'Solve problems using measures of spread (range, standard deviation)', meanImportance: 2.24, stdDeviation: 1.05 },
      { name: 'Solve problems using probability', meanImportance: 2.18, stdDeviation: 1.03 },
      { name: 'Solve problems using sample statistics and population parameters', meanImportance: 2.09, stdDeviation: 1.05 },
      { name: 'Given a scatterplot, model statistical data with a quadratic function', meanImportance: 2.09, stdDeviation: 1.02 },
      { name: 'Understand characteristics of well-designed studies', meanImportance: 2.06, stdDeviation: 1.01 },
      { name: 'Given a scatterplot, model statistical data with an exponential function', meanImportance: 2.03, stdDeviation: 0.97 },
    ]
  },
  {
    name: 'Geometry and Trigonometry',
    code: 'GEO',
    description: 'Area, volume, triangles, circles, and trigonometry',
    order: 4,
    skills: [
      { name: 'Solve problems using the Pythagorean theorem', meanImportance: 3.39, stdDeviation: 0.92 },
      { name: 'Solve problems using area and volume formulas', meanImportance: 3.35, stdDeviation: 0.75 },
      { name: 'Solve problems using special right triangles', meanImportance: 2.99, stdDeviation: 1.01 },
      { name: 'Solve problems using theorems of triangle similarity and congruence', meanImportance: 2.69, stdDeviation: 1.05 },
      { name: 'Solve problems using logical reasoning and mathematical proofs', meanImportance: 2.62, stdDeviation: 1.00 },
      { name: 'Solve problems using circle theorems', meanImportance: 2.52, stdDeviation: 1.01 },
      { name: 'Solve problems using trigonometry relationships (sine, cosine, tangent)', meanImportance: 2.50, stdDeviation: 1.19 },
    ]
  }
]

async function seedDomainsAndSkills() {
  console.log('🌱 Seeding domains and skills...')
  
  try {
    // Clear existing data
    await prisma.skill.deleteMany()
    await prisma.domain.deleteMany()
    
    // Insert domains and skills
    for (const domainData of satMathDomains) {
      const { skills, ...domainInfo } = domainData
      
      // Create domain
      const domain = await prisma.domain.create({
        data: domainInfo
      })
      
      console.log(`✅ Created domain: ${domain.name}`)
      
      // Create skills for this domain
      for (let i = 0; i < skills.length; i++) {
        const skill = await prisma.skill.create({
          data: {
            ...skills[i],
            domainId: domain.id,
            order: i + 1
          }
        })
        console.log(`  - Added skill: ${skill.name} (importance: ${skill.meanImportance})`)
      }
    }
    
    console.log('\n✅ Successfully seeded all domains and skills!')
    
    // Show summary
    const domainCount = await prisma.domain.count()
    const skillCount = await prisma.skill.count()
    console.log(`\n📊 Summary: ${domainCount} domains, ${skillCount} skills`)
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedDomainsAndSkills()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })