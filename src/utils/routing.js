/**
 * Fetch route coordinates from OSRM (Open Source Routing Machine)
 * Returns array of [lat, lng] coordinates or null if lookup fails
 */
export async function getRouteCoordinates(fromLat, fromLng, toLat, toLng, signal) {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
      { signal },
    )
    
    if (!response.ok) {
      throw new Error('Routing failed')
    }
    
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates
      return coordinates.map(([lng, lat]) => [lat, lng])
    }
    
    return null
  } catch (error) {
    if (error?.name === 'AbortError') {
      return null
    }
    console.warn('Route lookup failed, using straight line:', error)
    return null
  }
}
