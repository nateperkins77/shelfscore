import { formatPartialDate, parsePartialDate } from '../lib/partialDate'

interface PartialDateInputProps {
  value: string
  onChange: (value: string) => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Day/month/year entered as three separate boxes instead of one native date picker, so a
 * book can be logged with only the year known (e.g. "finished sometime in 2026") and still
 * count toward that year's reading goal — day requires month to be set first, and month
 * requires year, since neither means anything on its own.
 */
export default function PartialDateInput({ value, onChange }: PartialDateInputProps) {
  const { year, month, day } = parsePartialDate(value)

  function handleDayChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDay = e.target.value ? Number(e.target.value) : undefined
    onChange(formatPartialDate({ year, month, day: newDay }))
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newMonth = e.target.value ? Number(e.target.value) : undefined
    onChange(formatPartialDate({ year, month: newMonth, day }))
  }

  function handleYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newYear = e.target.value ? Number(e.target.value) : undefined
    onChange(formatPartialDate({ year: newYear, month, day }))
  }

  return (
    <div className="partial-date-input">
      <input
        type="number"
        className="partial-date-day"
        placeholder="DD"
        min="1"
        max="31"
        value={day ?? ''}
        disabled={!month}
        onChange={handleDayChange}
        aria-label="Day"
      />
      <select
        className="partial-date-month"
        value={month ?? ''}
        disabled={!year}
        onChange={handleMonthChange}
        aria-label="Month"
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <input
        type="number"
        className="partial-date-year"
        placeholder="YYYY"
        min="1000"
        max="9999"
        value={year ?? ''}
        onChange={handleYearChange}
        aria-label="Year"
      />
    </div>
  )
}
