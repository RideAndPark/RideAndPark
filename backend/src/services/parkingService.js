const { getSeedParkings } = require("../config/db");
const apiService = require("./apiService");
const { transform } = require("../utils/transformer");

let cache = {
  parkings: [],
  source: "uninitialized",
  loadedAt: null,
  warning: null
};

const DEFAULT_RADIUS_KM = 5;

function isFallbackAllowed() {
  return String(process.env.ALLOW_FALLBACK_DATA ?? "true").toLowerCase() === "true";
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
    radius_km: filters.radius_km ?? null
  });
}

function hasActiveFilters(filters = {}) {
  return Boolean(
    filters.name ||
      filters.source_uid ||
      filters.target_lat !== undefined ||
      filters.target_lng !== undefined ||
      filters.radius_km !== undefined
  );
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

function buildFilteredResult(data, filters, source, warning = null) {
  const filteredData = applyRadiusFilter(data, filters);

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

function buildFallbackResult(filters, warning) {
  const fallbackData = transform(getSeedParkings(), "seed");
  return buildFilteredResult(fallbackData, filters, "seed", warning);
}

async function loadParkings({ forceRefresh = false, filters = {} } = {}) {
  const cacheKey = getCacheKey(filters);

  if (!forceRefresh && !hasActiveFilters(filters) && cache.parkings.length > 0) {
    return {
      data: cache.parkings,
      meta: buildMeta()
    };
  }

  try {
    const rawData = await apiService.fetchParkingData(filters);

    if (rawData) {
      const transformed = transform(rawData, "external");

      if (transformed.length > 0) {
        const result = buildFilteredResult(transformed, filters, "external");

        if (!hasActiveFilters(filters)) {
          cache = {
            parkings: transformed,
            source: "external",
            loadedAt: result.meta.loadedAt,
            key: cacheKey,
            warning: null
          };
        }

        return result;
      }
    }
  } catch (error) {
    if (!isFallbackAllowed()) {
      throw error;
    }

    const result = buildFallbackResult(filters, `External source unavailable: ${error.message}`);

    if (!hasActiveFilters(filters)) {
      cache = {
        parkings: result.data,
        source: "seed",
        loadedAt: result.meta.loadedAt,
        key: cacheKey,
        warning: result.meta.warning
      };
    }

    return result;
  }

  if (!isFallbackAllowed()) {
    throw new Error("No external parking data available and fallback is disabled.");
  }

  const result = buildFallbackResult(
    filters,
    "External source returned no usable parking records."
  );

  if (!hasActiveFilters(filters)) {
    cache = {
      parkings: result.data,
      source: "seed",
      loadedAt: result.meta.loadedAt,
      key: cacheKey,
      warning: result.meta.warning
    };
  }

  return result;
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
