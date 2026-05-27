import { useCallback, useEffect, useState } from 'react'

/**
 * Hook zum Laden von Parkplatz-Daten
 */
export function useParkingData() {
  const [parkings, setParkings] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchParkings = useCallback(async (target, radiusKm, realtimeOnly, onlyOpenParkings) => {
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
  }, [])

  const refreshParkings = useCallback(async (target, radiusKm, realtimeOnly, onlyOpenParkings) => {
    setLoading(true)
    setError('')

    try {
      const result = await fetchParkings(target, radiusKm, realtimeOnly, onlyOpenParkings)
      setParkings(result.data ?? [])
      setMeta(result.meta ?? null)
    } catch (loadError) {
      setError(loadError.message ?? 'Parkplätze konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [fetchParkings])

  // Initial load
  useEffect(() => {
    let isActive = true

    async function initialLoad() {
      try {
        setError('')
        const result = await fetchParkings(null, 3, true, false)

        if (isActive) {
          setParkings(result.data ?? [])
          setMeta(result.meta ?? null)
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

    initialLoad()

    return () => {
      isActive = false
    }
  }, [fetchParkings])

  return {
    parkings,
    setParkings,
    meta,
    setMeta,
    loading,
    error,
    refreshParkings,
  }
}
