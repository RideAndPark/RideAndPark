const { getSeedParkings } = require("../config/db");
const apiService = require("./apiService");
const { transform } = require("../utils/transformer");

let cache = {
  parkings: [],
  source: "uninitialized",
  loadedAt: null,
  warning: null
};
let pendingLoad = null;

const DEFAULT_RADIUS_KM = 5;
const DEFAULT_CACHE_TTL_MS = 30000;

function isFallbackAllowed() {
  return String(process.env.ALLOW_FALLBACK_DATA ?? "true").toLowerCase() === "true";
}

function getCacheTtlMs() {
  const configuredTtl = Number(process.env.PARKING_CACHE_TTL_MS);
  return Number.isFinite(configuredTtl) && configuredTtl >= 0
    ? configuredTtl
    : DEFAULT_CACHE_TTL_MS;
}

function buildMeta() {
  return {
    source: cache.source,
    count: cache.parkings.length,
    loadedAt: cache.loadedAt,
    warning: cache.warning
  };
}

function getCacheKey(filters = {}) {
  return JSON.stringify({
    name: filters.name ?? null,
    source_uid: filters.source_uid ?? null,
    target_lat: filters.target_lat ?? null,
    target_lng: filters.target_lng ?? null,
    radius_km: filters.radius_km ?? null,
    realtimeData: filters.realtimeData ?? null
  });
}

function hasActiveFilters(filters = {}) {
  return Boolean(
    filters.name ||
      filters.source_uid ||
      filters.realtimeData !== undefined ||
      filters.target_lat !== undefined ||
      filters.target_lng !== undefined ||
      filters.radius_km !== undefined
  );
}

function isCacheFresh() {
  if (!cache.loadedAt) {
    return false;
  }

  return Date.now() - new Date(cache.loadedAt).getTime() < getCacheTtlMs();
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(fromLat, fromLng, toLat, toLng) {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(toLat - fromLat);
  const lngDiff = toRadians(toLng - fromLng);
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDiff / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function applyRadiusFilter(parkings, filters = {}) {
  const hasTargetCoordinates =
    filters.target_lat !== undefined && filters.target_lng !== undefined;

  if (!hasTargetCoordinates) {
    return parkings;
  }

  const radiusKm = filters.radius_km ?? DEFAULT_RADIUS_KM;

  return parkings.filter((parking) => {
    const distanceKm = calculateDistanceKm(
      filters.target_lat,
      filters.target_lng,
      parking.lat,
      parking.lng
    );

    return distanceKm <= radiusKm;
  });
}

function applyNameFilter(parkings, filters = {}) {
  if (!filters.name) {
    return parkings;
  }

  const normalizedName = String(filters.name).trim().toLowerCase();

  if (!normalizedName) {
    return parkings;
  }

  return parkings.filter((parking) => parking.name.toLowerCase().includes(normalizedName));
}

function applySourceFilter(parkings, filters = {}) {
  if (!filters.source_uid) {
    return parkings;
  }

  const normalizedSource = String(filters.source_uid).trim().toLowerCase();

  if (!normalizedSource) {
    return parkings;
  }

  return parkings.filter((parking) => parking.source.toLowerCase() === normalizedSource);
}

function applyRealtimeFilter(parkings, filters = {}) {
  if (filters.realtimeData !== true) {
    return parkings;
  }

  return parkings.filter((parking) => parking.realtimeData === true);
}

function buildFilteredResult(data, filters, source, warning = null) {
  const filteredData = applyRadiusFilter(
    applyRealtimeFilter(applySourceFilter(applyNameFilter(data, filters), filters), filters),
    filters
  );

  return {
    data: filteredData,
    meta: {
      source,
      count: filteredData.length,
      loadedAt: new Date().toISOString(),
      filters: {
        ...filters,
        radius_km:
          filters.target_lat !== undefined && filters.target_lng !== undefined
            ? filters.radius_km ?? DEFAULT_RADIUS_KM
            : filters.radius_km
      },
      warning
    }
  };
}

function storeCache(parkings, source, loadedAt, warning = null) {
  cache = {
    parkings,
    source,
    loadedAt,
    warning
  };
}

function buildFallbackResult(filters, warning) {
  const fallbackData = transform(getSeedParkings(), "seed");
  return buildFilteredResult(fallbackData, filters, "seed", warning);
}

async function fetchAndCacheParkings() {
  try {
    const rawData = await apiService.fetchParkingData();

    if (rawData) {
      const transformed = transform(rawData, "external");

      if (transformed.length > 0) {
        const loadedAt = new Date().toISOString();
        storeCache(transformed, "external", loadedAt);

        return {
          data: transformed,
          source: "external",
          loadedAt,
          warning: null
        };
      }
    }
  } catch (error) {
    if (!isFallbackAllowed()) {
      throw error;
    }

    const fallbackData = transform(getSeedParkings(), "seed");
    const loadedAt = new Date().toISOString();
    const warning = `External source unavailable: ${error.message}`;
    storeCache(fallbackData, "seed", loadedAt, warning);

    return {
      data: fallbackData,
      source: "seed",
      loadedAt,
      warning
    };
  }

  if (!isFallbackAllowed()) {
    throw new Error("No external parking data available and fallback is disabled.");
  }

  const fallbackData = transform(getSeedParkings(), "seed");
  const loadedAt = new Date().toISOString();
  const warning = "External source returned no usable parking records.";
  storeCache(fallbackData, "seed", loadedAt, warning);

  return {
    data: fallbackData,
    source: "seed",
    loadedAt,
    warning
  };
}

async function getBaseParkings(forceRefresh = false) {
  if (!forceRefresh && cache.parkings.length > 0 && isCacheFresh()) {
    return {
      data: cache.parkings,
      source: cache.source,
      loadedAt: cache.loadedAt,
      warning: cache.warning
    };
  }

  if (!forceRefresh && pendingLoad) {
    return pendingLoad;
  }

  pendingLoad = fetchAndCacheParkings();

  try {
    return await pendingLoad;
  } finally {
    pendingLoad = null;
  }
}

async function loadParkings({ forceRefresh = false, filters = {} } = {}) {
  const baseResult = await getBaseParkings(forceRefresh);

  if (!hasActiveFilters(filters)) {
    return {
      data: baseResult.data,
      meta: buildMeta()
    };
  }

  return buildFilteredResult(
    baseResult.data,
    filters,
    baseResult.source,
    baseResult.warning
  );
}

async function getProcessedParkings(filters = {}) {
  return loadParkings({ filters });
}

async function refreshParkings() {
  return loadParkings({ forceRefresh: true });
}

async function getParkingById(id) {
  try {
    const rawData = await apiService.fetchParkingById(id);
    const parking = transform([rawData], "external")[0];

    if (parking) {
      return {
        data: parking,
        meta: {
          source: "external",
          loadedAt: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    if (!isFallbackAllowed()) {
      throw error;
    }
  }

  const { data, meta } = await loadParkings();
  const parking = data.find((item) => item.id === id);

  if (!parking) {
    return null;
  }

  return {
    data: parking,
    meta
  };
}

module.exports = {
  getProcessedParkings,
  getParkingById,
  refreshParkings
};
