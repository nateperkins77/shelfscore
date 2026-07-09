import { useRef, useState } from 'react'

interface RatingInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
}

function roundToQuarter(raw: number): number {
  return Math.round(raw * 4) / 4
}

/** Star row you click or drag across directly to set a 0.25-increment rating (see spec's Rating Input UI Note). */
export default function RatingInput({ value, onChange }: RatingInputProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  // Mirrors the value prop for handlers that need the latest committed value within a
  // single synchronous burst of events (e.g. OS key-repeat), where consecutive handler
  // calls can still close over the pre-update prop before React re-renders.
  const valueRef = useRef(value)
  valueRef.current = value

  function valueFromPointer(clientX: number): number {
    const el = trackRef.current
    if (!el) return value ?? 0
    const rect = el.getBoundingClientRect()
    const fraction = (clientX - rect.left) / rect.width
    return roundToQuarter(Math.max(0, Math.min(1, fraction)) * 5)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    setDragging(true)
    const next = valueFromPointer(e.clientX)
    setHoverValue(next)
    onChange(next)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    // Gate on a ref, not state: pointerdown + pointermove can land in the same React
    // batch (e.g. a fast drag start), where state set moments ago hasn't re-rendered
    // yet and this handler would still close over the stale pre-drag value.
    if (!draggingRef.current) return
    const next = valueFromPointer(e.clientX)
    setHoverValue(next)
    onChange(next)
  }

  function endDrag() {
    draggingRef.current = false
    setDragging(false)
    setHoverValue(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const current = valueRef.current ?? 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(5, current + 0.25)
      valueRef.current = next
      onChange(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(0, current - 0.25)
      valueRef.current = next
      onChange(next)
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(5)
    }
  }

  const displayValue = hoverValue ?? value ?? 0
  const fillPercent = (displayValue / 5) * 100

  return (
    <div className="rating-input">
      <div
        ref={trackRef}
        className={`rating-stars${dragging ? ' rating-stars-dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label="Star rating"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={value ?? 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        <div className="rating-stars-empty" aria-hidden="true">
          ★★★★★
        </div>
        <div className="rating-stars-filled" aria-hidden="true" style={{ width: `${fillPercent}%` }}>
          ★★★★★
        </div>
      </div>
      <span className="rating-value">{value != null ? value.toFixed(2).replace(/\.?0+$/, '') : 'Not rated'}</span>
      {value != null && (
        <button type="button" className="rating-clear" onClick={() => onChange(undefined)}>
          Clear
        </button>
      )}
    </div>
  )
}
