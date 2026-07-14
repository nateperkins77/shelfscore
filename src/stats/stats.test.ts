import { describe, expect, it } from 'vitest'
import type { Book } from '../types/book'
import {
  authorCounts,
  averageRating,
  averageRatingByGenre,
  booksOverTime,
  booksOverTimeSeries,
  genreCounts,
  goalProgress,
  librarySummary,
  mostReadAuthorsChartData,
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

describe('mostReadAuthorsChartData', () => {
  it('breaks out a single-book author rated 4.5+ instead of folding them into Other', () => {
    const books = [
      book({ author: 'Top A' }),
      book({ author: 'Top A' }),
      book({ author: 'Top B' }),
      book({ author: 'Top B' }),
      book({ author: 'Top C' }),
      book({ author: 'Top C' }),
      book({ author: 'Top D' }),
      book({ author: 'Top D' }),
      book({ author: 'Top E' }),
      book({ author: 'Top E' }),
      book({ author: 'One-Hit Wonder', rating: 4.75 }),
      book({ author: 'Mediocre One-Off', rating: 3 }),
    ]
    const result = mostReadAuthorsChartData(books, 5)
    expect(result).toEqual([
      { name: 'Top A', count: 2 },
      { name: 'Top B', count: 2 },
      { name: 'Top C', count: 2 },
      { name: 'Top D', count: 2 },
      { name: 'Top E', count: 2 },
      { name: 'One-Hit Wonder', count: 1 },
      { name: 'Other', count: 1 },
    ])
  })

  it('folds an unrated or sub-4.5 single-book author into Other, not its own slice', () => {
    const books = [
      book({ author: 'Top A' }),
      book({ author: 'Top A' }),
      book({ author: 'Low Rated', rating: 4 }),
      book({ author: 'Unrated' }),
    ]
    const result = mostReadAuthorsChartData(books, 1)
    expect(result).toEqual([
      { name: 'Top A', count: 2 },
      { name: 'Other', count: 2 },
    ])
  })

  it('omits Other entirely when nothing is left over', () => {
    const books = [book({ author: 'Solo Author' })]
    expect(mostReadAuthorsChartData(books, 5)).toEqual([{ name: 'Solo Author', count: 1 }])
  })
})

describe('goalProgress', () => {
  it('counts only books finished in the given year, against that year\'s targets', () => {
    const books = [
      book({ finishDate: '2026-02-01', pageCount: 300 }),
      book({ finishDate: '2026-06-15', pageCount: 200 }),
      book({ finishDate: '2025-12-31', pageCount: 400 }),
      book({ pageCount: 100 }), // no finish date — not "completed"
    ]
    const progress = goalProgress(books, { year: 2026, booksTarget: 20, pagesTarget: 6000 }, 2026)
    expect(progress).toEqual({ year: 2026, booksTarget: 20, booksCompleted: 2, pagesTarget: 6000, pagesCompleted: 500 })
  })

  it('leaves targets undefined when no goal is set for the year, but still counts completions', () => {
    const books = [book({ finishDate: '2026-01-05', pageCount: 250 })]
    const progress = goalProgress(books, undefined, 2026)
    expect(progress.booksTarget).toBeUndefined()
    expect(progress.pagesTarget).toBeUndefined()
    expect(progress.booksCompleted).toBe(1)
    expect(progress.pagesCompleted).toBe(250)
  })

  it('treats a book with no page count as contributing 0 pages, not skipping it', () => {
    const books = [book({ finishDate: '2026-01-05' })]
    expect(goalProgress(books, undefined, 2026).pagesCompleted).toBe(0)
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
