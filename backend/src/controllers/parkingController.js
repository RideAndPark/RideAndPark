const parkingService = require("../services/parkingService");
const geocodingService = require("../services/geocodingService");

function parseNumericQueryParam(value, paramName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    const error = new Error(`Query parameter "${paramName}" must be a valid number.`);
    error.statusCode = 400;
    throw error;
  }

  return numericValue;
}

function parseBooleanQueryParam(value, paramName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalizedValue)) {
    return false;
  }

  const error = new Error(`Query parameter "${paramName}" must be a valid boolean.`);
  error.statusCode = 400;
  throw error;
}

async function getParkings(req, res, next) {
  try {
    const targetLat = parseNumericQueryParam(req.query.target_lat, "target_lat");
    const targetLng = parseNumericQueryParam(req.query.target_lng, "target_lng");
    const radiusKm = parseNumericQueryParam(req.query.radius_km, "radius_km");
    const realtimeData = parseBooleanQueryParam(req.query.realtimeData, "realtimeData");

    if ((targetLat === undefined) !== (targetLng === undefined)) {
      const error = new Error(
        'Query parameters "target_lat" and "target_lng" must be provided together.'
      );
      error.statusCode = 400;
      throw error;
    }

    if (radiusKm !== undefined && radiusKm <= 0) {
      const error = new Error('Query parameter "radius_km" must be greater than 0.');
      error.statusCode = 400;
      throw error;
    }

    const result = await parkingService.getProcessedParkings({
      name: req.query.name,
      source_uid: req.query.source_uid,
      realtimeData,
      target_lat: targetLat,
      target_lng: targetLng,
      radius_km: radiusKm
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getParkingById(req, res, next) {
  try {
    const result = await parkingService.getParkingById(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "Parking not found" });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function refreshParkings(req, res, next) {
  try {
    const result = await parkingService.refreshParkings();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function geocode(req, res, next) {
  try {
    const result = await geocodingService.geocode(req.query.q);

    if (!result) {
      return res.status(404).json({ error: "No matching destination found." });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

function getHealth(req, res) {
  res.json({
    status: "ok",
    service: "rideandpark-backend",
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  getParkings,
  getParkingById,
  refreshParkings,
  geocode,
  getHealth
};
