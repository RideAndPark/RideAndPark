const parkingService = require("../services/parkingService");

async function getParkings(req, res, next) {
  try {
    const result = await parkingService.getProcessedParkings({
      name: req.query.name,
      source_uid: req.query.source_uid
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
  getHealth
};
