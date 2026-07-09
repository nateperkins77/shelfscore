import { useState } from 'react'
import type { SeriesPoint } from '../../stats/stats'

interface LineChartProps {
  data: SeriesPoint[]
  color: string
}

const WIDTH = 640
const HEIGHT = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 16 }
const PLOT_WIDTH = WIDTH - PAD.left - PAD.right
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom

export default function LineChart({ data, color }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className="empty-state">No finish dates logged yet.</p>
  }

  const maxCount = Math.max(1, ...data.map((d) => d.count))
  const n = data.length

  function x(i: number): number {
    return PAD.left + (n === 1 ? PLOT_WIDTH / 2 : (i / (n - 1)) * PLOT_WIDTH)
  }
  function y(count: number): number {
    return PAD.top + PLOT_HEIGHT - (count / maxCount) * PLOT_HEIGHT
  }

  const points = data.map((d, i) => ({ ...d, cx: x(i), cy: y(d.count) }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ')
  const areaPath = `${linePath} L ${points[n - 1].cx} ${PAD.top + PLOT_HEIGHT} L ${points[0].cx} ${PAD.top + PLOT_HEIGHT} Z`

  // Show at most ~6 x-axis labels so dense ranges (e.g. 30 days) don't collide.
  const labelStride = Math.max(1, Math.ceil(n / 6))
  const gridSteps = [0, 0.5, 1]

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
    const fraction = (relX - PAD.left) / PLOT_WIDTH
    const idx = Math.round(fraction * (n - 1))
    setHoverIndex(Math.max(0, Math.min(n - 1, idx)))
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null
  const last = points[n - 1]

  return (
    <div className="line-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="line-chart-svg"
        role="img"
        aria-label="Books read over time"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridSteps.map((step) => {
          const gy = PAD.top + PLOT_HEIGHT - step * PLOT_HEIGHT
          return (
            <g key={step}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={gy} y2={gy} className="line-chart-grid" />
              <text x={PAD.left} y={gy - 4} className="line-chart-tick">
                {Math.round(maxCount * step)}
              </text>
            </g>
          )
        })}

        <path d={areaPath} fill={color} opacity={0.12} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) =>
          i % labelStride === 0 || i === n - 1 ? (
            <text key={p.key} x={p.cx} y={HEIGHT - 6} textAnchor="middle" className="line-chart-tick">
              {p.label}
            </text>
          ) : null,
        )}

        <circle cx={last.cx} cy={last.cy} r={5} fill={color} stroke="var(--bg-surface)" strokeWidth={2} />
        <text x={last.cx} y={last.cy - 12} textAnchor="middle" className="line-chart-end-label">
          {last.count}
        </text>

        {hovered && (
          <g>
            <line
              x1={hovered.cx}
              x2={hovered.cx}
              y1={PAD.top}
              y2={PAD.top + PLOT_HEIGHT}
              className="line-chart-crosshair"
            />
            <circle cx={hovered.cx} cy={hovered.cy} r={5} fill={color} stroke="var(--bg-surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{ left: `${(hovered.cx / WIDTH) * 100}%`, top: `${(hovered.cy / HEIGHT) * 100}%` }}
        >
          <strong>{hovered.count}</strong> {hovered.count === 1 ? 'book' : 'books'}
          <div className="chart-tooltip-sub">{hovered.label}</div>
        </div>
      )}
    </div>
  )
}
