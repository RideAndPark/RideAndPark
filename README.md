# RideAndPark

RideAndPark besteht aus einem React/Vite-Frontend und einem Express-Backend fuer Live-Parkdaten.

## Lokal starten

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Das Frontend laeuft lokal ueber Vite, und `/api` wird in [vite.config.js](/E:/RideAndPark/vite.config.js) auf das Backend unter `http://localhost:3000` weitergeleitet.

## Docker

Das Repo enthaelt jetzt ein komplettes Docker-Setup fuer Frontend und Backend.

Start:

```bash
docker compose up --build
```

Danach:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/api/health`

Das Frontend wird per Nginx ausgeliefert und leitet `/api` intern an den Backend-Container weiter. Dadurch funktionieren Browser-Requests auf `/api/parkings` auch im Docker-Setup ohne weitere Frontend-Anpassung.

