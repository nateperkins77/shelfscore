export type BookSource = 'lookup' | 'manual'

export interface Book {
  id: string
  title: string
  author: string
  /** Single primary genre — see spec decision to keep genre one value, not multiple tags. */
  genre: string
  /** Open Library cover ID, used to build cover image URLs on demand. */
  coverId?: number
  /** User-uploaded cover (resized JPEG data URL), takes precedence over coverId when set. */
  customCoverData?: string
  /** 0–5 in 0.25 increments; undefined until the user rates it. */
  rating?: number
  notes?: string
  /** ISO date (yyyy-mm-dd) */
  startDate?: string
  /** ISO date (yyyy-mm-dd) */
  finishDate?: string
  pageCount?: number
  publishYear?: number
  /** ISO timestamp, set when the book is first logged. */
  dateAdded: string
  source: BookSource
}

export function createBookId(): string {
  return crypto.randomUUID()
}
