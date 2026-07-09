import { describe, expect, it } from 'vitest'
import type { Book } from '../types/book'
import {
  authorCounts,
  averageRating,
  averageRatingByGenre,
  booksOverTime,
  booksOverTimeSeries,
  genreCounts,
  librarySummary,
  ratingDistribution,
} from './stats'

let nextId = 0
function book(overrides: Partial<Book>): Book {
  nextId += 1
  return {
    id: `book-${nextId}`,
    title: `Title ${nextId}`,
    author: 'Author A',
    genre: 'Fantasy',
    dateAdded: '2024-01-01T00:00:00.000Z',
    source: 'manual',
    ...overrides,
  }
}

describe('authorCounts', () => {
  it('ranks authors by number of books, descending', () => {
    const books = [
      book({ author: 'Ann Leckie' }),
      book({ author: 'Ann Leckie' }),
      book({ author: 'N.K. Jemisin' }),
    ]
    expect(authorCounts(books)).toEqual([
      { name: 'Ann Leckie', count: 2 },
      { name: 'N.K. Jemisin', count: 1 },
    ])
  })
})

describe('genreCounts', () => {
  it('counts one genre per book and ignores books with no genre set', () => {
    const books = [
      book({ genre: 'Fantasy' }),
      book({ genre: 'Sci-Fi' }),
      book({ genre: '' }),
    ]
    expect(genreCounts(books)).toEqual([
      { name: 'Fantasy', count: 1 },
      { name: 'Sci-Fi', count: 1 },
    ])
  })
})

describe('ratingDistribution', () => {
  it('buckets ratings into 1-2, 2-3, 3-4, 4-5 and skips unrated books', () => {
    const books = [
      book({ rating: 1 }),
      book({ rating: 2.5 }),
      book({ rating: 4.75 }),
      book({ rating: undefined }),
    ]
    const buckets = ratingDistribution(books)
    expect(buckets.find((b) => b.label === '1–2')?.count).toBe(1)
    expect(buckets.find((b) => b.label === '2–3')?.count).toBe(1)
    expect(buckets.find((b) => b.label === '4–5')?.count).toBe(1)
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(3)
  })
})

describe('averageRating', () => {
  it('averages only rated books', () => {
    const books = [book({ rating: 4 }), book({ rating: 2 }), book({ rating: undefined })]
    expect(averageRating(books)).toBe(3)
  })

  it('returns undefined when no books are rated', () => {
    expect(averageRating([book({ rating: undefined })])).toBeUndefined()
  })
})

describe('averageRatingByGenre', () => {
  it('groups average rating per genre', () => {
    const books = [
      book({ genre: 'Fantasy', rating: 5 }),
      book({ genre: 'Fantasy', rating: 3 }),
      book({ genre: 'Sci-Fi', rating: 4 }),
    ]
    expect(averageRatingByGenre(books)).toEqual([
      { name: 'Fantasy', average: 4, count: 2 },
      { name: 'Sci-Fi', average: 4, count: 1 },
    ])
  })
})

describe('booksOverTime', () => {
  it('groups by finish month and excludes books with no finish date', () => {
    const books = [
      book({ finishDate: '2024-03-15' }),
      book({ finishDate: '2024-03-02' }),
      book({ finishDate: '2024-04-01' }),
      book({ finishDate: undefined }),
    ]
    expect(booksOverTime(books)).toEqual([
      { month: '2024-03', count: 2 },
      { month: '2024-04', count: 1 },
    ])
  })
})

describe('booksOverTimeSeries', () => {
  const now = new Date('2024-06-15T12:00:00.000Z')

  it('zero-fills a 7-day window for range=week', () => {
    const books = [book({ finishDate: '2024-06-15' }), book({ finishDate: '2024-06-10' }), book({ finishDate: '2024-06-01' })]
    const series = booksOverTimeSeries(books, 'week', now)
    expect(series).toHaveLength(7)
    expect(series[0]).toEqual({ key: '2024-06-09', label: 'Jun 9', count: 0 })
    expect(series[5]).toEqual({ key: '2024-06-14', label: 'Jun 14', count: 0 })
    expect(series[6]).toEqual({ key: '2024-06-15', label: 'Jun 15', count: 1 })
    expect(series.reduce((sum, p) => sum + p.count, 0)).toBe(2) // 06-01 falls outside the 7-day window, 06-10 and 06-15 don't
  })

  it('zero-fills a 12-month window for range=year', () => {
    const books = [book({ finishDate: '2024-06-01' }), book({ finishDate: '2023-01-01' })]
    const series = booksOverTimeSeries(books, 'year', now)
    expect(series).toHaveLength(12)
    expect(series[series.length - 1]).toEqual({ key: '2024-06', label: "Jun '24", count: 1 })
    expect(series.reduce((sum, p) => sum + p.count, 0)).toBe(1) // 2023-01 falls outside the 12-month window
  })

  it('spans earliest to latest finish month for range=all, zero-filling gaps', () => {
    const books = [book({ finishDate: '2024-01-15' }), book({ finishDate: '2024-03-02' })]
    const series = booksOverTimeSeries(books, 'all', now)
    expect(series.map((p) => p.key)).toEqual(['2024-01', '2024-02', '2024-03'])
    expect(series.map((p) => p.count)).toEqual([1, 0, 1])
  })
})

describe('librarySummary', () => {
  it('computes totals and longest/shortest book from page counts', () => {
    const books = [
      book({ pageCount: 200 }),
      book({ pageCount: 500 }),
      book({ pageCount: undefined }),
    ]
    const summary = librarySummary(books)
    expect(summary.totalBooks).toBe(3)
    expect(summary.totalPages).toBe(700)
    expect(summary.longestBook?.pageCount).toBe(500)
    expect(summary.shortestBook?.pageCount).toBe(200)
  })
})
