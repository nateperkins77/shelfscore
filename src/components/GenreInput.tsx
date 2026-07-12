import { useState } from 'react'
import { GENRES } from '../lib/genres'

const CUSTOM = '__custom__'

interface GenreInputProps {
  value: string
  onChange: (value: string) => void
}

/** Genre dropdown with an escape hatch: "Custom…" swaps to a free-text field for anything not on the curated list. */
export default function GenreInput({ value, onChange }: GenreInputProps) {
  const isCustomValue = value !== '' && !(GENRES as readonly string[]).includes(value)
  const [customMode, setCustomMode] = useState(isCustomValue)

  if (customMode) {
    return (
      <span className="genre-input">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter a genre"
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setCustomMode(false)
            onChange('')
          }}
        >
          Choose from list
        </button>
      </span>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === CUSTOM) {
          setCustomMode(true)
          onChange('')
        } else {
          onChange(e.target.value)
        }
      }}
    >
      <option value="">Select a genre…</option>
      {GENRES.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
      <option value={CUSTOM}>Custom…</option>
    </select>
  )
}
