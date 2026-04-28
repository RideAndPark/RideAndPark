const { createParkingModel } = require("../models/parkingModel");

function asNumber(value) {
  if (typeof value === "string") {
    const normalizedValue = value.trim().replace(",", ".");
    const numeric = Number(normalizedValue);
    return Number.isFinite(numeric) ? numeric : null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function pickFirst(item, keys) {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && item[key] !== "") {
      return item[key];
    }
  }

  return null;
}

function deepPick(input, keys, maxDepth = 5, visited = new WeakSet()) {
  if (!input || typeof input !== "object" || maxDepth < 0) {
    return null;
  }

  if (visited.has(input)) {
    return null;
  }

  visited.add(input);

  const directValue = pickFirst(input, keys);

  if (directValue !== null) {
    return directValue;
  }

  const values = Array.isArray(input) ? input : Object.values(input);

  for (const value of values) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const nestedValue = deepPick(value, keys, maxDepth - 1, visited);

    if (nestedValue !== null) {
      return nestedValue;
    }
  }

  return null;
}

function clampPercentage(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, value));
}

function normalizeStatus(sourceStatus) {
  if (!sourceStatus) {
    return null;
  }

  const normalized = String(sourceStatus).trim().toLowerCase();

  if (
    [
      "full",
      "closed",
      "closedforentry",
      "closed_for_entry",
      "notavailable",
      "unavailable",
      "fullyoccupied"
    ].includes(normalized)
  ) {
    return "full";
  }

  if (
    [
      "almostfull",
      "almost_full",
      "limited",
      "few",
      "low",
      "busy"
    ].includes(normalized)
  ) {
    return "limited";
  }

  if (
    [
      "open",
      "spacesavailable",
      "spaces_available",
      "available",
      "free",
      "plenty"
    ].includes(normalized)
  ) {
    return "open";
  }

  return normalized;
}

function hasRealtimeData(item, fallbackSource, free, total, occupancyRate, normalizedStatus) {
  if (fallbackSource !== "external") {
    return false;
  }

  if (!item || typeof item !== "object") {
    return false;
  }

  const realtimeFlag = deepPick(item, [
    "realtimeData",
    "realTimeData",
    "hasRealtimeData",
    "isRealtime",
    "live",
    "isLive"
  ]);

  if (typeof realtimeFlag === "boolean") {
    return realtimeFlag;
  }

  const realtimeStatus = deepPick(item, [
    "parkingStatusOriginTime",
    "publicationTime",
    "lastUpdated",
    "updatedAt",
    "parkingNumberOfVacantSpaces",
    "parking_number_of_vacant_spaces",
    "parkingNumberOfOccupiedSpaces",
    "parking_number_of_occupied_spaces",
    "occupancyRate",
    "occupancy_rate",
    "parkingOccupancy",
    "parking_occupancy"
  ]);

  if (realtimeStatus !== null) {
    return true;
  }

  return Boolean(
    free !== null ||
      total !== null ||
      occupancyRate !== null ||
      normalizedStatus === "open" ||
      normalizedStatus === "limited" ||
      normalizedStatus === "full"
  );
}

function calculateStatus(free, total, sourceStatus, occupancyRate) {
  const normalizedSourceStatus = normalizeStatus(sourceStatus);

  if (normalizedSourceStatus) {
    return normalizedSourceStatus;
  }

  if (free === null) {
    if (occupancyRate !== null) {
      if (occupancyRate >= 100) {
        return "full";
      }

      if (occupancyRate >= 85) {
        return "limited";
      }

      return "open";
    }

    return "unknown";
  }

  if (free <= 0) {
    return "full";
  }

  if (total !== null && free / total < 0.15) {
    return "limited";
  }

  return "open";
}

function transformItem(item, fallbackSource = "external") {
  const id = String(
    deepPick(item, ["id", "uid", "parking_id", "parkId", "uuid", "parkingSiteId"]) ?? ""
  ).trim();
  const name = String(
    deepPick(item, ["name", "title", "parking_name", "bezeichnung", "parkingSiteName"]) ?? ""
  ).trim();
  const lat = asNumber(
    deepPick(item, ["lat", "latitude", "y", "geoLat"]) ?? item?.coords?.lat
  );
  const lng = asNumber(
    deepPick(item, ["lng", "longitude", "lon", "x", "geoLng"]) ?? item?.coords?.lng
  );
  let free = asNumber(
    deepPick(item, [
      "free",
      "free_slots",
      "available",
      "availableSlots",
      "num_free",
      "vacantSpaces",
      "vacant_spaces",
      "parkingNumberOfVacantSpaces",
      "parking_number_of_vacant_spaces",
      "parking_number_of_vacant_spaces_lower_than",
      "parkingNumberOfVacantSpacesLowerThan"
    ])
  );
  let total = asNumber(
    deepPick(item, [
      "total",
      "total_slots",
      "capacity",
      "totalSlots",
      "parkingNumberOfSpaces",
      "parking_number_of_spaces",
      "parkingNumberOfSpacesOverride",
      "parking_number_of_spaces_override"
    ])
  );
  const occupied = asNumber(
    deepPick(item, [
      "num_occupied",
      "occupied",
      "occupiedSpaces",
      "occupied_spaces",
      "parkingNumberOfOccupiedSpaces",
      "parking_number_of_occupied_spaces",
      "parkingNumberOfVehicles"
    ])
  );
  let occupancyRate = clampPercentage(
    asNumber(
      deepPick(item, [
        "occupancyRate",
        "occupancy_rate",
        "occupancy",
        "parkingOccupancy",
        "parking_occupancy",
        "percentage"
      ])
    )
  );

  if (occupancyRate !== null && occupancyRate <= 1) {
    occupancyRate = Number((occupancyRate * 100).toFixed(2));
  }

  if (free === null && total !== null && occupied !== null) {
    free = total - occupied;
  }

  if (total === null && free !== null && occupied !== null) {
    total = free + occupied;
  }

  if (free === null && total !== null && occupancyRate !== null) {
    free = Math.max(0, Math.round(total * (1 - occupancyRate / 100)));
  }

  if (occupancyRate === null && total !== null && total > 0 && free !== null) {
    occupancyRate = Number((((total - free) / total) * 100).toFixed(2));
  }

  if (!id || !name || lat === null || lng === null) {
    return null;
  }

  const sourceStatus = deepPick(item, [
    "status",
    "state",
    "availability",
    "parkingSiteStatus",
    "parking_site_status",
    "parkingSiteStatusEnum",
    "parking_site_status_enum",
    "parkingStatus"
  ]);
  const normalizedStatus = calculateStatus(free, total, sourceStatus, occupancyRate);

  return createParkingModel({
    id,
    name,
    lat,
    lng,
    free,
    total,
    occupancyRate,
    status: normalizedStatus,
    realtimeData: hasRealtimeData(
      item,
      fallbackSource,
      free,
      total,
      occupancyRate,
      normalizedStatus
    ),
    source: String(deepPick(item, ["source", "source_uid"]) ?? fallbackSource),
    updatedAt: String(
      deepPick(item, [
        "updatedAt",
        "updated_at",
        "lastUpdated",
        "last_updated",
        "publicationTime",
        "parkingStatusOriginTime",
        "timestamp"
      ]) ?? new Date().toISOString()
    )
  });
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function transform(payload, fallbackSource) {
  return normalizeCollection(payload)
    .map((item) => transformItem(item, fallbackSource))
    .filter(Boolean);
}

module.exports = {
  transform
};
