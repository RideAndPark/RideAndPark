import { memo } from 'react'
import { formatRefreshInterval, formatDate } from '../../utils/formatters'
import { REFRESH_OPTIONS } from '../../utils/constants'

function SearchPanelComponent({
  targetQuery,
  onTargetQueryChange,
  target,
  onTargetSearch,
  onResetTarget,
  searching,
  radiusKm,
  onRadiusChange,
  refreshSeconds,
  onRefreshSecondsChange,
  realtimeOnly,
  onRealtimeOnlyChange,
  onlyOpenParkings,
  onOnlyOpenParkingsChange,
  onRefreshNow,
  meta,
  searchError,
  error,
}) {
  return (
    <section className="panel controls-panel">
      <div className="panel-header">
        <h2>Suche</h2>
        <button type="button" className="ghost-button" onClick={onRefreshNow}>
          Jetzt aktualisieren
        </button>
      </div>

      <form className="search-form" onSubmit={onTargetSearch}>
        <label className="field">
          <span>Zieladresse oder Ort</span>
          <input
            type="text"
            value={targetQuery}
            onChange={(event) => onTargetQueryChange(event.target.value)}
            placeholder="z. B. Stuttgart Hbf"
          />
        </label>

        <label className="field">
          <span>Suchradius</span>
          <div className="range-row">
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={radiusKm}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
            />
            <strong>{radiusKm} km</strong>
          </div>
        </label>

        <label className="field">
          <span>Auto-Refresh</span>
          <select
            value={refreshSeconds}
            onChange={(event) => onRefreshSecondsChange(Number(event.target.value))}
          >
            {REFRESH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatRefreshInterval(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="field checkbox-field">
          <span>Datentyp</span>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={realtimeOnly}
              onChange={(event) => onRealtimeOnlyChange(event.target.checked)}
            />
            <span>Nur Echtzeitdaten anzeigen</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={onlyOpenParkings}
              onChange={(event) => onOnlyOpenParkingsChange(event.target.checked)}
            />
            <span>Nur offene Parkplätze anzeigen</span>
          </label>
        </label>

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={searching}>
            {searching ? 'Suche läuft...' : 'Ziel finden'}
          </button>
          <button type="button" className="secondary-button" onClick={onResetTarget}>
            Radius zurücksetzen
          </button>
        </div>
      </form>

      <div className="meta-grid">
        <article>
          <span className="meta-label">Quelle</span>
          <strong>{meta?.source ?? 'unbekannt'}</strong>
        </article>
        <article>
          <span className="meta-label">Letztes Update</span>
          <strong>{formatDate(meta?.loadedAt)}</strong>
        </article>
        <article>
          <span className="meta-label">Treffer</span>
          <strong>{meta?.count ?? 0}</strong>
        </article>
      </div>

      {target ? (
        <div className="target-card">
          <span className="meta-label">Aktuelles Ziel</span>
          <strong>{target.label}</strong>
        </div>
      ) : (
        <div className="target-card muted-card">
          <span className="meta-label">Kein Ziel gesetzt</span>
          <strong>Es werden alle verfügbaren Parkplätze gezeigt.</strong>
        </div>
      )}

      {meta?.warning ? <p className="notice warning">{meta.warning}</p> : null}
      {searchError ? <p className="notice error">{searchError}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
    </section>
  )
}

export const SearchPanel = memo(SearchPanelComponent)
