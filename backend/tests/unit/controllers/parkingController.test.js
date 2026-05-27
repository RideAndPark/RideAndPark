const test = require("node:test");
const assert = require("node:assert/strict");

function createResponseRecorder() {
  return {
    statusCode: 200,
    jsonPayload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    }
  };
}

function loadController({
  parkingService = {},
  geocodingService = {}
} = {}) {
  const parkingServicePath = require.resolve("../../../src/services/parkingService");
  const geocodingServicePath = require.resolve("../../../src/services/geocodingService");
  const controllerPath = require.resolve("../../../src/controllers/parkingController");

  delete require.cache[parkingServicePath];
  delete require.cache[geocodingServicePath];
  delete require.cache[controllerPath];

  require.cache[parkingServicePath] = {
    id: parkingServicePath,
    filename: parkingServicePath,
    loaded: true,
    exports: {
      getProcessedParkings: async () => undefined,
      getParkingById: async () => undefined,
      refreshParkings: async () => undefined,
      getStatistics: async () => undefined,
      ...parkingService
    }
  };

  require.cache[geocodingServicePath] = {
    id: geocodingServicePath,
    filename: geocodingServicePath,
    loaded: true,
    exports: {
      geocode: async () => undefined,
      ...geocodingService
    }
  };

  return require("../../../src/controllers/parkingController");
}

test("getParkings parses numeric and boolean query params before calling the service", async () => {
  const serviceCalls = [];
  const controller = loadController({
    parkingService: {
      getProcessedParkings: async (filters) => {
        serviceCalls.push(filters);
        return { data: [], meta: { count: 0 } };
      }
    }
  });

  const req = {
    query: {
      name: "Central",
      source_uid: "provider-a",
      target_lat: "48.77",
      target_lng: "9.18",
      radius_km: "7",
      realtimeData: "yes",
      onlyOpen: "true"
    }
  };
  const res = createResponseRecorder();
  const nextCalls = [];

  await controller.getParkings(req, res, (error) => nextCalls.push(error));

  assert.deepEqual(serviceCalls, [
    {
      name: "Central",
      source_uid: "provider-a",
      realtimeData: true,
      onlyOpen: true,
      target_lat: 48.77,
      target_lng: 9.18,
      radius_km: 7
    }
  ]);
  assert.deepEqual(res.jsonPayload, { data: [], meta: { count: 0 } });
  assert.equal(nextCalls.length, 0);
});

test("getParkings forwards validation errors to next", async () => {
  const controller = loadController();
  const req = { query: { realtimeData: "sometimes" } };
  const res = createResponseRecorder();
  const nextCalls = [];

  await controller.getParkings(req, res, (error) => nextCalls.push(error));

  assert.equal(nextCalls.length, 1);
  assert.equal(nextCalls[0].statusCode, 400);
  assert.match(nextCalls[0].message, /realtimeData/);
});

test("getParkingById returns 404 when the service finds nothing", async () => {
  const controller = loadController({
    parkingService: {
      getParkingById: async () => null
    }
  });
  const req = { params: { id: "missing" } };
  const res = createResponseRecorder();

  await controller.getParkingById(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.jsonPayload, { error: "Parking not found" });
});

test("geocode returns the resolved destination", async () => {
  const controller = loadController({
    geocodingService: {
      geocode: async (query) => ({
        lat: 48.77,
        lng: 9.18,
        label: query
      })
    }
  });
  const req = { query: { q: "Stuttgart Hbf" } };
  const res = createResponseRecorder();

  await controller.geocode(req, res, () => {});

  assert.deepEqual(res.jsonPayload, {
    lat: 48.77,
    lng: 9.18,
    label: "Stuttgart Hbf"
  });
});

test("geocode returns 404 when no destination matches", async () => {
  const controller = loadController({
    geocodingService: {
      geocode: async () => null
    }
  });
  const req = { query: { q: "Unknown" } };
  const res = createResponseRecorder();

  await controller.geocode(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.jsonPayload, { error: "No matching destination found." });
});

test("getStatistics returns the aggregated service result", async () => {
  const controller = loadController({
    parkingService: {
      getStatistics: async () => ({
        data: { total: 4, open: 2, limited: 1, full: 1, unknown: 0 },
        meta: { source: "external" }
      })
    }
  });
  const res = createResponseRecorder();

  await controller.getStatistics({}, res, () => {});

  assert.deepEqual(res.jsonPayload, {
    data: { total: 4, open: 2, limited: 1, full: 1, unknown: 0 },
    meta: { source: "external" }
  });
});
