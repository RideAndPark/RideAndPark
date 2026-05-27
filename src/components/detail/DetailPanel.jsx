import { memo } from 'react'
import { formatNumber, formatDate, normalizeStatus } from '../../utils/formatters'
import { getOccupancyColor } from '../../utils/calculations'
import { SkeletonBox } from '../common/SkeletonLoaders'

function DetailPanelComponent({
  selectedParking,
  loading,
}) {
  if (!selectedParking) {
    return (
      <article className="detail-card muted-card">
        <h3>Keine Parkplätze gefunden</h3>
        <p>Erweitere den Radius oder suche ein anderes Ziel.</p>
      </article>
    )
  }

  return (
    <article className="detail-card slide-in-up">
      <div className="detail-header">
        <div>
          <h3>{selectedParking.name}</h3>
          <p>{normalizeStatus(selectedParking.status)}</p>
        </div>
        <span
          className={`occupancy-dot ${selectedParking.status === 'limited' ? 'pulse-limited' : ''}`}
          style={{ backgroundColor: getOccupancyColor(selectedParking) }}
        />
      </div>

      <div className="parking-stats">
        <div className="stat-group">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Freie Plätze</span>
              <span className="stat-value">{loading ? <SkeletonBox width="80%" height="28px" /> : formatNumber(selectedParking.free)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Kapazität</span>
              <span className="stat-value">{loading ? <SkeletonBox width="60%" height="28px" /> : formatNumber(selectedParking.total)}</span>
            </div>
          </div>

          <div className="occupancy-section">
            <div className="occupancy-header">
              <span className="occupancy-label">Auslastung</span>
              <span className="occupancy-percentage">
                {loading ? <SkeletonBox width="80px" height="20px" /> : (selectedParking.occupancyRate !== null
                  ? `${selectedParking.occupancyRate.toFixed(1)} %`
                  : 'k. A.')}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill status-${selectedParking.status}`}
                style={{ 
                  width: `${Math.min(selectedParking.occupancyRate ?? 0, 100)}%` 
                }}
              />
            </div>
          </div>
        </div>

        <div className="metadata-section">
          <div className="metadata-item">
            <span className="metadata-label">Letzte Meldung</span>
            <span className="metadata-value">{loading ? <SkeletonBox width="100%" height="16px" /> : formatDate(selectedParking.updatedAt)}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Quelle</span>
            <span className="metadata-value">{loading ? <SkeletonBox width="70%" height="16px" /> : selectedParking.source}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Entfernung</span>
            <span className="metadata-value">
              {loading ? <SkeletonBox width="60%" height="16px" /> : (selectedParking.distanceKm !== null
                ? `${selectedParking.distanceKm.toFixed(1)} km`
                : 'kein Ziel gesetzt')}
            </span>
          </div>
          {!loading && selectedParking.openingHours ? (
            <div className="metadata-item">
              <span className="metadata-label">Öffnungszeiten</span>
              <span className="metadata-value">{selectedParking.openingHours}</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export const DetailPanel = memo(DetailPanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.selectedParking?.id === nextProps.selectedParking?.id &&
    prevProps.loading === nextProps.loading
  )
})
