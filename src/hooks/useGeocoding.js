import { useCallback, useState } from 'react'

/**
 * Hook für Geocoding (Adressenauflösung zu Koordinaten)
 */
export function useGeocoding() {
  const [target, setTarget] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const searchTarget = useCallback(async (query) => {
    setSearching(true)
    setSearchError('')

    try {
      const params = new URLSearchParams({ q: query })
      const response = await fetch(`/api/geocode?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Geocoding fehlgeschlagen (${response.status})`)
      }

      const result = await response.json()

      setTarget({
        lat: Number(result.lat),
        lng: Number(result.lng),
        label: result.label,
      })
    } catch (geocodeError) {
      setSearchError(geocodeError.message ?? 'Ziel konnte nicht aufgelöst werden.')
      setTarget(null)
    } finally {
      setSearching(false)
    }
  }, [])

  const resetTarget = useCallback(() => {
    setTarget(null)
    setSearchError('')
  }, [])

  return {
    target,
    setTarget,
    searching,
    searchError,
    searchTarget,
    resetTarget,
  }
}
