# IMovies

**A full-stack movie ticket booking and cinema management platform.**

IMovies is an individual software development project built using the MERN stack. It aims to simplify movie discovery, showtime selection, seat booking, and cinema administration.

## Objectives

- Provide a convenient movie browsing experience.
- Support secure user authentication.
- Enable showtime selection and seat booking.
- Manage bookings and simulated payments.
- Provide administrative tools for managing movies, theatres, and shows.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19, Vite, Bootstrap 5 |
| Backend | Node.js (>=20), Express.js |
| Database | MongoDB Community Server (v8.0.x), Mongoose |
| Authentication | JWT, bcryptjs |
| Version Control | Git, GitHub |

## Prerequisites

- **Node.js**: `v20.0.0` or later (`v24.22.1` recommended)
- **npm**: `v10.0.0` or later
- **MongoDB Community Server**: `v8.0.x` running locally on port `27017`
- **MongoDB Shell (`mongosh`)**: `v2.x`

## Getting Started

### 1. Installation

Install dependencies for all workspaces from the project root:

```bash
npm run install:all
```

Alternatively, install dependencies individually:

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Environment Configuration

Create a local `.env` file in the `server` directory based on `.env.example`:

```bash
cp server/.env.example server/.env
```

Default configuration in `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/imovies
CORS_ORIGIN=http://localhost:5173
```

> **Note:** `.env` files are excluded from version control to prevent exposing sensitive configuration.

### 3. Running the Application

Start both frontend and backend concurrently:

```bash
npm run dev
```

Or run them individually:

- **Backend API**: `npm run dev:server` (running at `http://localhost:5000`)
- **Frontend Client**: `npm run dev:client` (running at `http://localhost:5173`)

### 4. Verification and Health Check

Verify that the backend and MongoDB database connection are operating properly:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "uptime": 12,
  "timestamp": "2026-10-28T00:00:00.000Z",
  "environment": "development",
  "database": {
    "status": "connected",
    "name": "imovies"
  }
}
```

### 5. Running Tests and Production Build

```bash
# Run backend test suite
npm test

# Build frontend for production
npm run build
```

## Project Requirements

See [`PROJECT_CHECKLIST.md`](PROJECT_CHECKLIST.md) for the 19 required project milestones.

## Scope

This project initially uses simulated payments for demonstration and does not process real financial transactions.