import { useEffect, useRef } from 'react'

// Placeholder component für Leaflet Map - wird später implementiert
export function MapPlaceholder() {
  const mapContainer = useRef(null)

  useEffect(() => {
    // TODO: Hier wird später die Leaflet Map initialisiert
    // import L from 'leaflet'
    // const map = L.map(mapContainer.current).setView([51.505, -0.09], 13)
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
  }, [])

  return <div ref={mapContainer} className="map-container" />
}
