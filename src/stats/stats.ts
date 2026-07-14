import type { Book } from '../types/book'
import type { ReadingGoal } from '../types/goal'

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

/**
 * Author breakdown for the "most-read authors" chart. The top `topN` authors by
 * book count are always shown individually. Beyond that, an author with exactly
 * one book is normally folded into "Other" — but if that one book is rated 4.5+,
 * it's surfaced as its own slice instead, since a single outstanding read is
 * worth calling out rather than burying in the aggregate. Everyone else past the
 * cutoff is folded into "Other" as usual.
 */
export function mostReadAuthorsChartData(books: Book[], topN = 5): CountEntry[] {
  const counts = authorCounts(books)
  const head = counts.slice(0, topN)
  const rest = counts.slice(topN)

  const highlighted: CountEntry[] = []
  const otherRest: CountEntry[] = []
  for (const entry of rest) {
    const book = entry.count === 1 ? books.find((b) => b.author === entry.name) : undefined
    if (book && book.rating != null && book.rating >= 4.5) {
      highlighted.push(entry)
    } else {
      otherRest.push(entry)
    }
  }

  const otherTotal = otherRest.reduce((sum, e) => sum + e.count, 0)
  const result = [...head, ...highlighted]
  if (otherTotal > 0) result.push({ name: 'Other', count: otherTotal })
  return result
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
    // A year-only finishDate (e.g. '2026') can't be sliced into a 'YYYY-MM' key, so it's
    // excluded here — falling back to Jan/Dec of its year for the range bound only if
    // every finished book is that imprecise, so the chart still spans a sensible range
    // instead of the malformed key breaking fillMonthlyRange's y/m parsing.
    const withMonth = finished.filter((b) => b.finishDate!.length >= 7)
    let startKey: string
    let endKey: string
    if (withMonth.length > 0) {
      const months = withMonth.map((b) => b.finishDate!.slice(0, 7)).sort()
      startKey = months[0]
      endKey = months[months.length - 1]
    } else {
      const years = finished.map((b) => b.finishDate!.slice(0, 4)).sort()
      startKey = `${years[0]}-01`
      endKey = `${years[years.length - 1]}-12`
    }
    return fillMonthlyRange(finished, startKey, endKey)
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

export interface GoalProgress {
  year: number
  booksTarget: number | undefined
  booksCompleted: number
  pagesTarget: number | undefined
  pagesCompleted: number
}

/** Books/pages finished within `year` (by finishDate) against that year's goal, if one is set. */
export function goalProgress(books: Book[], goal: ReadingGoal | undefined, year: number): GoalProgress {
  const finishedThisYear = books.filter((b) => b.finishDate?.slice(0, 4) === String(year))
  return {
    year,
    booksTarget: goal?.booksTarget,
    booksCompleted: finishedThisYear.length,
    pagesTarget: goal?.pagesTarget,
    pagesCompleted: finishedThisYear.reduce((sum, b) => sum + (b.pageCount ?? 0), 0),
  }
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
