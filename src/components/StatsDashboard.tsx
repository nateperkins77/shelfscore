import { useMemo, useState } from 'react'
import type { Book } from '../types/book'
import type { ReadingGoal } from '../types/goal'
import {
  averageRating,
  booksOverTimeSeries,
  genreCounts,
  goalProgress,
  librarySummary,
  mostReadAuthorsChartData,
  ratingDistribution,
  type TimeRange,
} from '../stats/stats'
import { CHART_CATEGORICAL, CHART_OTHER } from '../lib/chartPalette'
import PieChart from './charts/PieChart'
import LineChart from './charts/LineChart'

interface StatsDashboardProps {
  books: Book[]
  goal: ReadingGoal | undefined
  year: number
}

function GoalBar({ label, completed, target }: { label: string; completed: number; target: number }) {
  const pct = Math.min(1, completed / target)
  const met = completed >= target
  return (
    <div className="goal-bar">
      <div className="goal-bar-header">
        <span>{label}</span>
        <span className={met ? 'goal-bar-met' : ''}>
          {completed.toLocaleString()} / {target.toLocaleString()} {met && '🎉'}
        </span>
      </div>
      <span className="bar-track goal-bar-track">
        <span className="bar-fill" style={{ width: `${pct * 100}%` }} />
      </span>
    </div>
  )
}

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'year', label: 'Last year' },
  { value: 'all', label: 'All time' },
]

function BarList({ entries, max }: { entries: { name: string; count: number }[]; max: number }) {
  return (
    <ul className="bar-list">
      {entries.map((entry) => (
        <li key={entry.name}>
          <span className="bar-label">{entry.name}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(entry.count / max) * 100}%` }} />
          </span>
          <span className="bar-count">{entry.count}</span>
        </li>
      ))}
    </ul>
  )
}

export default function StatsDashboard({ books, goal, year }: StatsDashboardProps) {
  const [range, setRange] = useState<TimeRange>('month')

  const authors = useMemo(() => mostReadAuthorsChartData(books), [books])
  const genres = useMemo(() => genreCounts(books), [books])
  const distribution = useMemo(() => ratingDistribution(books), [books])
  const avgRating = useMemo(() => averageRating(books), [books])
  const overTime = useMemo(() => booksOverTimeSeries(books, range), [books, range])
  const summary = useMemo(() => librarySummary(books), [books])
  const progress = useMemo(() => goalProgress(books, goal, year), [books, goal, year])

  const maxDistCount = Math.max(1, ...distribution.map((d) => d.count))

  if (books.length === 0) {
    return <p className="empty-state">Log some books to see stats here.</p>
  }

  return (
    <div className="stats-dashboard">
      <div className="stats-summary">
        <div className="stat-tile">
          <span className="stat-value">{summary.totalBooks}</span>
          <span className="stat-label">books logged</span>
        </div>
        {avgRating != null && (
          <div className="stat-tile">
            <span className="stat-value">{avgRating.toFixed(2)}</span>
            <span className="stat-label">average rating</span>
          </div>
        )}
        {summary.totalPages != null && (
          <div className="stat-tile">
            <span className="stat-value">{summary.totalPages.toLocaleString()}</span>
            <span className="stat-label">total pages</span>
          </div>
        )}
        {summary.longestBook && (
          <div className="stat-tile">
            <span className="stat-value">{summary.longestBook.pageCount}</span>
            <span className="stat-label">longest: {summary.longestBook.title}</span>
          </div>
        )}
        {summary.shortestBook && (
          <div className="stat-tile">
            <span className="stat-value">{summary.shortestBook.pageCount}</span>
            <span className="stat-label">shortest: {summary.shortestBook.title}</span>
          </div>
        )}
      </div>

      {(progress.booksTarget != null || progress.pagesTarget != null) && (
        <section className="chart-card">
          <h3>{year} reading goal</h3>
          <div className="goal-bars">
            {progress.booksTarget != null && (
              <GoalBar label="Books" completed={progress.booksCompleted} target={progress.booksTarget} />
            )}
            {progress.pagesTarget != null && (
              <GoalBar label="Pages" completed={progress.pagesCompleted} target={progress.pagesTarget} />
            )}
          </div>
        </section>
      )}

      <div className="stats-charts-row">
        <section className="chart-card">
          <h3>Most-read authors</h3>
          <PieChart
            data={authors}
            colors={CHART_CATEGORICAL}
            otherColor={CHART_OTHER}
            centerLabel="books"
            maxSlices={authors.length + 1}
          />
        </section>

        <section className="chart-card">
          <h3>Most-read genres</h3>
          <PieChart data={genres} colors={CHART_CATEGORICAL} otherColor={CHART_OTHER} centerLabel="books" />
        </section>
      </div>

      <section className="chart-card">
        <div className="chart-card-header">
          <h3>Books read over time</h3>
          <div className="range-toggle" role="group" aria-label="Time range">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={range === opt.value ? 'active' : ''}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <LineChart data={overTime} color={CHART_CATEGORICAL[0]} />
      </section>

      <section className="chart-card">
        <h3>Rating distribution</h3>
        <BarList entries={distribution.map((d) => ({ name: d.label, count: d.count }))} max={maxDistCount} />
      </section>
    </div>
  )
}
