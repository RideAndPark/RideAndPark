const test = require("node:test");
const assert = require("node:assert/strict");

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

function loadGeocodingService() {
  const modulePath = require.resolve("../../../src/services/geocodingService");
  delete require.cache[modulePath];
  return require("../../../src/services/geocodingService");
}

test.afterEach(() => {
  global.fetch = originalFetch;
  restoreEnv();
});

test("geocode builds the external request and returns the first hit", async () => {
  process.env.GEOCODING_API_URL = "https://example.com/search";
  process.env.GEOCODING_USER_AGENT = "RideAndPark-Test/1.0";

  const fetchCalls = [];
  global.fetch = async (url, options) => {
    fetchCalls.push({ url: String(url), options });
    return {
      ok: true,
      async json() {
        return [
          {
            lat: "48.7784",
            lon: "9.1800",
            display_name: "Stuttgart Hauptbahnhof"
          }
        ];
      }
    };
  };

  const geocodingService = loadGeocodingService();
  const result = await geocodingService.geocode("Stuttgart Hbf");

  assert.deepEqual(result, {
    lat: 48.7784,
    lng: 9.18,
    label: "Stuttgart Hauptbahnhof"
  });
  assert.equal(
    fetchCalls[0].url,
    "https://example.com/search?q=Stuttgart+Hbf&format=jsonv2&limit=1"
  );
  assert.equal(fetchCalls[0].options.headers["User-Agent"], "RideAndPark-Test/1.0");
});

test("geocode rejects empty queries with a 400 error", async () => {
  const geocodingService = loadGeocodingService();

  await assert.rejects(
    () => geocodingService.geocode("   "),
    (error) => {
      assert.equal(error.message, 'Query parameter "q" is required.');
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});

test("geocode returns null when no result is found", async () => {
  global.fetch = async () => ({
    ok: true,
    async json() {
      return [];
    }
  });

  const geocodingService = loadGeocodingService();
  const result = await geocodingService.geocode("Unknown Place");

  assert.equal(result, null);
});

test("geocode converts AbortError into a 504 timeout error", async () => {
  const abortError = new Error("timed out");
  abortError.name = "AbortError";
  global.fetch = async () => {
    throw abortError;
  };

  const geocodingService = loadGeocodingService();

  await assert.rejects(
    () => geocodingService.geocode("Stuttgart"),
    (error) => {
      assert.equal(error.message, "Geocoding request timed out.");
      assert.equal(error.statusCode, 504);
      return true;
    }
  );
});
