import type { Book } from '../types/book'

export interface CountEntry {
  name: string
  count: number
}

function countBy(books: Book[], key: (b: Book) => string): CountEntry[] {
  const counts = new Map<string, number>()
  for (const book of books) {
    const k = key(book)
    if (!k) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function authorCounts(books: Book[]): CountEntry[] {
  return countBy(books, (b) => b.author)
}

export function genreCounts(books: Book[]): CountEntry[] {
  return countBy(books, (b) => b.genre)
}

export interface RatingBucket {
  label: string
  min: number
  max: number
  count: number
}

/** Buckets ratings into (min, max] ranges, except the first bucket which includes 1. */
export function ratingDistribution(books: Book[]): RatingBucket[] {
  const buckets: RatingBucket[] = [
    { label: '1–2', min: 1, max: 2, count: 0 },
    { label: '2–3', min: 2, max: 3, count: 0 },
    { label: '3–4', min: 3, max: 4, count: 0 },
    { label: '4–5', min: 4, max: 5, count: 0 },
  ]
  for (const book of books) {
    if (book.rating == null) continue
    const bucket =
      buckets.find((b) => book.rating! > b.min && book.rating! <= b.max) ??
      (book.rating <= buckets[0].min ? buckets[0] : undefined)
    if (bucket) bucket.count += 1
  }
  return buckets
}

export function averageRating(books: Book[]): number | undefined {
  const rated = books.filter((b) => b.rating != null)
  if (rated.length === 0) return undefined
  return rated.reduce((sum, b) => sum + b.rating!, 0) / rated.length
}

export interface AverageEntry {
  name: string
  average: number
  count: number
}

function averageByKey(books: Book[], key: (b: Book) => string): AverageEntry[] {
  const groups = new Map<string, number[]>()
  for (const book of books) {
    if (book.rating == null) continue
    const k = key(book)
    if (!k) continue
    const ratings = groups.get(k) ?? []
    ratings.push(book.rating)
    groups.set(k, ratings)
  }
  return [...groups.entries()]
    .map(([name, ratings]) => ({
      name,
      average: ratings.reduce((s, r) => s + r, 0) / ratings.length,
      count: ratings.length,
    }))
    .sort((a, b) => b.average - a.average)
}

export function averageRatingByGenre(books: Book[]): AverageEntry[] {
  return averageByKey(books, (b) => b.genre)
}

export function averageRatingByAuthor(books: Book[]): AverageEntry[] {
  return averageByKey(books, (b) => b.author)
}

export interface MonthCount {
  /** 'YYYY-MM' */
  month: string
  count: number
}

/** Counts books by finish-date month. Books without a finish date are excluded from this chart only. */
export function booksOverTime(books: Book[]): MonthCount[] {
  const counts = new Map<string, number>()
  for (const book of books) {
    if (!book.finishDate) continue
    const month = book.finishDate.slice(0, 7)
    counts.set(month, (counts.get(month) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export type TimeRange = 'week' | 'month' | 'year' | 'all'

export interface SeriesPoint {
  key: string
  label: string
  count: number
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatDayLabel(d: Date): string {
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTH_ABBR[m - 1]} '${String(y).slice(2)}`
}

function fillMonthlyRange(books: Book[], startKey: string, endKey: string): SeriesPoint[] {
  const counts = new Map<string, number>()
  for (const book of books) {
    if (!book.finishDate) continue
    const key = book.finishDate.slice(0, 7)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const points: SeriesPoint[] = []
  let [y, m] = startKey.split('-').map(Number)
  const [endY, endM] = endKey.split('-').map(Number)
  while (y < endY || (y === endY && m <= endM)) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    points.push({ key, label: formatMonthLabel(key), count: counts.get(key) ?? 0 })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return points
}

/**
 * Books-read-over-time as a zero-filled series for a given range, so the line chart
 * never skips gaps. 'week'/'month' bucket by day; 'year'/'all' bucket by month.
 * Books without a finish date are excluded from this chart only (per spec).
 */
export function booksOverTimeSeries(books: Book[], range: TimeRange, now: Date = new Date()): SeriesPoint[] {
  const finished = books.filter((b) => b.finishDate)

  if (range === 'all') {
    if (finished.length === 0) return []
    const months = finished.map((b) => b.finishDate!.slice(0, 7)).sort()
    return fillMonthlyRange(finished, months[0], months[months.length - 1])
  }

  if (range === 'year') {
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    return fillMonthlyRange(finished, monthKey(start), monthKey(now))
  }

  const days = range === 'week' ? 7 : 30
  const counts = new Map<string, number>()
  for (const book of finished) {
    counts.set(book.finishDate!, (counts.get(book.finishDate!) ?? 0) + 1)
  }
  const points: SeriesPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    points.push({ key, label: formatDayLabel(d), count: counts.get(key) ?? 0 })
  }
  return points
}

export interface LibrarySummary {
  totalBooks: number
  totalPages?: number
  longestBook?: Book
  shortestBook?: Book
}

export function librarySummary(books: Book[]): LibrarySummary {
  const withPages = books.filter((b) => b.pageCount != null)
  if (withPages.length === 0) return { totalBooks: books.length }
  return {
    totalBooks: books.length,
    totalPages: withPages.reduce((sum, b) => sum + b.pageCount!, 0),
    longestBook: withPages.reduce((a, b) => (b.pageCount! > a.pageCount! ? b : a)),
    shortestBook: withPages.reduce((a, b) => (b.pageCount! < a.pageCount! ? b : a)),
  }
}
