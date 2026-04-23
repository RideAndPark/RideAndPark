const { createParkingModel } = require("../models/parkingModel");

function asNumber(value) {
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

function calculateStatus(free, total, sourceStatus) {
  if (sourceStatus) {
    return String(sourceStatus).toLowerCase();
  }

  if (free === null) {
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
    pickFirst(item, ["id", "uid", "parking_id", "parkId", "uuid"]) ?? ""
  ).trim();
  const name = String(
    pickFirst(item, ["name", "title", "parking_name", "bezeichnung"]) ?? ""
  ).trim();
  const lat = asNumber(
    pickFirst(item, ["lat", "latitude", "y", "geoLat"]) ?? item?.coords?.lat
  );
  const lng = asNumber(
    pickFirst(item, ["lng", "longitude", "lon", "x", "geoLng"]) ?? item?.coords?.lng
  );
  let free = asNumber(
    pickFirst(item, ["free", "free_slots", "available", "availableSlots", "num_free"])
  );
  const total = asNumber(pickFirst(item, ["total", "total_slots", "capacity", "totalSlots"]));
  const occupied = asNumber(pickFirst(item, ["num_occupied", "occupied"]));

  if (free === null && total !== null && occupied !== null) {
    free = total - occupied;
  }

  if (!id || !name || lat === null || lng === null) {
    return null;
  }

  const occupancyRate =
    total !== null && total > 0 && free !== null
      ? Number((((total - free) / total) * 100).toFixed(2))
      : null;

  return createParkingModel({
    id,
    name,
    lat,
    lng,
    free,
    total,
    occupancyRate,
    status: calculateStatus(
      free,
      total,
      pickFirst(item, ["status", "state", "availability"])
    ),
    source: String(pickFirst(item, ["source", "source_uid"]) ?? fallbackSource),
    updatedAt: new Date().toISOString()
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
