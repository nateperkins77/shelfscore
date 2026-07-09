import { useState } from 'react'

export interface PieChartDatum {
  name: string
  count: number
}

interface PieChartProps {
  data: PieChartDatum[]
  colors: string[]
  otherColor?: string
  maxSlices?: number
  centerLabel?: string
}

interface Slice extends PieChartDatum {
  color: string
  fraction: number
  startAngle: number
  endAngle: number
}

const SIZE = 200
const RADIUS = 90
const INNER_RADIUS = 54
const CENTER = SIZE / 2

function polarToCartesian(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) }
}

function donutSlicePath(startAngle: number, endAngle: number): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  const outerStart = polarToCartesian(startAngle, RADIUS)
  const outerEnd = polarToCartesian(endAngle, RADIUS)
  const innerStart = polarToCartesian(endAngle, INNER_RADIUS)
  const innerEnd = polarToCartesian(startAngle, INNER_RADIUS)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ')
}

/** Donut chart: fixed categorical color order, tail folded into "Other" past maxSlices, legend + hover tooltip. */
export default function PieChart({ data, colors, otherColor = '#6b6a63', maxSlices = 6, centerLabel }: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null)

  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (total === 0) return <p className="empty-state">Not enough data yet.</p>

  const head = data.slice(0, maxSlices - 1)
  const tail = data.slice(maxSlices - 1)
  const tailTotal = tail.reduce((sum, d) => sum + d.count, 0)
  const entries: PieChartDatum[] = tailTotal > 0 ? [...head, { name: 'Other', count: tailTotal }] : head

  let cursor = 0
  const slices: Slice[] = entries.map((entry, i) => {
    const fraction = entry.count / total
    const startAngle = cursor * 360
    cursor += fraction
    const endAngle = cursor * 360
    return {
      ...entry,
      color: entry.name === 'Other' ? otherColor : colors[i % colors.length],
      fraction,
      startAngle,
      endAngle,
    }
  })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const active = activeIndex != null ? slices[activeIndex] : null

  return (
    <div className="pie-chart" onMouseMove={handleMove} onMouseLeave={() => setActiveIndex(null)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pie-chart-svg" role="img" aria-label="Donut chart">
        {slices.map((slice, i) => (
          <path
            key={slice.name}
            d={donutSlicePath(slice.startAngle, slice.endAngle)}
            fill={slice.color}
            className={`pie-slice${activeIndex === i ? ' pie-slice-active' : ''}`}
            onMouseEnter={() => setActiveIndex(i)}
          />
        ))}
        <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="pie-center-value">
          {active ? active.count : total}
        </text>
        <text x={CENTER} y={CENTER + 16} textAnchor="middle" className="pie-center-label">
          {active ? active.name : (centerLabel ?? 'total')}
        </text>
      </svg>

      {active && tooltip && (
        <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{active.count}</strong> {active.name} ({Math.round(active.fraction * 100)}%)
        </div>
      )}

      <ul className="chart-legend">
        {slices.map((slice, i) => (
          <li
            key={slice.name}
            className={activeIndex === i ? 'active' : ''}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <span className="legend-swatch" style={{ background: slice.color }} />
            <span className="legend-name">{slice.name}</span>
            <span className="legend-count">{slice.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
