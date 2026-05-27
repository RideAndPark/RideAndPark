import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { DEFAULT_CENTER } from '../../utils/constants'

export function MapControls({ parkings, target, radiusKm }) {
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
