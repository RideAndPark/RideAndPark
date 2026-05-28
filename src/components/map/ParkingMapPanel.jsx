import { lazy, Suspense, useState } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
} from 'react-leaflet'
import { DEFAULT_CENTER, MAP_THEMES } from '../../utils/constants'
import { MapControls } from './MapControls'
import { MapMarkers } from './MapMarkers'
import { MapLoader } from './loaders/MapLoader'

const MapRoutings = lazy(() =>
  import('./MapRoutings').then((m) => ({ default: m.MapRoutings })),
)

function ParkingMap({
  parkings,
  target,
  radiusKm,
  selectedParking,
  onSelectParking,
  userLocation,
  mapTheme,
}) {
  const theme = MAP_THEMES[mapTheme] || MAP_THEMES.osm
  
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className="map-canvas" scrollWheelZoom>
      <TileLayer
        attribution={theme.attribution}
        url={theme.url}
      />

      <MapControls parkings={parkings} target={target} radiusKm={radiusKm} />

      {selectedParking && (target || userLocation) ? (
        <Suspense fallback={<MapLoader />}>
          <MapRoutings userLocation={userLocation} selectedParking={selectedParking} target={target} />
        </Suspense>
      ) : null}

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

      <MapMarkers parkings={parkings} selectedParking={selectedParking} onSelectParking={onSelectParking} />
    </MapContainer>
  )
}

export function ParkingMapPanel({
  parkings,
  target,
  radiusKm,
  selectedParking,
  onSelectParking,
  userLocation,
  loading,
  mapTheme,
  onMapThemeChange,
}) {
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)

  const handleThemeChange = (themeId) => {
    onMapThemeChange(themeId)
    setShowThemeDropdown(false)
  }

  return (
    <section className="panel map-panel">
      <div className="map-frame">
        <ParkingMap
          parkings={parkings}
          target={target}
          radiusKm={radiusKm}
          selectedParking={selectedParking}
          onSelectParking={onSelectParking}
          userLocation={userLocation}
          mapTheme={mapTheme}
        />
        
        <div className="theme-switcher-map">
          <button
            className="theme-switcher-button"
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            title="Kartenstil ändern"
            aria-label="Kartenstil ändern"
          >
            ⚙
          </button>

          {showThemeDropdown && (
            <div className="theme-dropdown">
              {Object.entries(MAP_THEMES).map(([themeId, theme]) => (
                <button
                  key={themeId}
                  className={`theme-option ${mapTheme === themeId ? 'is-selected' : ''}`}
                  onClick={() => handleThemeChange(themeId)}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {loading ? <div className="map-overlay">Lade aktuelle Parkdaten...</div> : null}
    </section>
  )
}
