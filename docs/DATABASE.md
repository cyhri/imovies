# IMovies â€” Database Design & Configuration

## 1. Overview

IMovies uses **MongoDB Community Server** (v8.0.x) with **Mongoose ODM** for data persistence. MongoDB provides flexible document modeling for movies, schedules, theatres, and bookings.

## 2. Local Database Configuration

- **Default Host**: `127.0.0.1` (localhost only, not exposed to the public internet)
- **Default Port**: `27017`
- **Database Name**: `imovies`
- **Connection URI**: `mongodb://127.0.0.1:27017/imovies`
- **Environment Variable**: `MONGODB_URI` (defined in `server/.env`)

## 3. Connection Management

Database connectivity is managed in `server/src/config/db.js`:

- Connection timeouts are configured (`serverSelectionTimeoutMS: 5000`).
- Mongoose lifecycle events (`connected`, `error`, `disconnected`) are logged during development.
- Graceful shutdown handles `SIGINT` and `SIGTERM` to close active database connections before terminating the Node.js process.
- Database readiness is verified via `mongoose.connection.readyState`.

## 4. Health Check Monitoring

The `/api/health` endpoint dynamically inspects MongoDB connectivity:

- **Connected (`readyState === 1`)**: Returns HTTP `200 OK` with `{ status: "ok", database: { status: "connected", name: "imovies" } }`.
- **Disconnected / Unavailable**: Returns HTTP `503 Service Unavailable` with `{ status: "degraded", database: { status: "disconnected" } }`.
- Credentials and connection strings are never exposed in health check responses.

## 5. Planned Collections & Schemas

| Collection | Description | Key Relationships |
|---|---|---|
| `users` | User credentials, roles (`user`, `admin`), profile details | Referenced by `bookings` |
| `movies` | Movie titles, genres, durations, descriptions, poster assets | Referenced by `shows` |
| `theatres` | Cinema locations, screen details, total seat capacity | Referenced by `shows` |
| `shows` | Screenings combining movie, theatre, date, time, pricing, and seat layouts | References `movies`, `theatres` |
| `bookings` | Customer reservations with selected seats, total amount, status | References `users`, `shows` |
| `payments` | Simulated payment transactions, reference IDs, and outcomes | References `bookings` |

Detailed schema definitions and index specifications will be documented as each model is implemented.