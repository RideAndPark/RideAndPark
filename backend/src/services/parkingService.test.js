const test = require("node:test");
const assert = require("node:assert/strict");

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

function loadParkingService({
  fetchParkingData = async () => [],
  fetchParkingById = async () => null,
  getSeedParkings = () => []
} = {}) {
  const apiServicePath = require.resolve("./apiService");
  const dbPath = require.resolve("../config/db");
  const servicePath = require.resolve("./parkingService");

  delete require.cache[apiServicePath];
  delete require.cache[dbPath];
  delete require.cache[servicePath];

  require.cache[apiServicePath] = {
    id: apiServicePath,
    filename: apiServicePath,
    loaded: true,
    exports: {
      fetchParkingData,
      fetchParkingById
    }
  };

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      getSeedParkings
    }
  };

  return require("./parkingService");
}

test.afterEach(() => {
  restoreEnv();
});

test("getProcessedParkings transforms external records and reuses cache for repeated requests", async () => {
  let fetchCalls = 0;
  const service = loadParkingService({
    fetchParkingData: async () => {
      fetchCalls += 1;
      return [
        {
          id: "ext-1",
          name: "Central Garage",
          latitude: 48.13,
          longitude: 11.57,
          free_slots: 50,
          total_slots: 100
        }
      ];
    }
  });

  const firstResult = await service.getProcessedParkings();
  const secondResult = await service.getProcessedParkings();

  assert.equal(fetchCalls, 1);
  assert.equal(firstResult.meta.source, "external");
  assert.equal(firstResult.data.length, 1);
  assert.equal(firstResult.data[0].id, "ext-1");
  assert.equal(firstResult.data[0].status, "open");
  assert.equal(secondResult.meta.count, 1);
});

test("getProcessedParkings falls back to seed data when the external source fails", async () => {
  process.env.ALLOW_FALLBACK_DATA = "true";

  const service = loadParkingService({
    fetchParkingData: async () => {
      throw new Error("Service unavailable");
    },
    getSeedParkings: () => [
      {
        id: "seed-1",
        name: "Fallback Parking",
        latitude: 48.14,
        longitude: 11.58,
        free_slots: 8,
        total_slots: 20,
        source: "seed"
      }
    ]
  });

  const result = await service.getProcessedParkings();

  assert.equal(result.meta.source, "seed");
  assert.equal(result.meta.count, 1);
  assert.match(result.meta.warning, /External source unavailable: Service unavailable/);
  assert.equal(result.data[0].id, "seed-1");
});

test("getProcessedParkings applies the radius filter to transformed records", async () => {
  const service = loadParkingService({
    fetchParkingData: async () => [
      {
        id: "nearby",
        name: "Nearby Parking",
        latitude: 48.1355,
        longitude: 11.5588,
        free_slots: 10,
        total_slots: 50
      },
      {
        id: "far-away",
        name: "Far Away Parking",
        latitude: 48.25,
        longitude: 11.8,
        free_slots: 20,
        total_slots: 70
      }
    ]
  });

  const result = await service.getProcessedParkings({
    target_lat: 48.1351,
    target_lng: 11.582,
    radius_km: 5
  });

  assert.deepEqual(
    result.data.map((parking) => parking.id),
    ["nearby"]
  );
  assert.equal(result.meta.filters.radius_km, 5);
});

test("getParkingById returns transformed external data when available", async () => {
  const service = loadParkingService({
    fetchParkingById: async (id) => ({
      id,
      name: "Direct Lookup",
      latitude: 48.12,
      longitude: 11.52,
      free_slots: 11,
      total_slots: 22
    })
  });

  const result = await service.getParkingById("ext-9");

  assert.equal(result.data.id, "ext-9");
  assert.equal(result.meta.source, "external");
});

test("getParkingById falls back to loaded seed data when the external lookup fails", async () => {
  process.env.ALLOW_FALLBACK_DATA = "true";

  const service = loadParkingService({
    fetchParkingData: async () => {
      throw new Error("network down");
    },
    fetchParkingById: async () => {
      throw new Error("lookup failed");
    },
    getSeedParkings: () => [
      {
        id: "seed-77",
        name: "Seed Lookup",
        latitude: 48.15,
        longitude: 11.6,
        free_slots: 4,
        total_slots: 25,
        source: "seed"
      }
    ]
  });

  const result = await service.getParkingById("seed-77");

  assert.equal(result.data.id, "seed-77");
  assert.equal(result.meta.source, "seed");
});
