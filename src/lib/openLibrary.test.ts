import { describe, expect, it } from 'vitest'
import { guessGenre } from './openLibrary'

describe('guessGenre', () => {
  it('maps a matching subject onto the fixed genre list', () => {
    expect(guessGenre(['Science fiction', 'American fiction'])).toBe('Sci-Fi')
    expect(guessGenre(['Fantasy fiction', 'Magic'])).toBe('Fantasy')
    expect(guessGenre(['LitRPG', 'Fantasy'])).toBe('LitRPG')
  })

  it('prefers a more specific match over the generic "fiction" catch-all', () => {
    expect(guessGenre(['Historical fiction', 'War stories'])).toBe('Historical Fiction')
    expect(guessGenre(['Science fiction'])).toBe('Sci-Fi')
  })

  it('scans every subject, not just the first', () => {
    expect(guessGenre(['New York Times bestseller', 'Large type books', 'Horror'])).toBe('Horror')
  })

  it('maps newer additions to the genre list', () => {
    expect(guessGenre(['Graphic novels'])).toBe('Graphic Novel')
    expect(guessGenre(['Self-help techniques'])).toBe('Self-Help')
    expect(guessGenre(['American poetry'])).toBe('Poetry')
    expect(guessGenre(['Dystopias', 'Fiction'])).toBe('Dystopian')
  })

  it('returns an empty string when nothing matches or subjects are missing', () => {
    expect(guessGenre(['New York Times bestseller', 'Large type books'])).toBe('')
    expect(guessGenre(undefined)).toBe('')
    expect(guessGenre([])).toBe('')
  })
})
