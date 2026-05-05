# RideAndPark MVP-Dokumentation

## Kurzbeschreibung

RideAndPark ist eine Web-App zur Suche und Anzeige von Parkplätzen mit Live-Informationen. Nutzer können ein Ziel suchen, einen Radius festlegen und Parkplätze auf einer Karte sowie in einer Detailansicht vergleichen.

Das MVP konzentriert sich auf eine einfache, nutzbare Parkplatzsuche mit Echtzeitdaten, Kartenansicht, Statusfarben und automatischer Aktualisierung.

## Ziel des MVP

Das Ziel des MVP ist es, schnell verfügbare Parkplätze sichtbar zu machen und dabei folgende Fragen zu beantworten:

- Welche Parkplätze befinden sich in der Nähe meines Ziels?
- Wie viele freie Plätze gibt es aktuell?
- Ist ein Parkplatz offen, knapp oder voll?
- Wann wurden die Daten zuletzt aktualisiert?

## Zielgruppe

Die App richtet sich an Autofahrer, die vor oder während einer Fahrt einen geeigneten Parkplatz suchen. Besonders relevant ist sie für Stadtgebiete, Bahnhofsnähe, Veranstaltungsorte oder stark frequentierte Ziele.

## Kernfunktionen

- Zielsuche über Adresse oder Ortsname
- Anzeige von Parkplätzen auf einer OpenStreetMap-Karte
- Umkreissuche mit einstellbarem Radius
- Statusfarben für freie, knappe, volle und unklare Parkplätze
- Detailansicht für den ausgewählten Parkplatz
- Anzeige von freien Plätzen, Kapazität, Auslastung, Quelle und letzter Meldung
- Filter für Echtzeitdaten
- Automatische Aktualisierung in festen Intervallen
- Backend-Fallback auf Seed-Daten, falls die externe API nicht erreichbar ist

## Nicht im MVP

Folgende Funktionen sind bewusst nicht Teil des MVP:

- Benutzerkonten
- Parkplatzreservierung
- Bezahlung
- Navigation oder Routing
- Favoriten
- Historische Auslastungsanalyse
- Push-Benachrichtigungen
- Mobile Native App

## Architektur

Das Projekt besteht aus zwei Hauptteilen:

- Frontend: React mit Vite und React Leaflet
- Backend: Node.js mit Express

Das Frontend ruft die Backend-API ueber `/api` auf. Im lokalen Vite-Setup wird `/api` an das Backend auf `http://localhost:3000` weitergeleitet. Im Docker-Setup übernimmt Nginx diese Weiterleitung.

```text
Browser
  |
  | /api/parkings
  v
Frontend / Nginx / Vite Proxy
  |
  v
Express Backend
  |
  v
Externe MobiData BW ParkAPI
```

## Datenfluss

1. Der Nutzer öffnet die App.
2. Das Frontend fragt Parkplaetze beim Backend an.
3. Optional sendet das Frontend Zielkoordinaten, Radius und den Echtzeitfilter mit.
4. Das Backend ruft Daten von der externen Parkplatz-API ab.
5. Die Rohdaten werden in ein einheitliches internes Format transformiert.
6. Das Backend filtert die Parkplätze nach Radius und Echtzeitstatus.
7. Das Frontend zeigt die Ergebnisse auf der Karte, in der Trefferliste und in der Detailansicht an.

## Datenmodell im Frontend

Ein Parkplatz wird im MVP vereinfacht so dargestellt:

```json
{
  "id": "21762",
  "name": "Mathematikon",
  "lat": 49.4184414,
  "lng": 8.6753177,
  "free": 86,
  "total": 179,
  "occupancyRate": 51.96,
  "status": "open",
  "realtimeData": true,
  "source": "external",
  "updatedAt": "2026-04-30T11:19:12Z"
}
```

## Statuslogik

Die App nutzt vier Statuswerte:

- `open`: Parkplatz ist verfügbar
- `limited`: Parkplatz hat nur noch wenige freie Plätze
- `full`: Parkplatz ist voll oder geschlossen
- `unknown`: Status kann nicht sicher bestimmt werden

