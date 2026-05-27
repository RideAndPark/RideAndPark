import { useCallback, useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react'
import './App.css'

// Utils
import { DEFAULT_RADIUS_KM, DEFAULT_REFRESH_SECONDS, DEFAULT_THEME } from './utils/constants'

// Hooks (State-Logik separiert!)
import { useParkingData } from './hooks/useParkingData'
import { useParkingEnrichment } from './hooks/useParkingEnrichment'
import { useUserLocation } from './hooks/useUserLocation'
import { useGeocoding } from './hooks/useGeocoding'
import { useRefreshTimer, useRefreshStatistics } from './hooks/useRefreshTimer'

// Components
import { SearchPanel } from './components/search/SearchPanel'
import { Header } from './components/layout/Header'
import { MainLayout } from './components/layout/MainLayout'
import { DetailPanel } from './components/detail/DetailPanel'
import { ParkingListView } from './components/detail/ParkingListView'
import { MapLoader } from './components/map/loaders/MapLoader'

const ParkingMapPanel = lazy(() =>
  import('./components/map/ParkingMapPanel').then((m) => ({ default: m.ParkingMapPanel })),
)

function App() {
  // State Management via Custom Hooks (Separiert für bessere Performance!)
  const { parkings, meta, setMeta, loading, error, refreshParkings } = useParkingData()
  const { target, searching, searchError, searchTarget, resetTarget } = useGeocoding()
  const userLocation = useUserLocation()

  // UI State
  const [selectedParkingId, setSelectedParkingId] = useState(null)
  const [targetQuery, setTargetQuery] = useState('Stuttgart Hauptbahnhof')
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [refreshSeconds, setRefreshSeconds] = useState(DEFAULT_REFRESH_SECONDS)
  const [realtimeOnly, setRealtimeOnly] = useState(true)
  const [onlyOpenParkings, setOnlyOpenParkings] = useState(false)
  const [renderMap, setRenderMap] = useState(false)
  const [mapTheme, setMapTheme] = useState(() => {
    // Laden des Themes aus localStorage oder Fallback zu DEFAULT_THEME
    const savedTheme = localStorage.getItem('mapTheme')
    return savedTheme || DEFAULT_THEME
  })
  const mapMountRef = useRef(null)

  // Enrichment: Sortierung + Distanzberechnung (MEMOIZED)
  const enrichedParkings = useParkingEnrichment(parkings, target)

  // Selected Parking (stabil über useMemo)
  const selectedParking = useMemo(
    () =>
      enrichedParkings.find((parking) => parking.id === selectedParkingId) ??
      enrichedParkings[0] ??
      null,
    [enrichedParkings, selectedParkingId],
  )

  // Parking Status Counts (MEMOIZED - Pie Chart Daten)
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

  // Refresh Statistics Hook (SEPARIERT von Parkings-Refresh!)
  const refreshStatistics = useRefreshStatistics(setMeta)

  // Auto-Refresh Timer für Statistics (nicht Parkings!)
  useRefreshTimer(refreshSeconds, refreshStatistics)

  // Handle Target Search
  const handleTargetSearch = useCallback(async (event) => {
    event.preventDefault()
    await searchTarget(targetQuery)
  }, [searchTarget, targetQuery])

  // Refresh Parkings wenn Filter sich ändern
  useEffect(() => {
    refreshParkings(target, radiusKm, realtimeOnly, onlyOpenParkings)
  }, [target, radiusKm, realtimeOnly, onlyOpenParkings, refreshParkings])

  // Speichern des Map-Themes in localStorage
  useEffect(() => {
    localStorage.setItem('mapTheme', mapTheme)
  }, [mapTheme])

  // Leaflet wird erst geladen, wenn die Karte sichtbar wird oder kurz davor steht.
  useEffect(() => {
    if (renderMap) {
      return undefined
    }

    const mountNode = mapMountRef.current

    if (!mountNode || !('IntersectionObserver' in window)) {
      const fallbackTimer = window.setTimeout(() => setRenderMap(true), 800)
      return () => window.clearTimeout(fallbackTimer)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRenderMap(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 },
    )

    observer.observe(mountNode)

    return () => {
      observer.disconnect()
    }
  }, [renderMap])

  // Manuelles Refresh Callback
  const handleRefreshNow = useCallback(() => {
    refreshParkings(target, radiusKm, realtimeOnly, onlyOpenParkings)
  }, [refreshParkings, target, radiusKm, realtimeOnly, onlyOpenParkings])

  return (
    <div className="shell">
      <Header statusCounts={statusCounts} mapTheme={mapTheme} onMapThemeChange={setMapTheme} />

      <MainLayout>
        <SearchPanel
          targetQuery={targetQuery}
          onTargetQueryChange={setTargetQuery}
          target={target}
          onTargetSearch={handleTargetSearch}
          onResetTarget={() => {
            resetTarget()
            setTargetQuery('')
          }}
          searching={searching}
          radiusKm={radiusKm}
          onRadiusChange={(value) => setRadiusKm(value)}
          refreshSeconds={refreshSeconds}
          onRefreshSecondsChange={setRefreshSeconds}
          realtimeOnly={realtimeOnly}
          onRealtimeOnlyChange={setRealtimeOnly}
          onlyOpenParkings={onlyOpenParkings}
          onOnlyOpenParkingsChange={setOnlyOpenParkings}
          onRefreshNow={handleRefreshNow}
          meta={meta}
          searchError={searchError}
          error={error}
        />

        <div ref={mapMountRef} className="map-mount">
          {renderMap ? (
          <Suspense fallback={<MapLoader />}>
            <ParkingMapPanel
              parkings={enrichedParkings}
              target={target}
              radiusKm={radiusKm}
              selectedParking={selectedParking}
              onSelectParking={(parking) => setSelectedParkingId(parking.id)}
              userLocation={userLocation}
              loading={loading}
              mapTheme={mapTheme}
              onMapThemeChange={setMapTheme}
            />
          </Suspense>
          ) : (
          <section className="panel map-panel">
            <div className="map-frame map-loading-placeholder">Karte wird optimiert geladen...</div>
          </section>
          )}
        </div>

        <section className="panel detail-panel">
          <div className="panel-header">
            <h2>Details</h2>
            <span className="inline-pill">
              {loading ? 'aktualisiert...' : `Refresh ${refreshSeconds}s`}
            </span>
          </div>

          <DetailPanel selectedParking={selectedParking} loading={loading} />

          <ParkingListView
            enrichedParkings={enrichedParkings}
            selectedParking={selectedParking}
            onSelectParking={setSelectedParkingId}
            loading={loading}
          />
        </section>
      </MainLayout>
    </div>
  )
}

export default App
