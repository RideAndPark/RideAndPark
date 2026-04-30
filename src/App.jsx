import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import './App.css'

const DEFAULT_CENTER = [48.1372, 11.5756]
const DEFAULT_RADIUS_KM = 5
const DEFAULT_REFRESH_SECONDS = 30
const REFRESH_OPTIONS = [15, 30, 60, 120]

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'k. A.'
  }

  return new Intl.NumberFormat('de-DE').format(value)
}

function formatDate(value) {
  if (!value) {
    return 'unbekannt'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'unbekannt'
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

function normalizeStatus(status) {
  const normalized = String(status ?? 'unknown').toLowerCase()

  if (normalized === 'full') {
    return 'voll'
  }

  if (normalized === 'limited') {
    return 'knapp'
  }

  if (normalized === 'open') {
    return 'frei'
  }

  return 'unklar'
}

function getOccupancyColor(parking) {
  if (parking.status === 'full') {
    return '#cf3d2e'
  }

  if (parking.status === 'limited') {
    return '#d98a1f'
  }

  if (parking.status === 'open') {
    return '#1f8a5b'
  }

  if (parking.occupancyRate !== null && parking.occupancyRate !== undefined) {
    if (parking.occupancyRate >= 95) {
      return '#cf3d2e'
    }

    if (parking.occupancyRate >= 80) {
      return '#d98a1f'
    }

    return '#1f8a5b'
  }

  return '#5f6b76'
}

function getMarkerRadius(parking) {
  if (parking.total && parking.total >= 500) {
    return 13
  }

  if (parking.total && parking.total >= 200) {
    return 11
  }

  return 9
}

function calculateDistanceKm(fromLat, fromLng, toLat, toLng) {
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const latDiff = toRadians(toLat - fromLat)
  const lngDiff = toRadians(toLng - fromLng)
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDiff / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getParkingMetrics(parking) {
  const free = parking.free ?? null
  const total = parking.total ?? null
  const occupancyRate = parking.occupancyRate ?? null

  return {
    freeLabel: free === null ? 'k. A.' : `${formatNumber(free)} frei`,
    totalLabel: total === null ? 'Kapazität unbekannt' : `${formatNumber(total)} Plätze`,
    occupancyLabel:
      occupancyRate === null ? 'Auslastung unbekannt' : `${occupancyRate.toFixed(1)} % belegt`,
  }
}

function FitMapToData({ parkings, target, radiusKm }) {
  const map = useMap()

  useEffect(() => {
    const bounds = []

    if (target) {
      const latOffset = radiusKm / 111.32
      const lngFactor = Math.max(Math.cos((target.lat * Math.PI) / 180), 0.2)
      const lngOffset = radiusKm / (111.32 * lngFactor)
      bounds.push([target.lat - latOffset, target.lng - lngOffset])
      bounds.push([target.lat + latOffset, target.lng + lngOffset])
    }

    parkings.forEach((parking) => {
      bounds.push([parking.lat, parking.lng])
    })

    if (bounds.length === 0) {
      map.setView(DEFAULT_CENTER, 12)
      return
    }

    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: target ? 14 : 15,
    })
  }, [map, parkings, radiusKm, target])

  return null
}

function ParkingMap({ parkings, target, radiusKm, selectedParking, onSelectParking }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className="map-canvas" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitMapToData parkings={parkings} target={target} radiusKm={radiusKm} />

      {target ? (
        <>
          <Circle
            center={[target.lat, target.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#0f6c74', fillColor: '#7fd2d0', fillOpacity: 0.08 }}
          />
          <CircleMarker
            center={[target.lat, target.lng]}
            radius={8}
            pathOptions={{ color: '#08363a', fillColor: '#0f6c74', fillOpacity: 1, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent>
              Ziel
            </Tooltip>
          </CircleMarker>
        </>
      ) : null}

      {parkings.map((parking) => {
        const color = getOccupancyColor(parking)
        const isSelected = selectedParking?.id === parking.id
        const metrics = getParkingMetrics(parking)

        return (
          <CircleMarker
            key={parking.id}
            center={[parking.lat, parking.lng]}
            radius={isSelected ? getMarkerRadius(parking) + 3 : getMarkerRadius(parking)}
            eventHandlers={{
              click: () => onSelectParking(parking),
            }}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.8,
              weight: isSelected ? 4 : 2,
            }}
          >
            <Popup>
              <strong>{parking.name}</strong>
              <br />
              Status: {normalizeStatus(parking.status)}
              <br />
              {metrics.freeLabel}
              <br />
              {metrics.totalLabel}
              <br />
              {metrics.occupancyLabel}
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}

function App() {
  const [parkings, setParkings] = useState([])
  const [selectedParkingId, setSelectedParkingId] = useState(null)
  const [targetQuery, setTargetQuery] = useState('München Hauptbahnhof')
  const [target, setTarget] = useState(null)
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [refreshSeconds, setRefreshSeconds] = useState(DEFAULT_REFRESH_SECONDS)
  const [realtimeOnly, setRealtimeOnly] = useState(true)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')

  const fetchParkings = useCallback(async () => {
    const params = new URLSearchParams()

    if (target) {
      params.set('target_lat', String(target.lat))
      params.set('target_lng', String(target.lng))
      params.set('radius_km', String(radiusKm))
    }

    if (realtimeOnly) {
      params.set('realtimeData', 'true')
    }

    const query = params.toString()
    const response = await fetch(query ? `/api/parkings?${query}` : '/api/parkings')

    if (!response.ok) {
      throw new Error(`API-Fehler ${response.status}`)
    }

    return response.json()
  }, [radiusKm, realtimeOnly, target])

  const applyParkingResult = useCallback((result) => {
    const nextParkings = result.data ?? []

    setParkings(nextParkings)
    setMeta(result.meta ?? null)
    setSelectedParkingId((currentId) => {
      if (nextParkings.some((parking) => parking.id === currentId)) {
        return currentId
      }

      return nextParkings[0]?.id ?? null
    })
  }, [])

  const refreshParkings = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await fetchParkings()
      applyParkingResult(result)
    } catch (loadError) {
      setError(loadError.message ?? 'Parkplätze konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [applyParkingResult, fetchParkings])

  async function handleTargetSearch(event) {
    event.preventDefault()
    setSearching(true)
    setSearchError('')

    try {
      const params = new URLSearchParams({
        q: targetQuery,
      })
      const response = await fetch(`/api/geocode?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Geocoding fehlgeschlagen (${response.status})`)
      }

      const result = await response.json()

      setLoading(true)
      setTarget({
        lat: Number(result.lat),
        lng: Number(result.lng),
        label: result.label,
      })
    } catch (geocodeError) {
      setSearchError(geocodeError.message ?? 'Ziel konnte nicht aufgelöst werden.')
    } finally {
      setSearching(false)
    }
  }

  function handleResetTarget() {
    setLoading(true)
    setTarget(null)
    setSearchError('')
  }

  const enrichedParkings = useMemo(() => {
    return parkings
      .map((parking) => ({
        ...parking,
        distanceKm:
          target !== null
            ? calculateDistanceKm(target.lat, target.lng, parking.lat, parking.lng)
            : null,
      }))
      .sort((left, right) => {
        if (left.distanceKm !== null && right.distanceKm !== null) {
          return left.distanceKm - right.distanceKm
        }

        return left.name.localeCompare(right.name, 'de')
      })
  }, [parkings, target])

  const selectedParking = useMemo(
    () =>
      enrichedParkings.find((parking) => parking.id === selectedParkingId) ??
      enrichedParkings[0] ??
      null,
    [enrichedParkings, selectedParkingId],
  )

  useEffect(() => {
    let isActive = true

    async function syncParkings() {
      try {
        setError('')
        const result = await fetchParkings()

        if (isActive) {
          applyParkingResult(result)
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message ?? 'Parkplätze konnten nicht geladen werden.')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    syncParkings()

    return () => {
      isActive = false
    }
  }, [applyParkingResult, fetchParkings])

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshParkings()
    }, refreshSeconds * 1000)

    return () => window.clearInterval(interval)
  }, [refreshParkings, refreshSeconds])

  const statusCounts = useMemo(() => {
    return enrichedParkings.reduce(
      (accumulator, parking) => {
        accumulator.total += 1
        accumulator[parking.status] = (accumulator[parking.status] ?? 0) + 1
        return accumulator
      },
      { total: 0, open: 0, limited: 0, full: 0, unknown: 0 },
    )
  }, [enrichedParkings])

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Ride &amp; Park Live</p>
          <h1>Parksuche in Echtzeit, mit Zielradius und klaren Statusfarben.</h1>
          <p className="hero-text">
            OpenStreetMap zeigt freie, knappe und volle Standorte direkt auf der Karte.
            Die Daten werden automatisch aktualisiert, damit die Suche nicht auf alten
            Cache-Ständen hängen bleibt.
          </p>
        </div>

        <div className="status-strip">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Frei', value: statusCounts.open, fill: '#10b981' },
                  { name: 'Knapp', value: statusCounts.limited, fill: '#f59e0b' },
                  { name: 'Voll', value: statusCounts.full, fill: '#ef4444' },
                  { name: 'Unklar', value: statusCounts.unknown, fill: '#6b7280' },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
                <Cell fill="#6b7280" />
              </Pie>
              <RechartsTooltip 
                formatter={(value) => `${value} Parkhaus`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: '#374151', fontSize: '0.85rem', fontWeight: '600' }}>
                    {entry.payload.name}: {entry.payload.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </header>

      <main className="workspace">
        <section className="panel controls-panel">
          <div className="panel-header">
            <h2>Suche</h2>
            <button type="button" className="ghost-button" onClick={() => refreshParkings()}>
              Jetzt aktualisieren
            </button>
          </div>

          <form className="search-form" onSubmit={handleTargetSearch}>
            <label className="field">
              <span>Zieladresse oder Ort</span>
              <input
                type="text"
                value={targetQuery}
                onChange={(event) => setTargetQuery(event.target.value)}
                placeholder="z. B. Stuttgart Hbf"
              />
            </label>

            <label className="field">
              <span>Suchradius</span>
              <div className="range-row">
                <input
                  type="range"
                  min="1"
                  max="25" // hier anpassen. zu viel! Keiner läuft so weit
                  step="1"
                  value={radiusKm}
                  onChange={(event) => {
                    setLoading(true)
                    setRadiusKm(Number(event.target.value))
                  }}
                />
                <strong>{radiusKm} km</strong>
              </div>
            </label>

            <label className="field">
              <span>Auto-Refresh</span>
              <select
                value={refreshSeconds}
                onChange={(event) => setRefreshSeconds(Number(event.target.value))}
              >
                {REFRESH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    alle {option} s
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
                  onChange={(event) => {
                    setLoading(true)
                    setRealtimeOnly(event.target.checked)
                  }}
                />
                <span>Nur Echtzeitdaten anzeigen</span>
              </label>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={searching}>
                {searching ? 'Suche läuft...' : 'Ziel finden'}
              </button>
              <button type="button" className="secondary-button" onClick={handleResetTarget}>
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

        <section className="panel map-panel">
          <div className="map-frame">
            <ParkingMap
              parkings={enrichedParkings}
              target={target}
              radiusKm={radiusKm}
              selectedParking={selectedParking}
              onSelectParking={(parking) => setSelectedParkingId(parking.id)}
            />
          </div>
          {loading ? <div className="map-overlay">Lade aktuelle Parkdaten...</div> : null}
        </section>

        <section className="panel detail-panel">
          <div className="panel-header">
            <h2>Details</h2>
            <span className="inline-pill">
              {loading ? 'aktualisiert...' : `Refresh ${refreshSeconds}s`}
            </span>
          </div>

          {selectedParking ? (
            <article className="detail-card">
              <div className="detail-header">
                <div>
                  <h3>{selectedParking.name}</h3>
                  <p>{normalizeStatus(selectedParking.status)}</p>
                </div>
                <span
                  className="occupancy-dot"
                  style={{ backgroundColor: getOccupancyColor(selectedParking) }}
                />
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Freie Plätze</dt>
                  <dd>{formatNumber(selectedParking.free)}</dd>
                </div>
                <div>
                  <dt>Kapazität</dt>
                  <dd>{formatNumber(selectedParking.total)}</dd>
                </div>
                <div>
                  <dt>Auslastung</dt>
                  <dd>
                    {selectedParking.occupancyRate !== null
                      ? `${selectedParking.occupancyRate.toFixed(1)} %`
                      : 'k. A.'}
                  </dd>
                </div>
                <div>
                  <dt>Letzte Meldung</dt>
                  <dd>{formatDate(selectedParking.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Quelle</dt>
                  <dd>{selectedParking.source}</dd>
                </div>
                <div>
                  <dt>Entfernung</dt>
                  <dd>
                    {selectedParking.distanceKm !== null
                      ? `${selectedParking.distanceKm.toFixed(1)} km`
                      : 'kein Ziel gesetzt'}
                  </dd>
                </div>
              </dl>
            </article>
          ) : (
            <article className="detail-card muted-card">
              <h3>Keine Parkplätze gefunden</h3>
              <p>Erweitere den Radius oder suche ein anderes Ziel.</p>
            </article>
          )}

          <div className="list-panel">
            <h3>Trefferliste</h3>
            <div className="parking-list">
              {enrichedParkings.map((parking) => {
                const metrics = getParkingMetrics(parking)

                return (
                  <button
                    key={parking.id}
                    type="button"
                    className={`parking-row ${
                      selectedParking?.id === parking.id ? 'is-selected' : ''
                    }`}
                    onClick={() => setSelectedParkingId(parking.id)}
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
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
