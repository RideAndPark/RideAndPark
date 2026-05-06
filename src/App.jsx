import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import './App.css'

const DEFAULT_CENTER = [48.1372, 11.5756]
const DEFAULT_RADIUS_KM = 3
const DEFAULT_REFRESH_SECONDS = 60
const REFRESH_OPTIONS = [60, 120, 300, 600, 900]

function ParkingDetailSkeleton() {
  return (
    <article className="detail-card skeleton-card">
      <div className="skeleton skeleton-bar" style={{ width: '60%' }} />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-bar" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div className="skeleton skeleton-bar" />
        <div className="skeleton skeleton-bar" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
      </div>
    </article>
  )
}

function ParkingListSkeleton() {
  return (
    <div className="list-panel">
      <h3>Trefferliste</h3>
      <div className="parking-list">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={`skeleton-${idx}`} className="skeleton-card skeleton" style={{ height: '80px', borderRadius: '12px' }} />
        ))}
      </div>
    </div>
  )
}

function SkeletonBox({ width = '100%', height = '20px', style = {} }) {
  return (
    <span 
      className="skeleton" 
      style={{ 
        height, 
        width, 
        borderRadius: '4px', 
        display: 'inline-block',
        ...style
      }} 
    />
  )
}

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

function formatRefreshInterval(seconds) {
  const minutes = seconds / 60
  if (minutes === 1) {
    return '1 Minute'
  }
  return `${minutes} Minuten`
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
    return '#ef4444'
  }

  if (parking.status === 'limited') {
    return '#f59e0b'
  }

  if (parking.status === 'open') {
    return '#10b981'
  }

  if (parking.occupancyRate !== null && parking.occupancyRate !== undefined) {
    if (parking.occupancyRate >= 95) {
      return '#ef4444'
    }

    if (parking.occupancyRate >= 80) {
      return '#f59e0b'
    }

    return '#10b981'
  }

  return '#6b7280'
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

function getParkingMetrics(parking) {
  const free = parking.realtime_free_capacity ?? parking.free ?? 0
  const total = parking.capacity ?? parking.total ?? 0
  const occupancy = parking.occupancyRate ?? 0

  return {
    freeLabel: `${formatNumber(free)} frei`,
    totalLabel: `${formatNumber(total)} insgesamt`,
    occupancyLabel: `${occupancy.toFixed(1)}% Auslastung`,
  }
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

async function getRouteCoordinates(fromLat, fromLng, toLat, toLng) {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    )
    
    if (!response.ok) {
      throw new Error('Routing failed')
    }
    
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates
      return coordinates.map(([lng, lat]) => [lat, lng])
    }
    
    return null
  } catch (error) {
    console.warn('Route lookup failed, using straight line:', error)
    return null
  }
}

