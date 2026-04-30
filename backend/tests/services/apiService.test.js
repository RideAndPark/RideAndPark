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

function loadApiService() {
  const modulePath = require.resolve("../../src/services/apiService");
  delete require.cache[modulePath];
  return require("../../src/services/apiService");
}

test.afterEach(() => {
  global.fetch = originalFetch;
  restoreEnv();
});

test("fetchParkingData builds the request URL with query parameters", async () => {
  process.env.PARKING_API_URL = "https://example.com/api/parking-sites";

  const fetchCalls = [];
  global.fetch = async (url, options) => {
    fetchCalls.push({ url: String(url), options });
    return {
      ok: true,
      async json() {
        return [{ id: "p-1" }];
      }
    };
  };

  const apiService = loadApiService();
  const result = await apiService.fetchParkingData({
    name: "Central",
    source_uid: "ext-7",
    empty: ""
  });

  assert.deepEqual(result, [{ id: "p-1" }]);
  assert.equal(fetchCalls.length, 1);
  assert.equal(
    fetchCalls[0].url,
    "https://example.com/api/parking-sites?name=Central&source_uid=ext-7"
  );
  assert.equal(fetchCalls[0].options.method, "GET");
  assert.equal(fetchCalls[0].options.headers.Accept, "application/json");
});

test("fetchParkingById appends the id to the API base URL", async () => {
  process.env.PARKING_API_URL = "https://example.com/api/parking-sites/";

  global.fetch = async (url) => ({
    ok: true,
    async json() {
      return { requestUrl: String(url) };
    }
  });

  const apiService = loadApiService();
  const result = await apiService.fetchParkingById("abc-123");

  assert.equal(result.requestUrl, "https://example.com/api/parking-sites/abc-123");
});

test("fetchJson retries once after an AbortError", async () => {
  process.env.PARKING_API_TIMEOUT_MS = "5";

  const abortError = new Error("timed out");
  abortError.name = "AbortError";

  let attempts = 0;
  global.fetch = async () => {
    attempts += 1;

    if (attempts === 1) {
      throw abortError;
    }

    return {
      ok: true,
      async json() {
        return { ok: true };
      }
    };
  };

  const apiService = loadApiService();
  const result = await apiService.fetchParkingData();

  assert.deepEqual(result, { ok: true });
  assert.equal(attempts, 2);
});

test("fetchJson throws on non-success HTTP responses", async () => {
  global.fetch = async () => ({
    ok: false,
    status: 503
  });

  const apiService = loadApiService();

  await assert.rejects(
    () => apiService.fetchParkingData(),
    /External API request failed with status 503/
  );
});
