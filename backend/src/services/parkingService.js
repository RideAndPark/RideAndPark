const { getSeedParkings } = require("../config/db");
const apiService = require("./apiService");
const { transform } = require("../utils/transformer");

let cache = {
  parkings: [],
  source: "uninitialized",
  loadedAt: null,
  warning: null
};

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
    source_uid: filters.source_uid ?? null
  });
}

function hasActiveFilters(filters = {}) {
  return Boolean(filters.name || filters.source_uid);
}

function buildFallbackResult(filters, warning) {
  const fallbackData = transform(getSeedParkings(), "seed");

  return {
    data: fallbackData,
    meta: {
      source: "seed",
      count: fallbackData.length,
      loadedAt: new Date().toISOString(),
      filters,
      warning
    }
  };
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
        const result = {
          data: transformed,
          meta: {
            source: "external",
            count: transformed.length,
            loadedAt: new Date().toISOString(),
            filters,
            warning: null
          }
        };

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
