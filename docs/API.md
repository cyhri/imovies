# IMovies â€” REST & Real-Time API Documentation

This document describes the REST API endpoints and real-time Socket.IO events provided by the IMovies platform under `/api`.

---

## 1. Authentication & Security

All protected endpoints require a valid JSON Web Token (JWT) provided in the `Authorization` header:
```http
Authorization: Bearer <jwt-token>
```

- **User operations**: Allowed for any authenticated user (`role: user` or `role: admin`).
- **Administrative operations**: Restricted exclusively to users with `role: admin`.

### `POST /api/auth/register`
Creates a customer account.

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT.

### `GET /api/auth/me`
Retrieves current profile of authenticated user.

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

### `GET /api/movies/:id`
Retrieves single movie details.

### `POST /api/movies`
Creates a new movie release (Admin only).

### `PUT /api/movies/:id`
Updates existing movie metadata (Admin only).

### `DELETE /api/movies/:id`
Soft-deactivates a movie (`isActive: false`) (Admin only).

---

## 3. Theatres & Screens (`/api/theatres`)

### `GET /api/theatres`
Lists cinema venues with optional `city` and `search` query.

### `GET /api/theatres/:id`
Retrieves venue details by ID.

### `POST /api/theatres`
Creates a new cinema venue (Admin only).

### `GET /api/theatres/:theatreId/screens`
Retrieves all auditoriums (screens) belonging to a specific venue.

### `POST /api/theatres/:theatreId/screens`
Creates an auditorium in a theatre. Enforces compound uniqueness `{ theatre, screenNumber }` (Admin only).

---

## 4. Showtimes & Scheduling (`/api/shows`)

### `GET /api/shows`
Lists screenings filtered by `movie`, `theatre`, `screen`, `city`, and `date`. Includes available seat summaries.

### `GET /api/shows/:id`
Retrieves complete show details, including pricing tiers and dynamic seat inventory.
- **Lazy Expiration**: Expired temporary seat holds (`holdExpiresAt <= now`) are automatically normalized to `status: 'available'` in the response payload.
- **Ownership Flag**: Includes `isHeldByMe: true` if the seat is held by the currently authenticated requester.

### `POST /api/shows`
Schedules a new screening with collision prevention (`409 Conflict` on overlap) and automatic seat inventory generation (Admin only).

### `PATCH /api/shows/:id/cancel`
Cancels a show (`status: 'cancelled'`) (Admin only).

---

## 5. Temporary Seat Holds (`/api/shows/:id/holds`)

### `POST /api/shows/:id/holds`
Places a temporary hold on one or more available seats for a scheduled show.

- **Access**: Authenticated users
- **Request Body**:
```json
{
  "seatNumbers": ["A1", "A2"],
  "durationSeconds": 300
}
```
- **Hold Duration**: Configurable via `HOLD_DURATION_SECONDS` environment variable (defaults to 300 seconds / 5 minutes). Minimum 5 seconds, maximum 1800 seconds (30 minutes).
- **Concurrency & Double-Hold Prevention**: Executes an atomic single-document conditional update on `Show`. If any requested seat is currently booked or actively held by another user (`holdExpiresAt > now`), the transaction halts and returns `409 Conflict`.
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Seats held successfully",
  "data": {
    "holdToken": "HLD-MVR49S8S-AZY19",
    "showId": "67be8...",
    "seats": [
      { "seatNumber": "A1", "tier": "vip", "price": 25 },
      { "seatNumber": "A2", "tier": "vip", "price": 25 }
    ],
    "totalAmount": 50,
    "expiresAt": "2026-10-28T01:45:00.000Z",
    "expiresInSeconds": 300
  }
}
```
- **Response `409 Conflict`**: One or more selected seats are already booked or held by another customer.

### `GET /api/shows/:id/holds/:holdToken`
Retrieves the details and remaining time for an active seat hold.

- **Access**: Hold owner or administrator.
- **Response `200 OK`**: Hold details including `expiresInSeconds`.

### `DELETE /api/shows/:id/holds/:holdToken`
Releases an active seat hold immediately and restores the seats to `available` status in the show's inventory.

- **Access**: Hold owner or administrator.
- **Protection**: Rejects unauthorized attempts with `403 Forbidden`.
- **Response `200 OK`**: `{ "success": true, "message": "Seat hold released successfully" }`.

---

## 6. Ticket Bookings (`/api/bookings`)

### `POST /api/bookings`
Confirms ticket reservations. Can convert a temporary seat hold into a confirmed booking or directly reserve available seats.

- **Access**: Authenticated users
- **Request Body with Hold Token**:
```json
{
  "showId": "67be8f2...",
  "seatNumbers": ["A1", "A2"],
  "holdToken": "HLD-MVR49S8S-AZY19"
}
```
- **Hold Owner Validation**: Only the authenticated user who created the hold may confirm it. Using another customer's hold returns `403 Forbidden`.
- **Hold Expiration Enforcement**: If the hold expired (`expiresAt <= now`), returns `409 Conflict` requiring re-selection.
- **Authoritative Pricing**: Total price is computed strictly by summing authoritative seat prices on the server.
- **Atomic Transition**: Seats atomically transition from `status: 'reserved'` (with matching `holdToken`) to `status: 'booked'`. The `SeatHold` record transitions to `completed`.
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Tickets booked successfully",
  "data": {
    "_id": "67be9...",
    "bookingReference": "IMV-M7B2X-4K9A",
    "user": "67be8...",
    "show": "67be8...",
    "seats": [
      { "seatNumber": "A1", "tier": "vip", "price": 25 },
      { "seatNumber": "A2", "tier": "vip", "price": 25 }
    ],
    "totalAmount": 50,
    "bookingStatus": "confirmed",
    "paymentStatus": "unpaid",
    "createdAt": "2026-10-28T00:00:00.000Z"
  }
}
```

### `GET /api/bookings/my-bookings`
Retrieves authenticated user's booking history with populated movie, theatre, and screen details.

### `GET /api/bookings/:id`
Retrieves details of a single booking (owner or admin only).

### `PATCH /api/bookings/:id/cancel`
Cancels a booking, transitions status to `cancelled`, and immediately releases the reserved seats back to `available` status in the show's inventory.

---

## 7. Real-Time Socket.IO Synchronization

Clients connect to the Socket.IO service at the server origin (`ws://` / `http://`).

### Rooms & Scoping
- **`join:show`**: Client emits `socket.emit('join:show', showId)` when opening the seat selection map.
- **`leave:show`**: Client emits `socket.emit('leave:show', showId)` when navigating away from the seat map.

### Real-Time Broadcast Events (Scoped to `show:${showId}`)

| Event Name | Payload | Trigger |
|:---|:---|:---|
| `seats:held` | `{ showId, seatNumbers, holdExpiresAt, userId }` | A user acquires a temporary hold on seats |
| `seats:released` | `{ showId, seatNumbers }` | A user releases their hold or cancels a booking |
| `seats:expired` | `{ showId, seatNumbers }` | Background worker cleans up expired holds |
| `seats:booked` | `{ showId, seatNumbers }` | A user confirms checkout and books seats |

Clients reconcile incoming socket events with local UI state in real time without reloading the page. If the WebSocket connection disconnects, an automatic 8-second polling fallback keeps availability synchronized.

---

## 8. Admin Dashboard & Operations (`/api/admin`)

Requires `role: admin`.

### `GET /api/admin/overview`
Aggregates live platform-wide KPIs directly from MongoDB.

### `GET /api/admin/bookings`
Retrieves a paginated list of all customer bookings platform-wide.