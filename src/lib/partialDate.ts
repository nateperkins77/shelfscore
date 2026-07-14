/**
 * Dates that only need to be precise enough to count toward a yearly goal — day and
 * month are optional, but a value can't have finer precision than its coarser fields
 * allow (a day without a month, or a month without a year, doesn't mean anything).
 * Stored as a plain string so every existing `.slice(0, 4)`/`.slice(0, 7)` prefix check
 * elsewhere in the app keeps working unchanged: 'YYYY', 'YYYY-MM', or 'YYYY-MM-DD'.
 */
export interface PartialDateParts {
  year?: number
  month?: number
  day?: number
}

export function parsePartialDate(value: string | undefined): PartialDateParts {
  if (!value) return {}
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Drops month when year is missing, and day when month is missing, rather than producing a malformed string. */
export function formatPartialDate(parts: PartialDateParts): string {
  if (!parts.year) return ''
  if (!parts.month) return String(parts.year)
  if (!parts.day) return `${parts.year}-${pad(parts.month)}`
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}
