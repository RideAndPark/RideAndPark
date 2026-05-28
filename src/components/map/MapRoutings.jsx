import { useEffect, useRef, useState } from 'react'
import { Polyline } from 'react-leaflet'
import { getRouteCoordinates } from '../../utils/routing'

export function MapRoutings({ userLocation, selectedParking, target }) {
  const [userToParkingRoute, setUserToParkingRoute] = useState(null)
  const [parkingToTargetRoute, setParkingToTargetRoute] = useState(null)
  const routeCache = useRef(new Map())

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    const getCachedOrFetchRoute = async (fromLat, fromLng, toLat, toLng, profile = 'driving') => {
      const key = `${fromLat},${fromLng}|${toLat},${toLng}|${profile}`
      if (routeCache.current.has(key)) {
        return routeCache.current.get(key)
      }

      const route = await getRouteCoordinates(fromLat, fromLng, toLat, toLng, controller.signal, profile)
      if (route) {
        routeCache.current.set(key, route)
      }
      return route
    }

    async function loadRoutes() {
      setUserToParkingRoute(null)
      setParkingToTargetRoute(null)

      // Route: Benutzer zu Parkhaus
      if (userLocation && selectedParking) {
        const route = await getCachedOrFetchRoute(
          userLocation.lat,
          userLocation.lng,
          selectedParking.lat,
          selectedParking.lng,
        )
        if (isMounted) {
          setUserToParkingRoute(route || [[userLocation.lat, userLocation.lng], [selectedParking.lat, selectedParking.lng]])
        }
      }

      // Route: Parkhaus zum Ziel (Fußgänger)
      if (target && selectedParking) {
        const route = await getCachedOrFetchRoute(
          selectedParking.lat,
          selectedParking.lng,
          target.lat,
          target.lng,
          'foot',
        )
        if (isMounted) {
          setParkingToTargetRoute(route || [[selectedParking.lat, selectedParking.lng], [target.lat, target.lng]])
        }
      }
    }

    loadRoutes()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [userLocation, selectedParking, target])

  return (
    <>
      {userToParkingRoute ? (
        <Polyline
          positions={userToParkingRoute}
          pathOptions={{ color: '#0066cc', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
        />
      ) : null}

      {parkingToTargetRoute ? (
        <Polyline
          positions={parkingToTargetRoute}
          pathOptions={{ color: '#ff5500', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
        />
      ) : null}
    </>
  )
}

export default MapRoutings
