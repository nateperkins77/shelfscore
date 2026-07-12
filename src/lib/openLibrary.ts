const SEARCH_URL = 'https://openlibrary.org/search.json'

export interface OpenLibrarySearchResult {
  key: string
  title: string
  author: string
  firstPublishYear?: number
  coverId?: number
  subjects?: string[]
}

export async function searchBooks(query: string): Promise<OpenLibrarySearchResult[]> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&fields=key,title,author_name,first_publish_year,cover_i,subject&limit=20`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`)
  const data = await res.json()
  const docs: any[] = data.docs ?? []
  return docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown author',
    firstPublishYear: doc.first_publish_year,
    coverId: doc.cover_i,
    subjects: doc.subject,
  }))
}

export function getCoverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M'): string | undefined {
  if (!coverId) return undefined
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

/** A user-uploaded cover always wins over the Open Library lookup cover. */
export function resolveCoverUrl(
  book: { coverId?: number; customCoverData?: string },
  size: 'S' | 'M' | 'L' = 'M',
): string | undefined {
  return book.customCoverData ?? getCoverUrl(book.coverId, size)
}

/**
 * Keyword -> fixed genre, checked in order, most specific first. "fiction" is
 * last since it's a substring of "science fiction" and "historical fiction".
 */
const GENRE_KEYWORDS: [string, string][] = [
  ['litrpg', 'LitRPG'],
  ['science fiction', 'Science Fiction'],
  ['sci-fi', 'Science Fiction'],
  ['fantasy', 'Fantasy'],
  ['horror', 'Horror'],
  ['thriller', 'Mystery & Thriller'],
  ['mystery', 'Mystery & Thriller'],
  ['detective', 'Mystery & Thriller'],
  ['romance', 'Romance'],
  ['historical fiction', 'Historical Fiction'],
  ['biography', 'Biography & Memoir'],
  ['autobiography', 'Biography & Memoir'],
  ['memoir', 'Biography & Memoir'],
  ['young adult', 'Young Adult'],
  ['juvenile fiction', 'Young Adult'],
  ['non-fiction', 'Non-Fiction'],
  ['nonfiction', 'Non-Fiction'],
  ['fiction', 'Fiction'],
]

/**
 * Best-effort genre guess mapped onto the app's fixed genre list, rather than
 * surfacing Open Library's raw subject tags (which run to things like "Large
 * type books" or "New York Times bestseller" and are more noise than signal).
 * Scans every subject rather than just the first, since the first tag is
 * often the least genre-relevant one. Returns '' when nothing matches, so
 * the user picks from the dropdown instead of getting a wrong guess.
 */
export function guessGenre(subjects: string[] | undefined): string {
  if (!subjects || subjects.length === 0) return ''
  const haystack = subjects.join(' | ').toLowerCase()
  for (const [keyword, genre] of GENRE_KEYWORDS) {
    if (haystack.includes(keyword)) return genre
  }
  return ''
}
