class ParkingModel {
  constructor({
    id,
    name,
    lat,
    lng,
    free,
    total = null,
    occupancyRate = null,
    status = "unknown",
    source = "unknown",
    updatedAt
  }) {
    this.id = id;
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.free = free;
    this.total = total;
    this.occupancyRate = occupancyRate;
    this.status = status;
    this.source = source;
    this.updatedAt = updatedAt;
  }
}

function createParkingModel(payload) {
  return new ParkingModel(payload);
}

module.exports = {
  ParkingModel,
  createParkingModel
};
