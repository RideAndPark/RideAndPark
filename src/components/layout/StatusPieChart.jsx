const STATUS_SEGMENTS = [
  { key: 'open', label: 'Frei', color: '#0aad48' },
  { key: 'limited', label: 'Knapp', color: '#f59e0b' },
  { key: 'full', label: 'Voll', color: '#ef4444' },
  { key: 'unknown', label: 'Unklar', color: '#2f3033' },
]

export default function StatusPieChart({ statusCounts }) {
  const total = Math.max(statusCounts.total, 1)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const { segments } = STATUS_SEGMENTS.reduce(
    (accumulator, segment) => {
      const value = statusCounts[segment.key] ?? 0
      const length = (value / total) * circumference

      return {
        offset: accumulator.offset + length,
        segments: [
          ...accumulator.segments,
          {
            ...segment,
            length,
            dashOffset: -accumulator.offset,
          },
        ],
      }
    },
    { offset: 0, segments: [] },
  )

  return (
    <div className="status-donut" aria-label={`${statusCounts.total} Parkhaeuser insgesamt`}>
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle className="status-donut-track" cx="60" cy="60" r={radius} />
        {segments.map((segment) => (
          <circle
            key={segment.key}
            className="status-donut-segment"
            cx="60"
            cy="60"
            r={radius}
            stroke={segment.color}
            strokeDasharray={`${segment.length} ${circumference - segment.length}`}
            strokeDashoffset={segment.dashOffset}
          />
        ))}
        <text x="60" y="56" textAnchor="middle" className="status-donut-total">
          {statusCounts.total}
        </text>
        <text x="60" y="72" textAnchor="middle" className="status-donut-caption">
          total
        </text>
      </svg>

      <div className="status-donut-legend">
        {STATUS_SEGMENTS.map((segment) => (
          <span key={segment.key}>
            <i style={{ backgroundColor: segment.color }} />
            {segment.label}: {statusCounts[segment.key] ?? 0}
          </span>
        ))}
      </div>
    </div>
  )
}
