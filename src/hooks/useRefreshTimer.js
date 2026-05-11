import { useCallback, useEffect } from 'react'

/**
 * Hook für periodisches Aktualisieren von Statistiken (SEPARIERT von Parkings-Update!)
 */
export function useRefreshTimer(refreshSeconds, onRefreshStatistics) {
  useEffect(() => {
    const interval = window.setInterval(() => {
      onRefreshStatistics()
    }, refreshSeconds * 1000)

    return () => window.clearInterval(interval)
  }, [refreshSeconds, onRefreshStatistics])
}

/**
 * Hook zum manuellen Auffrischen von Statistiken
 * Ruft nur /api/statistics auf, nicht /api/parkings
 */
export function useRefreshStatistics(setMeta) {
  return useCallback(async () => {
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
  }, [setMeta])
}
