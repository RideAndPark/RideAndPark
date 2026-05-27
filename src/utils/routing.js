/**
 * Fetch route coordinates from OSRM (Open Source Routing Machine)
 * Returns array of [lat, lng] coordinates or null if lookup fails
 * @param {number} fromLat - Start latitude
 * @param {number} fromLng - Start longitude
 * @param {number} toLat - End latitude
 * @param {number} toLng - End longitude
 * @param {AbortSignal} signal - Abort signal for fetch
 * @param {string} profile - Routing profile: 'driving', 'foot', or 'bike' (default: 'driving')
 */
export async function getRouteCoordinates(fromLat, fromLng, toLat, toLng, signal, profile = 'driving') {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
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
