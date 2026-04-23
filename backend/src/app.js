require("dotenv").config();

const cors = require("cors");
const express = require("express");
const parkingRoutes = require("./routes/parkingRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*"
  })
);
app.use(express.json());

app.use("/api", parkingRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    error: error.message || "Internal server error"
  });
});

module.exports = app;
