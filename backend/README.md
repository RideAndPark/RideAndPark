# RideAndPark Backend

Node.js/Express backend fuer Parkplatzdaten mit klarer Schichtenstruktur.

## Setup

```bash
cd backend
npm install
npm run dev
```

## Umgebungsvariablen

- `PORT`: Port des Servers
- `CORS_ORIGIN`: erlaubte Frontend-Origin
- `PARKING_API_URL`: externe API fuer Live-Daten, standardmaessig MobiData BW ParkAPI
- `PARKING_API_TIMEOUT_MS`: Timeout fuer den externen Abruf, Standard `20000`
- `ALLOW_FALLBACK_DATA`: `true`, um bei fehlender API lokale Seed-Daten zu liefern

## Endpunkte

- `GET /api/health`
- `GET /api/parkings`
- `GET /api/parkings/:id`
- `POST /api/parkings/refresh`

## Filter

`GET /api/parkings` unterstuetzt aktuell:

- `name`: Filter nach Name, z. B. `?name=Stuttgart`
- `source_uid`: Filter nach Datenquelle, z. B. `?source_uid=pbw`
