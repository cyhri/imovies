# IMovies — Technical Architecture

## 1. Project Overview

IMovies is a full-stack web application designed to simplify movie discovery, cinema scheduling, and ticket reservations.

The platform allows users to browse movies, explore available screenings, select seats, complete a simulated payment, and manage their bookings. Administrators can manage movies, theatres, and show schedules through a protected administrative interface.

The system follows a client-server architecture and uses the MERN technology stack.

## 2. Architectural Goals

The architecture is designed to provide:

* Separation of frontend and backend responsibilities.
* Secure authentication and role-based authorization.
* Reliable booking and seat-availability validation.
* Consistent database relationships.
* Maintainable and reusable application components.
* Centralized error handling and input validation.
* Responsive user interfaces.
* A structure that supports future improvements.

## 3. Technology Stack

| Layer              | Technology          | Responsibility                               |
| ------------------ | ------------------- | -------------------------------------------- |
| Frontend           | React.js            | User interface and client-side interactions  |
| Styling            | Bootstrap 5 and CSS | Responsive layouts and visual design         |
| Routing            | React Router        | Client-side navigation                       |
| HTTP Client        | Axios               | Communication with backend APIs              |
| Backend Runtime    | Node.js             | Server-side JavaScript execution             |
| Web Framework      | Express.js          | REST API routing and middleware              |
| Database           | MongoDB             | Persistent application data                  |
| ODM                | Mongoose            | Data models, validation, and database access |
| Authentication     | JWT                 | Authenticated API access                     |
| Password Security  | bcryptjs            | Password hashing                             |
| Notifications      | React Toastify      | User-facing feedback                         |
| Version Control    | Git                 | Source history and change tracking           |
| Repository Hosting | GitHub              | Remote repository and collaboration          |

Socket.IO may be added to support real-time seat-availability updates.

## 4. High-Level Architecture

The application contains three principal layers.

### 4.1 Presentation Layer

The React frontend provides the interface for users and administrators.

Responsibilities include:

* Displaying movie listings and details.
* Searching and filtering movies.
* Presenting theatre showtimes.
* Displaying interactive seating layouts.
* Collecting registration and login information.
* Displaying booking summaries and confirmations.
* Showing booking history and administrative tools.
* Communicating loading, success, and error states.

The frontend must not be trusted to enforce booking security or calculate authoritative prices.

### 4.2 Application Layer

The Node.js and Express.js backend processes requests from the frontend.

Responsibilities include:

* Authenticating users.
* Authorizing protected operations.
* Validating incoming requests.
* Managing movies, theatres, and shows.
* Checking seat availability.
* Creating and cancelling bookings.
* Processing simulated payment outcomes.
* Enforcing booking and cancellation rules.
* Returning consistent API responses.
* Logging errors and handling failures.

Business rules and database operations are implemented on the server.

### 4.3 Data Layer

MongoDB stores the application's persistent data.

Mongoose provides schemas, validation, references, and database access.

The planned collections are:

* Users
* Movies
* Theatres
* Shows
* Seats or show-specific seat inventory
* Bookings
* Payments
* Notifications

The final schema will be documented in `DATABASE.md`.

## 5. Request Lifecycle

A typical request follows this sequence:

1. The user performs an action in the React interface.
2. The frontend sends an HTTP request through Axios.
3. Express receives the request.
4. Middleware validates the request and checks authentication where required.
5. The appropriate route invokes its controller.
6. The controller calls the relevant service or model.
7. Mongoose communicates with MongoDB.
8. The server returns an appropriate HTTP response.
9. The frontend updates the interface and displays feedback.

Protected operations must be authorized by the backend, regardless of frontend route protection.

## 6. Authentication and Authorization

The system defines two principal roles.

### User

An authenticated user may browse movies, create bookings, view their own reservations, and cancel eligible bookings.

### Admin

An authorized administrator may manage movies, theatres, and show schedules and view administrative statistics.

Security controls include:

* Password hashing using bcryptjs.
* JWT-based authentication.
* Server-side role checks.
* Protected API endpoints.
* Request validation.
* Rate limiting on sensitive endpoints.
* Restricted access to user booking information.
* Environment-based configuration for secrets.

Administrative privileges must never be granted merely because a client submits an `admin` role.

## 7. Booking Architecture

A booking is associated with an authenticated user, a specific show, selected seats, and a calculated total.

The server must:

1. Validate the show and requested seats.
2. Verify that the seats belong to the selected show.
3. Recheck availability at booking time.
4. Prevent conflicting reservations.
5. Calculate the authoritative price.
6. Apply the simulated payment workflow.
7. Confirm the booking only after the required checks succeed.
8. Return a booking reference and confirmation details.

Database transactions or an appropriate atomic reservation strategy must be used to prevent concurrent requests from booking the same seats.

The implementation must handle payment failure and permitted cancellation without leaving seats incorrectly marked as booked.

## 8. API Design

The backend exposes REST-style endpoints under `/api`.

Planned endpoint groups include:

* `/api/auth` — registration, login, and current-user information.
* `/api/movies` — movie discovery and movie details.
* `/api/theatres` — theatre information.
* `/api/shows` — screenings and show-specific seat availability.
* `/api/bookings` — booking creation, history, and cancellation.
* `/api/payments` — simulated payment processing.
* `/api/admin` — protected administrative operations.

Detailed request and response contracts will be maintained in `API.md` when the endpoints are implemented.

## 9. Error Handling and Observability

The backend will use centralized error-handling middleware.

The implementation should:

* Return meaningful HTTP status codes.
* Validate request parameters and database identifiers.
* Avoid exposing internal stack traces in production.
* Record useful development and server logs.
* Handle unavailable database connections gracefully.
* Display appropriate error messages in the frontend.

## 10. Performance and Scalability

Planned improvements include:

* Indexes for common movie searches.
* Efficient show and booking queries.
* Pagination for movie listings and booking history.
* Reusable frontend components.
* Separation of controllers and business logic.
* Appropriate database connection management.
* Real-time seat updates where practical.

Performance optimizations will be validated against actual application behavior.

## 11. Development and Deployment

The application will initially run locally on Windows 11.

The frontend and backend will use separate development servers and communicate through HTTP APIs.

Configuration values, including the MongoDB connection string, JWT secret, and server port, will be supplied through environment variables.

The project will be tracked with Git and hosted on GitHub.

## 12. Current Implementation Status

This document defines the intended architecture. It does not imply that every component has already been implemented or tested.

Implementation and testing status will be updated as development progresses.
