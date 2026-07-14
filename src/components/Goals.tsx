import { useEffect, useState } from 'react'
import type { ReadingGoal } from '../types/goal'

interface GoalsProps {
  goal: ReadingGoal | undefined
  year: number
  onSave: (goal: ReadingGoal) => void
}

/** Sets this year's reading goal — books, pages, or both; leave a field blank to not track that metric. */
export default function Goals({ goal, year, onSave }: GoalsProps) {
  const [booksTarget, setBooksTarget] = useState(goal?.booksTarget != null ? String(goal.booksTarget) : '')
  const [pagesTarget, setPagesTarget] = useState(goal?.pagesTarget != null ? String(goal.pagesTarget) : '')
  const [justSaved, setJustSaved] = useState(false)

  // Re-sync the draft if the saved goal for this year changes underneath us (e.g. after
  // a fresh load), so the form doesn't keep showing stale defaults from before it arrived.
  useEffect(() => {
    setBooksTarget(goal?.booksTarget != null ? String(goal.booksTarget) : '')
    setPagesTarget(goal?.pagesTarget != null ? String(goal.pagesTarget) : '')
  }, [goal])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const books = parseInt(booksTarget, 10)
    const pages = parseInt(pagesTarget, 10)
    onSave({
      year,
      booksTarget: Number.isFinite(books) && books > 0 ? books : undefined,
      pagesTarget: Number.isFinite(pages) && pages > 0 ? pages : undefined,
    })
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <h2>{year} reading goal</h2>
      <p className="onboarding-intro">
        Set a target for books, pages, or both — leave either blank to skip tracking it. Progress shows up on the
        Stats page, based on books with a finish date in {year}.
      </p>
      <label>
        Books
        <input
          type="number"
          min="1"
          step="1"
          value={booksTarget}
          onChange={(e) => setBooksTarget(e.target.value)}
          placeholder="e.g. 24"
        />
      </label>
      <label>
        Pages
        <input
          type="number"
          min="1"
          step="1"
          value={pagesTarget}
          onChange={(e) => setPagesTarget(e.target.value)}
          placeholder="e.g. 8000"
        />
      </label>
      <div className="form-actions">
        <button type="submit">Save goal</button>
        {justSaved && <span className="save-confirm">Saved ✓</span>}
      </div>
    </form>
  )
}
