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

### `POST /api/shows`
Schedules a new screening with collision prevention (`409 Conflict` on overlap) and automatic seat inventory generation (Admin only).

### `PATCH /api/shows/:id/cancel`
Cancels a show (`status: 'cancelled'`) (Admin only).

---

## 5. Ticket Bookings (`/api/bookings`)

### `POST /api/bookings`
Reserves seats for a scheduled show.

- **Access**: Authenticated users
- **Request Body**:
```json
{
  "showId": "67be8f2...",
  "seatNumbers": ["A1", "A2"]
}
```
- **Concurrency & Double-Booking Protection**:
  Executes an atomic single-document conditional update on `Show`. If any requested seat is no longer `available` or has been reserved concurrently, returns `409 Conflict`.
- **Authoritative Pricing**: Total price is computed strictly by summing current seat tier prices on the server.
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
- **Response `400 Bad Request`**: Validation failure (empty seat array, non-existent seat, past show).
- **Response `409 Conflict`**: One or more seats are already booked.

### `GET /api/bookings/my-bookings`
Retrieves authenticated user's booking history with populated movie, theatre, and screen details.

- **Access**: Authenticated users
- **Response `200 OK`**: Array of bookings sorted newest first.

### `GET /api/bookings/:id`
Retrieves details of a single booking.

- **Access**: Authenticated owner or administrator.
- **Response `403 Forbidden`**: Returned if a user attempts to view another customer's booking.

### `PATCH /api/bookings/:id/cancel`
Cancels a booking and immediately releases the reserved seats in the show's inventory.

- **Access**: Authenticated owner or administrator.
- **Rules**: Cannot cancel already cancelled bookings or shows that have already begun.
- **Response `200 OK`**: Updated booking document with `bookingStatus: 'cancelled'`.

---

## 6. Admin Dashboard & Operations (`/api/admin`)

All administrative routes require a valid JWT with `role: admin`. Requests without a token receive `401 Unauthorized`; requests from users with `role: user` receive `403 Forbidden`.

### `GET /api/admin/overview`
Aggregates live platform-wide KPIs directly from MongoDB.

- **Access**: Admin only (`authenticate` + `authorize('admin')`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalMovies": 12,
    "activeMovies": 9,
    "totalTheatres": 4,
    "totalScreens": 16,
    "totalShows": 48,
    "scheduledShows": 35,
    "totalBookings": 120,
    "confirmedBookings": 115,
    "cancelledBookings": 5,
    "totalRevenue": 2875
  }
}
```

### `GET /api/admin/bookings`
Retrieves a paginated list of all customer bookings platform-wide, including customer details, movie titles, theatre locations, seat assignments, and simulation payment status.

- **Access**: Admin only (`authenticate` + `authorize('admin')`)
- **Query Parameters**:
  - `page` (number, default: 1): Page index.
  - `limit` (number, default: 20, max: 100): Results per page.
  - `status` (string, optional): Filter by booking status (`confirmed`, `cancelled`).
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "67be9...",
      "bookingReference": "IMV-M7B2X-4K9A",
      "user": {
        "_id": "67be8...",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "show": {
        "_id": "67be8...",
        "movie": { "title": "Inception" },
        "theatre": { "name": "Grand Cinema", "city": "New York" },
        "screen": { "name": "Screen 1" },
        "startTime": "2026-11-01T18:00:00.000Z"
      },
      "seats": [
        { "seatNumber": "A1", "tier": "vip", "price": 25 }
      ],
      "totalAmount": 25,
      "bookingStatus": "confirmed",
      "paymentStatus": "unpaid",
      "createdAt": "2026-10-28T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```