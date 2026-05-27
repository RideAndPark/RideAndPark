# RideAndPark

Applikation zur Effizienten Verwaltung und Visualisierung von Parkplatzinformationen auf einer interaktiven Karte.

## Quickstart

```bash
npm run dev
```

Startet Frontend (Vite) und Backend (Express) parallel. Frontend läuft auf `http://localhost:5173`, Backend auf `http://localhost:3000`.

## Architektur

### Full-Stack Setup

- **Frontend**: React (Vite) mit Leaflet-Maps und Recharts für Datenvisualisierung
- **Backend**: Express.js mit Service-Layer und Controller-Pattern
- **Deployment**: Docker & Docker Compose für beide Services mit Nginx-Reverse-Proxy

### Backend-Struktur

```
controllers/   → Anfrage-Handling
services/      → Geschäftslogik (Parking-, Geocoding-, API-Services)
models/        → Datenbankmodelle
routes/        → REST-API-Endpoints
```

### Design Patterns

- **MVC**: Model-View-Controller für strukturierte Datenverwaltung
- **Service Layer**: Separation of Concerns zwischen Controller und Logik
- **Proxy Pattern**: API-Calls über Vite-Proxy zu Backend
- **Observer Pattern**: React-State für reaktive Updates

## API-Endpoints

- `GET /api/health` → Server-Status
- `GET /api/parkings` → Alle Parkplätze
- `GET /api/parkings/:id` → Einzelner Parkplatz
- `GET /api/geocode` → Geocoding-Service
- `POST /api/parkings/refresh` → Daten aktualisieren

## Frontend-Features

- Interaktive Karte mit Leaflet
- Echtzeit-Parkplatz-Visualisierung
- Statistiken & Charts (Recharts)
- Auto-Refresh mit konfigurierbarem Intervall

## Development

```bash
# Nur Frontend
npm run dev

# Nur Backend
cd backend && npm run dev

# Testen
cd backend && npm test

# Linting
npm run lint
```

## Stack

**Frontend**: React 19, Vite, Leaflet, Recharts  
**Backend**: Express.js, Node.js  
**Database**: (via Backend-Services)  
**Tools**: Nodemon, ESLint, Docker
