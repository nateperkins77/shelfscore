import { useState } from 'react'
import type { Book } from '../types/book'
import { createBookId } from '../types/book'
import { getCoverUrl, guessGenre, resolveCoverUrl, searchBooks, type OpenLibrarySearchResult } from '../lib/openLibrary'
import { fileToResizedDataUrl } from '../lib/image'
import RatingInput from './RatingInput'

interface AddBookProps {
  onSave: (book: Book) => void
}

interface FormState {
  title: string
  author: string
  genre: string
  coverId?: number
  customCoverData?: string
  publishYear?: number
  rating?: number
  notes: string
  startDate: string
  finishDate: string
}

const BLANK_FORM: FormState = {
  title: '',
  author: '',
  genre: '',
  notes: '',
  startDate: '',
  finishDate: '',
}

export default function AddBook({ onSave }: AddBookProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OpenLibrarySearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [source, setSource] = useState<'lookup' | 'manual'>('lookup')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      setResults(await searchBooks(query))
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  function handleSelectResult(result: OpenLibrarySearchResult) {
    setSource('lookup')
    setForm({
      ...BLANK_FORM,
      title: result.title,
      author: result.author,
      genre: guessGenre(result.subjects),
      coverId: result.coverId,
      publishYear: result.firstPublishYear,
    })
  }

  function handleSkipLookup() {
    setSource('manual')
    setForm({ ...BLANK_FORM })
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    updateForm('customCoverData', await fileToResizedDataUrl(file))
    e.target.value = ''
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !form.title.trim() || !form.author.trim()) return
    const book: Book = {
      id: createBookId(),
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre.trim(),
      coverId: form.coverId,
      customCoverData: form.customCoverData,
      publishYear: form.publishYear,
      rating: form.rating,
      notes: form.notes.trim() || undefined,
      startDate: form.startDate || undefined,
      finishDate: form.finishDate || undefined,
      dateAdded: new Date().toISOString(),
      source,
    }
    onSave(book)
    setForm(null)
    setResults([])
    setQuery('')
  }

  if (form) {
    const coverUrl = resolveCoverUrl(form)
    return (
      <form className="book-form" onSubmit={handleSave}>
        <h2>{source === 'lookup' ? 'Confirm book details' : 'Enter book manually'}</h2>

        <div className="cover-editor">
          {coverUrl ? (
            <img className="book-cover-preview" src={coverUrl} alt="" />
          ) : (
            <div className="book-cover-preview book-cover-preview-placeholder" />
          )}
          <div className="cover-editor-actions">
            <label className="cover-upload-button">
              {form.customCoverData ? 'Replace cover' : 'Upload cover'}
              <input type="file" accept="image/*" hidden onChange={handleCoverFile} />
            </label>
            {form.customCoverData && (
              <button type="button" onClick={() => updateForm('customCoverData', undefined)}>
                Use looked-up cover
              </button>
            )}
          </div>
        </div>

        <label>
          Title
          <input value={form.title} onChange={(e) => updateForm('title', e.target.value)} required />
        </label>
        <label>
          Author
          <input value={form.author} onChange={(e) => updateForm('author', e.target.value)} required />
        </label>
        <label>
          Genre
          <input
            value={form.genre}
            onChange={(e) => updateForm('genre', e.target.value)}
            placeholder="e.g. Fantasy"
          />
        </label>
        {/* A plain div, not <label> — RatingInput contains a "Clear" <button>, and a
            <label> wrapping a non-labelable slider div alongside a real button forwards
            clicks on the slider to that button, wiping the rating right after it's set. */}
        <div className="field">
          Rating
          <RatingInput value={form.rating} onChange={(v) => updateForm('rating', v)} />
        </div>
        <label>
          Notes
          <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} />
        </label>
        <label>
          Start date
          <input type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} />
        </label>
        <label>
          Finish date
          <input type="date" value={form.finishDate} onChange={(e) => updateForm('finishDate', e.target.value)} />
        </label>

        <div className="form-actions">
          <button type="submit">Save book</button>
          <button type="button" onClick={() => setForm(null)}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="add-book">
      <form onSubmit={handleSearch} className="search-form">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author…"
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searchError && <p className="error">{searchError}</p>}

      <ul className="search-results">
        {results.map((result) => (
          <li key={result.key} onClick={() => handleSelectResult(result)}>
            {getCoverUrl(result.coverId, 'S') && (
              <img src={getCoverUrl(result.coverId, 'S')} alt="" className="cover-thumb" />
            )}
            <div>
              <div className="result-title">{result.title}</div>
              <div className="result-meta">
                {result.author}
                {result.firstPublishYear ? ` · ${result.firstPublishYear}` : ''}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" className="skip-lookup" onClick={handleSkipLookup}>
        Skip lookup / enter manually
      </button>
    </div>
  )
}
