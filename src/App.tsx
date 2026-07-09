import { useEffect, useRef, useState } from 'react'
import type { Book } from './types/book'
import { deleteBook, exportLibrary, getAllBooks, importLibrary, saveBook } from './lib/db'
import AddBook from './components/AddBook'
import Library from './components/Library'
import BookDetail from './components/BookDetail'
import StatsDashboard from './components/StatsDashboard'
import Logo from './components/Logo'
import './App.css'

type View = 'library' | 'add' | 'detail' | 'stats'

export default function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [view, setView] = useState<View>('library')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getAllBooks().then(setBooks)
  }, [])

  async function handleBookAdded(book: Book) {
    await saveBook(book)
    setBooks((prev) => [...prev, book])
    setView('library')
  }

  async function handleSaveBook(book: Book) {
    await saveBook(book)
    setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)))
    setView('library')
    setSelectedId(null)
  }

  async function handleDeleteBook(id: string) {
    await deleteBook(id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
    setView('library')
    setSelectedId(null)
  }

  function handleSelectBook(id: string) {
    setSelectedId(id)
    setView('detail')
  }

  async function handleExport() {
    const json = await exportLibrary()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `book-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await importLibrary(text)
    setBooks(await getAllBooks())
    e.target.value = ''
  }

  const selectedBook = selectedId ? books.find((b) => b.id === selectedId) : undefined

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <Logo />
          <h1 className="brand-wordmark">
            shelf<span className="brand-score">score</span>
          </h1>
        </div>
        <nav className="nav-tabs">
          <button className={view === 'library' ? 'active' : ''} onClick={() => setView('library')}>
            Library
          </button>
          <button className={view === 'add' ? 'active' : ''} onClick={() => setView('add')}>
            Add Book
          </button>
          <button className={view === 'stats' ? 'active' : ''} onClick={() => setView('stats')}>
            Stats
          </button>
        </nav>
        <div className="data-actions">
          <button onClick={handleExport}>Export</button>
          <button onClick={() => fileInputRef.current?.click()}>Import</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImportFile}
          />
        </div>
      </header>

      <main className="app-main">
        {view === 'library' && <Library books={books} onSelectBook={handleSelectBook} />}
        {view === 'add' && <AddBook onSave={handleBookAdded} />}
        {view === 'stats' && <StatsDashboard books={books} />}
        {view === 'detail' && selectedBook && (
          <BookDetail
            book={selectedBook}
            onSave={handleSaveBook}
            onDelete={handleDeleteBook}
            onClose={() => setView('library')}
          />
        )}
      </main>
    </div>
  )
}
