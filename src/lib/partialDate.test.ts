import { describe, expect, it } from 'vitest'
import { formatPartialDate, parsePartialDate } from './partialDate'

describe('parsePartialDate', () => {
  it('parses full, month, and year-only precision', () => {
    expect(parsePartialDate('2026-06-15')).toEqual({ year: 2026, month: 6, day: 15 })
    expect(parsePartialDate('2026-06')).toEqual({ year: 2026, month: 6, day: undefined })
    expect(parsePartialDate('2026')).toEqual({ year: 2026, month: undefined, day: undefined })
  })

  it('returns an empty object for an empty or undefined value', () => {
    expect(parsePartialDate('')).toEqual({})
    expect(parsePartialDate(undefined)).toEqual({})
  })
})

describe('formatPartialDate', () => {
  it('formats full precision when all three parts are present', () => {
    expect(formatPartialDate({ year: 2026, month: 6, day: 5 })).toBe('2026-06-05')
  })

  it('drops day when month is missing, and drops month when year is missing', () => {
    expect(formatPartialDate({ year: 2026, day: 5 })).toBe('2026')
    expect(formatPartialDate({ month: 6, day: 5 })).toBe('')
  })

  it('returns an empty string when nothing is set', () => {
    expect(formatPartialDate({})).toBe('')
  })

  it('pads single-digit month and day to two digits', () => {
    expect(formatPartialDate({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05')
  })
})
