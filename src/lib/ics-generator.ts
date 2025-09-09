import { ScheduledSession } from '@prisma/client'

interface CalendarEvent {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  location: string
  organizer?: string
  attendees?: string[]
}

/**
 * Generates an ICS (iCalendar) file content from an array of events
 */
export function generateICS(
  events: CalendarEvent[],
  calendarName: string,
  timezone: string = 'America/New_York'
): string {
  const lines: string[] = []
  
  // Calendar header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//UpstartPrep Tutoring//Calendar//EN')
  lines.push(`X-WR-CALNAME:${calendarName}`)
  lines.push(`X-WR-TIMEZONE:${timezone}`)
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  
  // Timezone definition
  lines.push('BEGIN:VTIMEZONE')
  lines.push(`TZID:${timezone}`)
  lines.push('BEGIN:DAYLIGHT')
  lines.push('TZOFFSETFROM:-0500')
  lines.push('TZOFFSETTO:-0400')
  lines.push('TZNAME:EDT')
  lines.push('DTSTART:19700308T020000')
  lines.push('RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU')
  lines.push('END:DAYLIGHT')
  lines.push('BEGIN:STANDARD')
  lines.push('TZOFFSETFROM:-0400')
  lines.push('TZOFFSETTO:-0500')
  lines.push('TZNAME:EST')
  lines.push('DTSTART:19701101T020000')
  lines.push('RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU')
  lines.push('END:STANDARD')
  lines.push('END:VTIMEZONE')
  
  // Add events
  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}@upstartprep.com`)
    lines.push(`DTSTAMP:${formatDateToICS(new Date())}`)
    lines.push(`DTSTART;TZID=${timezone}:${formatDateToICS(event.startTime)}`)
    lines.push(`DTEND;TZID=${timezone}:${formatDateToICS(event.endTime)}`)
    lines.push(`SUMMARY:${escapeICS(event.title)}`)
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }
    
    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`)
    }
    
    if (event.organizer) {
      lines.push(`ORGANIZER:mailto:${event.organizer}`)
    }
    
    if (event.attendees && event.attendees.length > 0) {
      event.attendees.forEach(attendee => {
        lines.push(`ATTENDEE:mailto:${attendee}`)
      })
    }
    
    // Add reminder 1 hour before
    lines.push('BEGIN:VALARM')
    lines.push('TRIGGER:-PT1H')
    lines.push('ACTION:DISPLAY')
    lines.push(`DESCRIPTION:Reminder: ${event.title} in 1 hour`)
    lines.push('END:VALARM')
    
    // Add reminder 15 minutes before
    lines.push('BEGIN:VALARM')
    lines.push('TRIGGER:-PT15M')
    lines.push('ACTION:DISPLAY')
    lines.push(`DESCRIPTION:Reminder: ${event.title} starting in 15 minutes`)
    lines.push('END:VALARM')
    
    lines.push('END:VEVENT')
  }
  
  lines.push('END:VCALENDAR')
  
  return lines.join('\r\n')
}

/**
 * Format a Date object to ICS date format (YYYYMMDDTHHMMSS)
 */
function formatDateToICS(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/**
 * Convert a scheduled session to a calendar event for student/parent view
 */
export function sessionToStudentEvent(
  session: any, // Using any for now to handle the full session with relations
  studentName: string
): CalendarEvent {
  const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
  const durationText = duration === 1 ? '1 hour' : `${duration} hours`
  
  return {
    id: session.id,
    title: `${session.tutor.tutorProfile?.subjects?.[0] || 'Tutoring'} with ${session.tutor.name}`,
    description: [
      `Student: ${studentName}`,
      `Tutor: ${session.tutor.name}`,
      `Duration: ${durationText}`,
      session.notes ? `Notes: ${session.notes}` : '',
      '',
      'Join Zoom: ' + (session.zoomLink || 'Link will be provided'),
      '',
      'Need to reschedule? Please give 24 hours notice.'
    ].filter(Boolean).join('\\n'),
    startTime: new Date(session.startTime),
    endTime: new Date(session.endTime),
    location: session.zoomLink || 'Online - Zoom link will be provided',
    organizer: session.tutor.email,
    attendees: [studentName]
  }
}

/**
 * Convert a scheduled session to a calendar event for tutor view
 */
export function sessionToTutorEvent(
  session: any // Using any for now to handle the full session with relations
): CalendarEvent {
  const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
  const durationText = duration === 1 ? '1 hour' : `${duration} hours`
  
  // Abbreviate student name for privacy (e.g., "John D.")
  const studentName = session.studentProfile?.student?.name || 'Student'
  const abbreviatedName = studentName.split(' ').map((n: string, i: number) => 
    i === 0 ? n : n[0] + '.'
  ).join(' ')
  
  return {
    id: session.id,
    title: `${session.tutor.tutorProfile?.subjects?.[0] || 'Tutoring'} - ${abbreviatedName}`,
    description: [
      `Student: ${abbreviatedName}`,
      `Duration: ${durationText}`,
      session.notes ? `Notes: ${session.notes}` : '',
      '',
      'Join Zoom: ' + (session.zoomLink || 'Link will be provided')
    ].filter(Boolean).join('\\n'),
    startTime: new Date(session.startTime),
    endTime: new Date(session.endTime),
    location: session.zoomLink || 'Online - Zoom link will be provided',
    organizer: session.tutor.email,
    attendees: [session.studentProfile?.student?.email].filter(Boolean)
  }
}