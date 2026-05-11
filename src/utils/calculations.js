const numberFormatter = new Intl.NumberFormat('de-DE')

function safeFormatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'k. A.'
  }
  return numberFormatter.format(value)
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(fromLat, fromLng, toLat, toLng) {
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const latDiff = toRadians(toLat - fromLat)
  const lngDiff = toRadians(toLng - fromLng)
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDiff / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Get occupancy color based on parking status or occupancy rate
 */
export function getOccupancyColor(parking) {
  if (parking.status === 'full') {
    return '#ef4444'
  }

  if (parking.status === 'limited') {
    return '#f59e0b'
  }

  if (parking.status === 'open') {
    return '#10b981'
  }

  if (parking.occupancyRate !== null && parking.occupancyRate !== undefined) {
    if (parking.occupancyRate >= 95) {
      return '#ef4444'
    }

    if (parking.occupancyRate >= 80) {
      return '#f59e0b'
    }

    return '#10b981'
  }

  return '#6b7280'
}

/**
 * Get marker radius based on parking capacity
 */
export function getMarkerRadius(parking) {
  if (parking.total && parking.total >= 500) {
    return 13
  }

  if (parking.total && parking.total >= 200) {
    return 11
  }

  return 9
}

/**
 * Get parking metrics formatiert als Labels
 */
export function getParkingMetrics(parking) {
  const free = parking.realtime_free_capacity ?? parking.free ?? 0
  const total = parking.capacity ?? parking.total ?? 0
  const occupancy = parking.occupancyRate ?? 0

  return {
    freeLabel: `${safeFormatNumber(free)} frei`,
    totalLabel: `${safeFormatNumber(total)} insgesamt`,
    occupancyLabel: `${occupancy.toFixed(1)}% Auslastung`,
  }
}
