import type { Book } from '../types/book'
import type { ReadingGoal } from '../types/goal'

const DB_NAME = 'book-tracker'
const DB_VERSION = 2
const STORE_NAME = 'books'
const GOALS_STORE = 'goals'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(GOALS_STORE)) {
        db.createObjectStore(GOALS_STORE, { keyPath: 'year' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = fn(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function getAllBooks(): Promise<Book[]> {
  return withStore(STORE_NAME, 'readonly', (store) => store.getAll())
}

export function getBook(id: string): Promise<Book | undefined> {
  return withStore(STORE_NAME, 'readonly', (store) => store.get(id))
}

export async function saveBook(book: Book): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.put(book))
}

export async function deleteBook(id: string): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.delete(id))
}

// Reading goals — at most one per calendar year, keyed by year.

export function getAllGoals(): Promise<ReadingGoal[]> {
  return withStore(GOALS_STORE, 'readonly', (store) => store.getAll())
}

export async function saveGoal(goal: ReadingGoal): Promise<void> {
  await withStore(GOALS_STORE, 'readwrite', (store) => store.put(goal))
}

export async function exportLibrary(): Promise<string> {
  const [books, goals] = await Promise.all([getAllBooks(), getAllGoals()])
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), books, goals }, null, 2)
}

export async function importLibrary(json: string): Promise<void> {
  const parsed = JSON.parse(json)
  const books: Book[] = Array.isArray(parsed) ? parsed : parsed.books
  const goals: ReadingGoal[] = Array.isArray(parsed) ? [] : (parsed.goals ?? [])
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, GOALS_STORE], 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const book of books) store.put(book)
    const goalsStore = tx.objectStore(GOALS_STORE)
    for (const goal of goals) goalsStore.put(goal)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
