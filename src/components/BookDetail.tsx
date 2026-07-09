import { useState } from 'react'
import type { Book } from '../types/book'
import { resolveCoverUrl } from '../lib/openLibrary'
import { fileToResizedDataUrl } from '../lib/image'
import RatingInput from './RatingInput'

interface BookDetailProps {
  book: Book
  onSave: (book: Book) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function BookDetail({ book, onSave, onDelete, onClose }: BookDetailProps) {
  const [draft, setDraft] = useState<Book>(book)

  function update<K extends keyof Book>(key: K, value: Book[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    onSave(draft)
  }

  function handleDelete() {
    if (confirm(`Delete "${draft.title}"? This can't be undone.`)) {
      onDelete(draft.id)
    }
  }

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    update('customCoverData', await fileToResizedDataUrl(file))
    e.target.value = ''
  }

  const coverUrl = resolveCoverUrl(draft, 'L')

  return (
    <form className="book-form book-detail" onSubmit={handleSave}>
      <button type="button" className="back-link" onClick={onClose}>
        ← Back to library
      </button>

      <div className="cover-editor">
        {coverUrl ? (
          <img className="book-cover-preview" src={coverUrl} alt="" />
        ) : (
          <div className="book-cover-preview book-cover-preview-placeholder" />
        )}
        <div className="cover-editor-actions">
          <label className="cover-upload-button">
            {draft.customCoverData ? 'Replace cover' : 'Upload cover'}
            <input type="file" accept="image/*" hidden onChange={handleCoverFile} />
          </label>
          {draft.customCoverData && (
            <button type="button" onClick={() => update('customCoverData', undefined)}>
              Use looked-up cover
            </button>
          )}
        </div>
      </div>

      <label>
        Title
        <input value={draft.title} onChange={(e) => update('title', e.target.value)} required />
      </label>
      <label>
        Author
        <input value={draft.author} onChange={(e) => update('author', e.target.value)} required />
      </label>
      <label>
        Genre
        <input value={draft.genre} onChange={(e) => update('genre', e.target.value)} />
      </label>
      {/* A plain div, not <label> — see the same note in AddBook.tsx. */}
      <div className="field">
        Rating
        <RatingInput value={draft.rating} onChange={(v) => update('rating', v)} />
      </div>
      <label>
        Notes
        <textarea value={draft.notes ?? ''} onChange={(e) => update('notes', e.target.value)} />
      </label>
      <label>
        Start date
        <input type="date" value={draft.startDate ?? ''} onChange={(e) => update('startDate', e.target.value)} />
      </label>
      <label>
        Finish date
        <input type="date" value={draft.finishDate ?? ''} onChange={(e) => update('finishDate', e.target.value)} />
      </label>

      <div className="form-actions">
        <button type="submit">Save changes</button>
        <button type="button" className="danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </form>
  )
}
