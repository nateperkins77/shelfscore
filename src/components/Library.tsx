import { useMemo, useState } from 'react'
import type { Book } from '../types/book'
import { resolveCoverUrl } from '../lib/openLibrary'

interface LibraryProps {
  books: Book[]
  onSelectBook: (id: string) => void
}

type SortKey = 'dateAdded' | 'title' | 'author' | 'rating' | 'finishDate'

export default function Library({ books, onSelectBook }: LibraryProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('dateAdded')
  const [genreFilter, setGenreFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [minRating, setMinRating] = useState(0)

  const genres = useMemo(() => [...new Set(books.map((b) => b.genre).filter(Boolean))].sort(), [books])
  const authors = useMemo(() => [...new Set(books.map((b) => b.author).filter(Boolean))].sort(), [books])

  const visibleBooks = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = books.filter((b) => {
      if (genreFilter && b.genre !== genreFilter) return false
      if (authorFilter && b.author !== authorFilter) return false
      if ((b.rating ?? 0) < minRating) return false
      if (term && !`${b.title} ${b.author}`.toLowerCase().includes(term)) return false
      return true
    })
    return filtered.sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'author':
          return a.author.localeCompare(b.author)
        case 'rating':
          return (b.rating ?? 0) - (a.rating ?? 0)
        case 'finishDate':
          return (b.finishDate ?? '').localeCompare(a.finishDate ?? '')
        case 'dateAdded':
        default:
          return b.dateAdded.localeCompare(a.dateAdded)
      }
    })
  }, [books, search, sortKey, genreFilter, authorFilter, minRating])

  return (
    <div className="library">
      <div className="library-controls">
        <input
          placeholder="Find a book…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="dateAdded">Sort: date added</option>
          <option value="title">Sort: title</option>
          <option value="author">Sort: author</option>
          <option value="rating">Sort: rating</option>
          <option value="finishDate">Sort: finish date</option>
        </select>
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)}>
          <option value="">All authors</option>
          {authors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <label className="min-rating">
          Min rating {minRating}
          <input
            type="range"
            min={0}
            max={5}
            step={0.25}
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
          />
        </label>
      </div>

      {visibleBooks.length === 0 ? (
        <p className="empty-state">No books match yet — try adjusting filters, or add a book.</p>
      ) : (
        <div className="book-grid">
          {visibleBooks.map((book) => (
            <button key={book.id} className="book-card" onClick={() => onSelectBook(book.id)}>
              {resolveCoverUrl(book, 'M') ? (
                <img src={resolveCoverUrl(book, 'M')} alt="" className="book-card-cover" />
              ) : (
                <div className="book-card-cover book-card-cover-placeholder" />
              )}
              <div className="book-card-title">{book.title}</div>
              <div className="book-card-author">{book.author}</div>
              <div className="book-card-meta">
                {book.genre && <span className="book-card-genre">{book.genre}</span>}
                {book.rating != null && <span className="book-card-rating">★ {book.rating}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
