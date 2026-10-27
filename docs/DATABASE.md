# IMovies â€” Database Design & Data Models

## 1. Overview

IMovies uses **MongoDB Community Server** (v8.0.x) with **Mongoose ODM** (v8.x) for data persistence.

## 2. Environment & Connection Strategy

- **Development URI**: `mongodb://127.0.0.1:27017/imovies` (bound to localhost only)
- **Isolated Test Database**: `mongodb://127.0.0.1:27017/imovies_test` (used exclusively during automated test execution to guarantee zero data loss in the development database)
- **Connection Lifecycle**: Managed via `server/src/config/db.js` with connection pooling, 5000ms server selection timeout, and graceful disconnects.

## 3. Concurrency & Double-Booking Strategy

### 3.1 Standalone Deployment Adaptation
The local Windows MongoDB service operates in standalone mode (`not running with --replSet`), meaning multi-document transactions (`session.startTransaction()`) are not natively supported.

### 3.2 Atomic Conditional Inventory Updates
To guarantee 100% protection against double-booking and race conditions without requiring replica set orchestration:
1. `Show` stores a dynamic `seats` inventory array where each seat has `status: ['available', 'reserved', 'booked']`.
2. Booking requests execute a single atomic `Show.findOneAndUpdate` conditional on:
   - `_id: showId`
   - `status: 'scheduled'`
   - `seats: { $all: requestedSeats.map(s => ({ $elemMatch: { seatNumber: s, status: 'available' } })) }`
3. Targeted seats are modified via MongoDB `arrayFilters: [{ 'elem.seatNumber': { $in: requestedSeats } }]`.
4. Single-document writes are serialized by WiredTiger document locks. If two requests contend for the same seat, exactly one updates the document and the second receives `null`, returning `409 Conflict`.
5. If creating the `Booking` record fails, an application-level rollback resets the seats to `available`.
6. When a booking is cancelled via `PATCH /api/bookings/:id/cancel`, an atomic `updateOne` resets the seats back to `status: 'available'`.

## 4. Collections & Schemas

### 4.1 User (`users`)
- `name`, `email` (unique, lowercase), `password` (bcrypt hashed), `role` (`user` | `admin`), `isActive`.

### 4.2 Movie (`movies`)
- `title`, `description`, `duration`, `genres`, `language`, `releaseDate`, `posterUrl`, `rating`, `isActive`.

### 4.3 Theatre (`theatres`)
- `name`, `city`, `address`, `phone`, `isActive`.

### 4.4 Screen (`screens`)
- `theatre` (ref), `screenNumber`, `name`, `screenType`, `seatingCapacity`, `seatLayout`.
- Compound unique index: `{ theatre: 1, screenNumber: 1 }`.

### 4.5 Show (`shows`)
- `movie` (ref), `theatre` (ref), `screen` (ref), `startTime`, `endTime`, `pricing` (tiers), `seats` (inventory array), `status` (`scheduled`, `cancelled`, `completed`).

### 4.6 Booking (`bookings`)
- `bookingReference` (unique uppercase, e.g. `IMV-...`), `user` (ref), `show` (ref), `seats` (array of seatNumber, tier, price), `totalAmount`, `bookingStatus` (`pending`, `confirmed`, `cancelled`), `paymentStatus` (`unpaid`, `paid`, `refunded`).

### 4.7 Payment (`payments`)
- Transaction records for bookings (`simulated_card`, etc.).

### 4.8 Notification (`notifications`)
- Alerts for booking confirmations and cancellations.