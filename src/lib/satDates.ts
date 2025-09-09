export interface SATDate {
  testDate: Date
  registrationDeadline: Date
  lateRegistrationDeadline: Date
  year: number
}

export const SAT_DATES: SATDate[] = [
  {
    testDate: new Date('2025-08-23'),
    registrationDeadline: new Date('2025-08-08'),
    lateRegistrationDeadline: new Date('2025-08-12'),
    year: 2025
  },
  {
    testDate: new Date('2025-09-13'),
    registrationDeadline: new Date('2025-08-29'),
    lateRegistrationDeadline: new Date('2025-09-02'),
    year: 2025
  },
  {
    testDate: new Date('2025-10-04'),
    registrationDeadline: new Date('2025-09-19'),
    lateRegistrationDeadline: new Date('2025-09-23'),
    year: 2025
  },
  {
    testDate: new Date('2025-11-08'),
    registrationDeadline: new Date('2025-10-24'),
    lateRegistrationDeadline: new Date('2025-10-28'),
    year: 2025
  },
  {
    testDate: new Date('2025-12-06'),
    registrationDeadline: new Date('2025-11-21'),
    lateRegistrationDeadline: new Date('2025-11-25'),
    year: 2025
  },
  {
    testDate: new Date('2026-03-14'),
    registrationDeadline: new Date('2026-02-27'),
    lateRegistrationDeadline: new Date('2026-03-03'),
    year: 2026
  },
  {
    testDate: new Date('2026-05-02'),
    registrationDeadline: new Date('2026-04-17'),
    lateRegistrationDeadline: new Date('2026-04-21'),
    year: 2026
  },
  {
    testDate: new Date('2026-06-06'),
    registrationDeadline: new Date('2026-05-22'),
    lateRegistrationDeadline: new Date('2026-05-26'),
    year: 2026
  }
]

export const REGISTRATION_URL = 'https://mysat.collegeboard.org/dashboard'

export function getNextSATDate(): SATDate | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return SAT_DATES.find(date => date.testDate >= today) || null
}

export function getUpcomingSATDates(limit: number = 3): SATDate[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return SAT_DATES
    .filter(date => date.testDate >= today)
    .slice(0, limit)
}

export function getDaysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  
  const diffTime = date.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getRegistrationStatus(satDate: SATDate): {
  status: 'early' | 'open' | 'closing' | 'late' | 'closed'
  message: string
  color: string
  daysUntilDeadline: number
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const daysUntilReg = getDaysUntil(satDate.registrationDeadline)
  const daysUntilLate = getDaysUntil(satDate.lateRegistrationDeadline)
  const daysUntilTest = getDaysUntil(satDate.testDate)
  
  // More than 30 days before test
  if (daysUntilTest > 30) {
    return {
      status: 'early',
      message: `Registration opens soon`,
      color: 'blue',
      daysUntilDeadline: daysUntilReg
    }
  }
  
  // Registration is open
  if (daysUntilReg > 7) {
    return {
      status: 'open',
      message: `Registration open`,
      color: 'green',
      daysUntilDeadline: daysUntilReg
    }
  }
  
  // Registration closing soon (within 7 days)
  if (daysUntilReg > 0) {
    return {
      status: 'closing',
      message: `Register by ${satDate.registrationDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      color: 'yellow',
      daysUntilDeadline: daysUntilReg
    }
  }
  
  // Late registration period
  if (daysUntilLate > 0) {
    return {
      status: 'late',
      message: `Late registration (fees apply)`,
      color: 'orange',
      daysUntilDeadline: daysUntilLate
    }
  }
  
  // Registration closed
  return {
    status: 'closed',
    message: `Registration closed`,
    color: 'red',
    daysUntilDeadline: 0
  }
}

export function formatTestDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export function needsDeviceReminder(satDate: SATDate): boolean {
  const daysUntilTest = getDaysUntil(satDate.testDate)
  return daysUntilTest === 30 || daysUntilTest === 31
}