# IMovies â€” Database Design & Data Models

## 1. Overview

IMovies uses **MongoDB Community Server** (v8.0.x) with **Mongoose ODM** (v8.x) for data persistence. MongoDB provides schema flexibility, document referencing, and atomic document updates for users, cinema schedules, seat availability, and ticket reservations.

## 2. Environment & Connection Strategy

- **Development URI**: `mongodb://127.0.0.1:27017/imovies` (bound to localhost only)
- **Isolated Test Database**: `mongodb://127.0.0.1:27017/imovies_test` (used exclusively during automated test execution to guarantee zero data loss in the development database)
- **Connection Lifecycle**: Managed via `server/src/config/db.js` with connection pooling, 5000ms server selection timeout, and graceful disconnects on `SIGINT` and `SIGTERM`.

## 3. Data Models & Schemas

### 3.1 User (`users`)
Stores authenticated customer and administrator accounts.
- `name` (String, required, 2-100 characters, trimmed)
- `email` (String, required, unique, lowercase, trimmed, validated via RFC 5322 regex pattern, indexed)
- `password` (String, required, min 8 characters, hashed with bcrypt 12 rounds, `select: false`)
- `role` (String, enum: `['user', 'admin']`, default: `'user'`)
- `isActive` (Boolean, default: `true`)
- Timestamps (`createdAt`, `updatedAt`)

### 3.2 Movie (`movies`)
Catalogs cinematic releases and details.
- `title` (String, required, trimmed, 1-200 characters, indexed)
- `description` (String, required, trimmed, max 2000 characters)
- `duration` (Number, required, min 1 minute)
- `genres` (Array of Strings, non-empty, e.g. Action, Sci-Fi)
- `language` (String, required, max 50 characters)
- `releaseDate` (Date, required, indexed)
- `posterUrl` (String, trimmed)
- `rating` (String, enum: `['G', 'PG', 'PG-13', 'R', 'NC-17', 'U', 'UA', 'A']`, default: `'PG-13'`)
- `isActive` (Boolean, default: `true`, indexed)
- Compound Index: `{ title: 1, isActive: 1 }`, `{ releaseDate: 1 }`
- Timestamps

### 3.3 Theatre (`theatres`)
Physical cinema venues.
- `name` (String, required, 2-150 characters, trimmed)
- `city` (String, required, trimmed, indexed)
- `address` (String, required, max 500 characters)
- `phone` (String, optional)
- `isActive` (Boolean, default: `true`, indexed)
- Compound Index: `{ city: 1, name: 1 }`
- Timestamps

### 3.4 Screen (`screens`)
Auditoriums within a specific theatre.
- `theatre` (ObjectId, ref: `Theatre`, required, indexed)
- `screenNumber` (Number, required, min 1)
- `name` (String, default: `Screen {number}`)
- `screenType` (String, enum: `['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema']`, default: `'2D'`)
- `seatingCapacity` (Number, required, min 1)
- `seatLayout` (Array of objects: `{ row: String, number: Number, tier: ['standard', 'premium', 'vip'] }`)
- Compound Unique Index: `{ theatre: 1, screenNumber: 1 }`
- Timestamps

### 3.5 Show (`shows`)
Screenings combining movie, theatre, and screen with dynamic seat availability.
- `movie` (ObjectId, ref: `Movie`, required, indexed)
- `theatre` (ObjectId, ref: `Theatre`, required, indexed)
- `screen` (ObjectId, ref: `Screen`, required, indexed)
- `startTime` (Date, required, indexed)
- `endTime` (Date, required, validated `endTime > startTime`)
- `pricing` (Array of `{ tier: ['standard', 'premium', 'vip'], price: Number >= 0 }`)
- `seats` (Array of `{ seatNumber: String, tier: String, price: Number >= 0, status: ['available', 'reserved', 'booked'], reservedBy: ref User, reservedAt: Date }`)
- `status` (String, enum: `['scheduled', 'cancelled', 'completed']`, default: `'scheduled'`, indexed)
- Compound Indexes: `{ theatre: 1, startTime: 1 }`, `{ movie: 1, startTime: 1 }`, `{ screen: 1, startTime: 1 }`
- Timestamps

### 3.6 Booking (`bookings`)
Customer reservations.
- `bookingReference` (String, required, unique, indexed, uppercase)
- `user` (ObjectId, ref: `User`, required, indexed)
- `show` (ObjectId, ref: `Show`, required, indexed)
- `seats` (Array of `{ seatNumber: String, tier: String, price: Number >= 0 }`, non-empty)
- `totalAmount` (Number, required, min 0)
- `bookingStatus` (String, enum: `['pending', 'confirmed', 'cancelled']`, default: `'pending'`, indexed)
- `paymentStatus` (String, enum: `['unpaid', 'paid', 'refunded']`, default: `'unpaid'`, indexed)
- Compound Index: `{ user: 1, createdAt: -1 }`
- Timestamps

### 3.7 Payment (`payments`)
Transaction records for ticket bookings.
- `booking` (ObjectId, ref: `Booking`, required, indexed)
- `user` (ObjectId, ref: `User`, required, indexed)
- `amount` (Number, required, min 0)
- `currency` (String, default: `'USD'`)
- `paymentMethod` (String, enum: `['simulated_card', 'card', 'upi', 'netbanking']`, default: `'simulated_card'`)
- `transactionId` (String, required, unique, indexed)
- `status` (String, enum: `['pending', 'completed', 'failed', 'refunded']`, default: `'pending'`, indexed)
- `gatewayResponse` (Mixed object for simulated or actual gateway metadata)
- Compound Index: `{ user: 1, createdAt: -1 }`
- Timestamps

### 3.8 Notification (`notifications`)
User transactional alerts and updates.
- `user` (ObjectId, ref: `User`, required, indexed)
- `type` (String, enum: `['booking_confirmation', 'cancellation', 'reminder', 'system']`, required)
- `title` (String, required, max 200 chars)
- `message` (String, required, max 1000 chars)
- `isRead` (Boolean, default: false, indexed)
- `metadata` (Mixed object)
- Compound Index: `{ user: 1, isRead: 1, createdAt: -1 }`
- Timestamps