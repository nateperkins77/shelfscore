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

/** Best-effort genre guess from Open Library's subject tags — expected to need manual correction. */
export function guessGenre(subjects: string[] | undefined): string {
  return subjects?.[0] ?? ''
}