Die Statusfarbe wird im Frontend aus dem Status oder ersatzweise aus der Auslastung berechnet:

- Grün: frei
- Orange: knapp
- Rot: voll
- Grau: unklar

## API-Endpunkte

### Healthcheck

```http
GET /api/health
```

Gibt zurück, ob das Backend erreichbar ist.

### Parkplätze abrufen

```http
GET /api/parkings
```

Unterstützte Query-Parameter:

- `name`: Filter nach Parkplatzname
- `source_uid`: Filter nach Datenquelle
- `target_lat`: Ziel-Breitengrad
- `target_lng`: Ziel-Laengengrad
- `radius_km`: Suchradius in Kilometern
- `realtimeData`: `true`, um nur Echtzeitdaten anzuzeigen

Beispiel:

```http
GET /api/parkings?target_lat=49.4184&target_lng=8.6753&radius_km=5&realtimeData=true
```

### Einzelnen Parkplatz abrufen

```http
GET /api/parkings/:id
```

### Daten manuell aktualisieren

```http
POST /api/parkings/refresh
```

### Ziel geocodieren

```http
GET /api/geocode?q=Heidelberg%20Hauptbahnhof
```

## Setup lokal

Frontend starten:

```bash
npm install
npm run dev
```

Backend starten:

```bash
cd backend
npm install
npm run dev
```

Danach ist das Frontend über Vite erreichbar. API-Anfragen auf `/api` werden lokal an das Backend weitergeleitet.

## Setup mit Docker

```bash
docker compose up --build
```

Danach sind die Dienste erreichbar unter:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/api/health`

## Umgebungsvariablen

Backend:

- `PORT`: Port des Backend-Servers
- `CORS_ORIGIN`: erlaubte Frontend-Origin
- `PARKING_API_URL`: URL der externen Parkplatz-API
- `PARKING_API_TIMEOUT_MS`: Timeout für externe API-Aufrufe
- `PARKING_CACHE_TTL_MS`: Gültigkeit des Backend-Caches
- `ALLOW_FALLBACK_DATA`: erlaubt Seed-Daten bei externer API-Störung

## Performance im MVP

Die wichtigste Performance-Massnahme ist ein Backend-Cache für externe Parkplatzdaten. Dadurch muss nicht jede Frontend-Aktualisierung direkt die externe API abfragen.

Redis kann später sinnvoll sein, wenn:

- mehrere Backend-Instanzen parallel laufen
- Cache-Daten zwischen Containern geteilt werden sollen
- die externe API stark limitiert ist
- die App produktiv mit mehreren Nutzern betrieben wird

Für das aktuelle MVP reicht ein In-Memory-Cache im Backend meistens aus. Entscheidend ist, dass Filter wie Radius, Ziel und Echtzeitstatus lokal auf den bereits geladenen Daten angewendet werden.

## Bekannte Risiken

- Externe API-Felder können sich ändern.
- Echtzeitdaten sind nur so aktuell wie die externe Quelle.
- Geocoding kann ungenaue Ziele liefern.
- Ohne Redis verliert das Backend den Cache bei Neustart.
- Bei mehreren Backend-Instanzen hat jede Instanz ihren eigenen Cache.

## Nächste Schritte nach dem MVP

- Robustere Transformation für alle MobiData-Felder
- Tests für konkrete Echtzeit-Payloads
- Redis-Cache für produktive Deployments
- Bessere Fehleranzeige bei veralteten oder fehlenden Live-Daten
- Optionales Clustering von Kartenmarkern bei vielen Parkplätzen
- Anzeige von Öffnungszeiten und Adresse in der Detailansicht
- Mobile Optimierung der Bedienung

## Erfolgskriterien

Das MVP gilt als erfolgreich, wenn:

- Parkplätze innerhalb weniger Sekunden angezeigt werden
- freie Plätze und Kapazität korrekt dargestellt werden
- die Statusanzeige nicht im Widerspruch zu den Echtzeitdaten steht
- Zielsuche und Radiusfilter funktionieren
- die App lokal und per Docker startbar ist