function RouteLines({ userLocation, selectedParking, target }) {
  const [userToParkingRoute, setUserToParkingRoute] = useState(null)
  const [parkingToTargetRoute, setParkingToTargetRoute] = useState(null)

  useEffect(() => {
    async function loadRoutes() {
      setUserToParkingRoute(null)
      setParkingToTargetRoute(null)

      // Route: Benutzer → Parkhaus
      if (userLocation && selectedParking) {
        const route = await getRouteCoordinates(
          userLocation.lat,
          userLocation.lng,
          selectedParking.lat,
          selectedParking.lng
        )
        setUserToParkingRoute(route || [[userLocation.lat, userLocation.lng], [selectedParking.lat, selectedParking.lng]])
      }

      // Route: Parkhaus → Ziel
      if (target && selectedParking) {
        const route = await getRouteCoordinates(
          selectedParking.lat,
          selectedParking.lng,
          target.lat,
          target.lng
        )
        setParkingToTargetRoute(route || [[selectedParking.lat, selectedParking.lng], [target.lat, target.lng]])
      }
    }

    loadRoutes()
  }, [userLocation, selectedParking, target])

  return (
    <>
      {userToParkingRoute ? (
        <Polyline
          positions={userToParkingRoute}
          pathOptions={{ color: '#0066cc', weight: 3, opacity: 0.8 }}
        />
      ) : null}

      {parkingToTargetRoute ? (
        <Polyline
          positions={parkingToTargetRoute}
          pathOptions={{ color: '#ff8c00', weight: 3, opacity: 0.8 }}
        />
      ) : null}
    </>
  )
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

function ParkingMap({ parkings, target, radiusKm, selectedParking, onSelectParking, userLocation }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className="map-canvas" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitMapToData parkings={parkings} target={target} radiusKm={radiusKm} />

      {/* Echte Straßen-Routes */}
      <RouteLines userLocation={userLocation} selectedParking={selectedParking} target={target} />

      {/* Benutzer-Position */}
      {userLocation ? (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={6}
          pathOptions={{ color: '#0066cc', fillColor: '#0066cc', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent>
            Dein Standort
          </Tooltip>
        </CircleMarker>
      ) : null}

      {target ? (
        <>
          <Circle
            center={[target.lat, target.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#0066cc', fillColor: '#e6f0ff', fillOpacity: 0.08 }}
          />
          <CircleMarker
            center={[target.lat, target.lng]}
            radius={8}
            pathOptions={{ color: '#0052a3', fillColor: '#0066cc', fillOpacity: 1, weight: 2 }}
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
              {parking.openingHours ? (
                <>
                  <br />
                  <small>Öffnungszeiten: {parking.openingHours}</small>
                </>
              ) : null}
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
  const [userLocation, setUserLocation] = useState(null)
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [refreshSeconds, setRefreshSeconds] = useState(DEFAULT_REFRESH_SECONDS)
  const [realtimeOnly, setRealtimeOnly] = useState(true)
  const [onlyOpenParkings, setOnlyOpenParkings] = useState(false)
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

    if (onlyOpenParkings) {
      params.set('onlyOpen', 'true')
    }

    const query = params.toString()
    const response = await fetch(query ? `/api/parkings?${query}` : '/api/parkings')

    if (!response.ok) {
      throw new Error(`API-Fehler ${response.status}`)
    }

    return response.json()
  }, [radiusKm, realtimeOnly, onlyOpenParkings, target])

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

  const refreshStatisticsOnly = useCallback(async () => {
    try {
      const response = await fetch('/api/statistics')
      
      if (!response.ok) {
        throw new Error(`API-Fehler ${response.status}`)
      }

      const result = await response.json()
      const stats = result.data ?? {}

      setMeta((prevMeta) => ({
        ...prevMeta,
        stats,
        lastUpdated: result.meta?.loadedAt ?? new Date().toISOString(),
      }))
    } catch (error) {
      console.warn('Statistics refresh failed:', error.message)
    }
  }, [])

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
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.warn('Geolocation error:', error.message)
        }
      )
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshStatisticsOnly()
    }, refreshSeconds * 1000)

    return () => window.clearInterval(interval)
  }, [refreshStatisticsOnly, refreshSeconds])

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
                  max="3"
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
                  onChange={(event) => {
                    setLoading(true)
                    setRealtimeOnly(event.target.checked)
                  }}
                />
                <span>Nur Echtzeitdaten anzeigen</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={onlyOpenParkings}
                  onChange={(event) => {
                    setLoading(true)
                    setOnlyOpenParkings(event.target.checked)
                  }}
                />
                <span>Nur offene Parkplätze anzeigen</span>
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
              userLocation={userLocation}
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
          ) : (
            <article className="detail-card muted-card">
              <h3>Keine Parkplätze gefunden</h3>
              <p>Erweitere den Radius oder suche ein anderes Ziel.</p>
            </article>
          )}

          <div className="list-panel">
            <h3>Trefferliste</h3>
            <div className="parking-list">
              {loading && enrichedParkings.length === 0 ? (
                [...Array(5)].map((_, idx) => (
                  <div key={`skeleton-${idx}`} className="skeleton-card skeleton" style={{ height: '80px', borderRadius: '12px' }} />
                ))
              ) : enrichedParkings.length > 0 ? (
                enrichedParkings.map((parking) => {
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
                        {parking.openingHours ? (
                          <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                            {parking.openingHours}
                          </small>
                        ) : null}
                      </span>
                    </button>
                  )
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Keine Parkplätze gefunden
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
