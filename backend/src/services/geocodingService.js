const DEFAULT_GEOCODING_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_TIMEOUT_MS = 10000;

function buildGeocodingUrl(query) {
  const baseUrl = process.env.GEOCODING_API_URL || DEFAULT_GEOCODING_URL;
  const url = new URL(baseUrl);

  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  return url;
}

async function geocode(query) {
  const trimmedQuery = String(query ?? "").trim();

  if (!trimmedQuery) {
    const error = new Error('Query parameter "q" is required.');
    error.statusCode = 400;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(buildGeocodingUrl(trimmedQuery), {
      headers: {
        Accept: "application/json",
        "User-Agent": process.env.GEOCODING_USER_AGENT || "RideAndPark/1.0"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }

    const results = await response.json();
    const firstHit = results[0];

    if (!firstHit) {
      return null;
    }

    return {
      lat: Number(firstHit.lat),
      lng: Number(firstHit.lon),
      label: firstHit.display_name
    };
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Geocoding request timed out.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  geocode
};
