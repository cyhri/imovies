# IMovies â€” REST API Documentation

This document describes the REST API endpoints provided by the IMovies backend service under `/api`.

---

## 1. Authentication & Security

All protected endpoints require a valid JSON Web Token (JWT) provided in the `Authorization` header:
```http
Authorization: Bearer <jwt-token>
```

- **User operations**: Allowed for any authenticated user (`role: user` or `role: admin`).
- **Administrative operations**: Restricted exclusively to users with `role: admin`.

---

## 2. Movie Catalog (`/api/movies`)

### `GET /api/movies`
Retrieves a paginated list of active movies with optional search and filters.

- **Access**: Public
- **Query Parameters**:
  - `page` (number, default: 1): Page index.
  - `limit` (number, default: 10, max: 100): Results per page.
  - `q` / `search` (string): Case-insensitive search on movie title.
  - `genre` (string): Filter by genre (e.g. `Action`, `Sci-Fi`).
  - `rating` (string): Filter by rating (`G`, `PG`, `PG-13`, `R`, `NC-17`, `U`, `UA`, `A`).
  - `language` (string): Filter by audio language.
  - `sortBy` (string, default: `releaseDate`): Field to sort by (`releaseDate`, `title`, `duration`).
  - `order` (string, default: `desc`): Sort direction (`asc`, `desc`).
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "67be8...",
      "title": "Inception",
      "description": "A thief who steals corporate secrets...",
      "duration": 148,
      "genres": ["Action", "Sci-Fi"],
      "language": "English",
      "releaseDate": "2010-07-16T00:00:00.000Z",
      "rating": "PG-13",
      "posterUrl": "https://...",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /api/movies/:id`
Retrieves single movie details.

- **Access**: Public
- **Response `200 OK`**: Single movie object.
- **Response `400 Bad Request`**: Malformed ObjectId.
- **Response `404 Not Found`**: Movie not found or inactive.

### `POST /api/movies`
Creates a new movie release.

- **Access**: Admin only
- **Request Body**:
```json
{
  "title": "Interstellar",
  "description": "Explorers travel through a wormhole in space.",
  "duration": 169,
  "genres": ["Sci-Fi", "Adventure"],
  "language": "English",
  "releaseDate": "2014-11-07",
  "rating": "PG-13",
  "posterUrl": "https://..."
}
```
- **Response `201 Created`**: Returns created movie.

### `PUT /api/movies/:id`
Updates existing movie metadata.

- **Access**: Admin only
- **Response `200 OK`**: Returns updated movie.

### `DELETE /api/movies/:id`
Soft-deactivates a movie (`isActive: false`).

- **Access**: Admin only
- **Response `200 OK`**: Deactivation confirmation.

---

## 3. Theatres & Screens (`/api/theatres`)

### `GET /api/theatres`
Lists cinema venues.

- **Access**: Public
- **Query Parameters**:
  - `city` (string): Filter venues by city (e.g. `New York`).
  - `search` / `q` (string): Search venues by name.
- **Response `200 OK`**: List of active venues.

### `GET /api/theatres/:id`
Retrieves venue details by ID.

- **Access**: Public

### `POST /api/theatres`
Creates a new cinema venue.

- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Grand IMAX Downtown",
  "city": "New York",
  "address": "100 Broadway, New York, NY 10005",
  "phone": "+1-212-555-0199"
}
```
- **Response `201 Created`**: Returns created theatre.

### `GET /api/theatres/:theatreId/screens`
Retrieves all auditoriums (screens) belonging to a specific venue.

- **Access**: Public
- **Response `200 OK`**: List of screen objects with layout and capacities.

### `POST /api/theatres/:theatreId/screens`
Creates an auditorium in a theatre.

- **Access**: Admin only
- **Request Body**:
```json
{
  "screenNumber": 1,
  "name": "Screen 1 - IMAX Laser",
  "screenType": "IMAX",
  "seatingCapacity": 50,
  "seatLayout": [
    { "row": "A", "number": 1, "tier": "vip" }
  ]
}
```
- **Response `201 Created`**: Returns created screen.
- **Response `409 Conflict`**: If `screenNumber` already exists for this theatre.

---

## 4. Showtimes & Scheduling (`/api/shows`)

### `GET /api/shows`
Lists screenings.

- **Access**: Public
- **Query Parameters**:
  - `movie` (ObjectId): Filter by movie ID.
  - `theatre` (ObjectId): Filter by theatre ID.
  - `screen` (ObjectId): Filter by screen ID.
  - `city` (string): Filter shows by theatre city.
  - `date` (string, YYYY-MM-DD): Filter shows on a specific calendar date.
  - `includePast` (boolean): Include screenings that have already started (default: false).
- **Response `200 OK`**: List of shows with populated movie, theatre, screen, and available seat counts.

### `GET /api/shows/:id`
Retrieves complete show details, including pricing tiers and dynamic seat inventory.

- **Access**: Public
- **Response `200 OK`**: Populated show with full `seats` inventory.

### `POST /api/shows`
Schedules a new screening.

- **Access**: Admin only
- **Request Body**:
```json
{
  "movie": "67be...",
  "theatre": "67be...",
  "screen": "67be...",
  "startTime": "2026-11-01T18:00:00Z",
  "endTime": "2026-11-01T21:00:00Z",
  "pricing": [
    { "tier": "standard", "price": 12 },
    { "tier": "vip", "price": 20 }
  ]
}
```
- **Schedule Overlap Rule**: Shows cannot overlap in time on the same screen (`existing.startTime < new.endTime && existing.endTime > new.startTime`).
- **Seat Auto-generation**: Automatically creates `seats` inventory from the screen's layout mapped to tier prices.
- **Response `201 Created`**: Created show document.
- **Response `409 Conflict`**: Returned when schedule collision occurs on the same screen.

### `PATCH /api/shows/:id/cancel`
Cancels a show (`status: 'cancelled'`).

- **Access**: Admin only
- **Response `200 OK`**: Cancelled show document.