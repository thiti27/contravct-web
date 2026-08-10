// Formats an ISO datetime string as "yyyy-mm-dd HH:mm:ss" in Asia/Bangkok time.
// Fixed to the app's own timezone (matching the server's DB session, see
// db/sequelize.js's timezone: '+07:00') rather than the viewer's browser/OS clock —
// a viewer whose machine isn't set to +07:00 would otherwise see a shifted time.
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const parts = Object.fromEntries(formatter.formatToParts(d).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}
