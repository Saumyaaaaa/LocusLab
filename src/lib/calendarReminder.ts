// Client-side iCalendar (.ics) generator scheduling 23-hour and 7-day memory tests with reminder alarms.

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates and triggers download of a standardized .ics calendar file containing
 * two separate study return reminder events (23-hour and 7-day) with 30-minute alarms.
 */
export function downloadCalendarReminder(participantCode: string, completedAtIso?: string) {
  const baseTime = completedAtIso ? new Date(completedAtIso) : new Date();

  // Event 1: 23 hours later (15 min test window)
  const time23hStart = new Date(baseTime.getTime() + 23 * 60 * 60 * 1000);
  const time23hEnd = new Date(time23hStart.getTime() + 15 * 60 * 1000);

  // Event 2: 7 days later (15 min test window)
  const time7dStart = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000);
  const time7dEnd = new Date(time7dStart.getTime() + 15 * 60 * 1000);

  const returnUrl = `${window.location.origin}/return?code=${participantCode}`;

  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Locus Lab//Citizen Science Memory Experiment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',

    // --- EVENT 1: 23-HOUR RETURN TEST ---
    'BEGIN:VEVENT',
    `UID:locuslab-23h-${participantCode}-${baseTime.getTime()}@${host}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(time23hStart)}`,
    `DTEND:${formatIcsDate(time23hEnd)}`,
    'SUMMARY:Locus Lab: 24-Hour Memory Recall Test (5 mins)',
    `DESCRIPTION:Time for your primary long-term memory return test! Please open this return link in the SAME BROWSER you used for Session 1: ${returnUrl} (Your Code: ${participantCode})`,
    `URL:${returnUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Locus Lab 24-hour test starting in 30 minutes',
    'END:VALARM',
    'END:VEVENT',

    // --- EVENT 2: 7-DAY RETURN TEST ---
    'BEGIN:VEVENT',
    `UID:locuslab-7d-${participantCode}-${baseTime.getTime()}@${host}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(time7dStart)}`,
    `DTEND:${formatIcsDate(time7dEnd)}`,
    'SUMMARY:Locus Lab: 7-Day Final Memory Test (5 mins)',
    `DESCRIPTION:Time for your final memory retention test after 1 week! Please open this link in the SAME BROWSER: ${returnUrl} (Your Code: ${participantCode})`,
    `URL:${returnUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Locus Lab 7-day test starting in 30 minutes',
    'END:VALARM',
    'END:VEVENT',

    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `locus-lab-reminders-${participantCode}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
