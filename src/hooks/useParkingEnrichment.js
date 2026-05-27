import { useMemo } from 'react'
import { calculateDistanceKm } from '../utils/calculations'

/**
 * Hook zur Anreicherung von Parkplatz-Daten (Distanzberechnung, Sortierung)
 */
export function useParkingEnrichment(parkings, target) {
  return useMemo(() => {
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
}
