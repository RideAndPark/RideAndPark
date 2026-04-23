const DEFAULT_TIMEOUT_MS = 20000;
const RETRY_TIMEOUT_FACTOR = 2;

function buildUrl(pathname = "", query = {}) {
  const baseUrl =
    process.env.PARKING_API_URL ||
    "https://api.mobidata-bw.de/park-api/api/public/v3/parking-sites";

  const url = new URL(baseUrl);

  if (pathname) {
    const normalizedPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${normalizedPath}`;
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function requestJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`External API request failed with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  const timeoutMs = Number(process.env.PARKING_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  try {
    return await requestJson(url, timeoutMs);
  } catch (error) {
    if (error.name !== "AbortError") {
      throw error;
    }

    return requestJson(url, timeoutMs * RETRY_TIMEOUT_FACTOR);
  }
}

async function fetchParkingData(filters = {}) {
  const url = buildUrl("", filters);
  return fetchJson(url);
}

async function fetchParkingById(id) {
  const url = buildUrl(String(id));
  return fetchJson(url);
}

module.exports = {
  fetchParkingData,
  fetchParkingById
};
