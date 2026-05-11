import { useEffect, useState } from 'react'

/**
 * Hook zum Laden des Benutzer-Standorts (einmalig)
 */
export function useUserLocation() {
  const [userLocation, setUserLocation] = useState(null)

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

  return userLocation
}
