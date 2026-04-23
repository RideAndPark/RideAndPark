const express = require("express");
const controller = require("../controllers/parkingController");

const router = express.Router();

router.get("/health", controller.getHealth);
router.get("/parkings", controller.getParkings);
router.get("/parkings/:id", controller.getParkingById);
router.post("/parkings/refresh", controller.refreshParkings);

module.exports = router;
