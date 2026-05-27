const baseParkings = [
  {
    id: 'p-open',
    name: 'Open Central Garage',
    lat: 48.7758,
    lng: 9.1829,
    free: 120,
    total: 300,
    occupancyRate: 60,
    openingHours: '24/7',
    status: 'open',
    realtimeData: true,
    source: 'provider-a',
    updatedAt: '2026-05-26T10:00:00.000Z',
  },
  {
    id: 'p-limited',
    name: 'Limited City Parking',
    lat: 48.7795,
    lng: 9.18,
    free: 10,
    total: 100,
    occupancyRate: 90,
    openingHours: 'Mo-Su 06:00-23:00',
    status: 'limited',
    realtimeData: true,
    source: 'provider-a',
    updatedAt: '2026-05-26T10:01:00.000Z',
  },
  {
    id: 'p-full',
    name: 'Full Remote Parking',
    lat: 48.812,
    lng: 9.28,
    free: 0,
    total: 120,
    occupancyRate: 100,
    openingHours: 'Mo-Su 00:00-24:00',
    status: 'full',
    realtimeData: false,
    source: 'provider-b',
    updatedAt: '2026-05-26T10:02:00.000Z',
  },
]

function buildMeta(data, filters = {}) {
  return {
    source: 'mock',
    count: data.length,
    loadedAt: '2026-05-26T10:05:00.000Z',
    filters,
    warning: null,
  }
}

function buildStatisticsResponse() {
  return {
    data: {
      total: 3,
      open: 1,
      limited: 1,
      full: 1,
      unknown: 0,
    },
    meta: {
      source: 'mock',
      loadedAt: '2026-05-26T10:05:30.000Z',
      warning: null,
    },
  }
}

function filterParkings(searchParams) {
  let filtered = [...baseParkings]

  if (searchParams.get('realtimeData') === 'true') {
    filtered = filtered.filter((parking) => parking.realtimeData)
  }

  if (searchParams.get('onlyOpen') === 'true') {
    filtered = filtered.filter((parking) => parking.status === 'open')
  }

  const targetLat = searchParams.get('target_lat')
  const targetLng = searchParams.get('target_lng')

  if (targetLat && targetLng) {
    filtered = filtered.filter((parking) => parking.id !== 'p-full')
  }

  return filtered
}

export async function registerApiMocks(page, options = {}) {
  await page.route('**/api/parkings**', async (route) => {
    const url = new URL(route.request().url())
    const data = filterParkings(url.searchParams)

    await route.fulfill({
      status: options.parkingsStatus || 200,
      contentType: 'application/json',
      body:
        options.parkingsStatus && options.parkingsStatus !== 200
          ? JSON.stringify({
              error: `API-Fehler ${options.parkingsStatus}`,
            })
          : JSON.stringify({
              data,
              meta: buildMeta(data, Object.fromEntries(url.searchParams.entries())),
            }),
    })
  })

  await page.route('**/api/statistics', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildStatisticsResponse()),
    })
  })

  await page.route('**/api/geocode**', async (route) => {
    const url = new URL(route.request().url())
    const query = url.searchParams.get('q')

    await route.fulfill({
      status: options.geocodeStatus || 200,
      contentType: 'application/json',
      body:
        options.geocodeStatus && options.geocodeStatus !== 200
          ? JSON.stringify({
              error: `Geocoding fehlgeschlagen (${options.geocodeStatus})`,
            })
          : JSON.stringify({
              lat: 48.7784,
              lng: 9.18,
              label: query === 'Stuttgart Hbf' ? 'Stuttgart Hauptbahnhof' : 'Mock Destination',
            }),
    })
  })
}
