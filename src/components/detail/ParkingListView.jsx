import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { getParkingMetrics, getOccupancyColor } from '../../utils/calculations'

const ROW_HEIGHT = 104
const OVERSCAN = 4

function ParkingListViewComponent({
  enrichedParkings,
  selectedParking,
  onSelectParking,
  loading,
}) {
  const listRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [listHeight, setListHeight] = useState(0)

  useEffect(() => {
    const listNode = listRef.current

    if (!listNode) {
      return undefined
    }

    setListHeight(listNode.clientHeight)

    if (!('ResizeObserver' in window)) {
      return undefined
    }

    const observer = new ResizeObserver(([entry]) => {
      setListHeight(entry.contentRect.height)
    })

    observer.observe(listNode)

    return () => observer.disconnect()
  }, [])

  const virtualItems = useMemo(() => {
    if (enrichedParkings.length === 0 || listHeight === 0) {
      return []
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const visibleCount = Math.ceil(listHeight / ROW_HEIGHT) + OVERSCAN * 2
    const endIndex = Math.min(enrichedParkings.length, startIndex + visibleCount)

    return enrichedParkings.slice(startIndex, endIndex).map((parking, offset) => ({
      parking,
      index: startIndex + offset,
    }))
  }, [enrichedParkings, listHeight, scrollTop])

  return (
    <div className="list-panel">
      <h3>Trefferliste</h3>
      <div
        ref={listRef}
        className="parking-list is-virtualized"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {loading && enrichedParkings.length === 0 ? (
          [...Array(5)].map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="skeleton-card skeleton"
              style={{ height: '80px', borderRadius: '12px' }}
            />
          ))
        ) : enrichedParkings.length > 0 ? (
          <div
            className="parking-list-spacer"
            style={{ height: `${enrichedParkings.length * ROW_HEIGHT}px` }}
          >
            {virtualItems.map(({ parking, index }) => (
              <ParkingRow
                key={parking.id}
                parking={parking}
                isSelected={selectedParking?.id === parking.id}
                onSelectParking={onSelectParking}
                style={{ top: `${index * ROW_HEIGHT}px` }}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            Keine Parkplaetze gefunden
          </div>
        )}
      </div>
    </div>
  )
}

const ParkingRow = memo(function ParkingRow({ parking, isSelected, onSelectParking, style }) {
  const metrics = getParkingMetrics(parking)

  return (
    <button
      type="button"
      className={`parking-row virtualized-row ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelectParking(parking.id)}
      style={style}
    >
      <span
        className="occupancy-dot"
        style={{ backgroundColor: getOccupancyColor(parking) }}
      />
      <span className="parking-row-copy">
        <strong>{parking.name}</strong>
        <small>
          {metrics.freeLabel} · {metrics.occupancyLabel}
          {parking.distanceKm !== null
            ? ` · ${parking.distanceKm.toFixed(1)} km entfernt`
            : ''}
        </small>
        {parking.openingHours ? (
          <small className="opening-hours">
            {parking.openingHours}
          </small>
        ) : null}
      </span>
    </button>
  )
})

export const ParkingListView = memo(ParkingListViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.enrichedParkings === nextProps.enrichedParkings &&
    prevProps.selectedParking?.id === nextProps.selectedParking?.id &&
    prevProps.loading === nextProps.loading
  )
})
