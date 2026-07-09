import type { Book } from '../types/book'

const DB_NAME = 'book-tracker'
const DB_VERSION = 1
const STORE_NAME = 'books'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const request = fn(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function getAllBooks(): Promise<Book[]> {
  return withStore('readonly', (store) => store.getAll())
}

export function getBook(id: string): Promise<Book | undefined> {
  return withStore('readonly', (store) => store.get(id))
}

export async function saveBook(book: Book): Promise<void> {
  await withStore('readwrite', (store) => store.put(book))
}

export async function deleteBook(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}

export async function exportLibrary(): Promise<string> {
  const books = await getAllBooks()
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), books }, null, 2)
}

export async function importLibrary(json: string): Promise<void> {
  const parsed = JSON.parse(json)
  const books: Book[] = Array.isArray(parsed) ? parsed : parsed.books
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const book of books) store.put(book)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
