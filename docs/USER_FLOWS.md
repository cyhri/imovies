# IMovies â€” End-to-End User Flows

This document details the primary customer and administrator workflows in the IMovies application.

---

## 1. Customer Ticket Booking Journey

```
[ Movie Catalog ] â”€â”€> [ View Showtimes ] â”€â”€> [ Seat Selection Map ] â”€â”€> [ Booking Review ] â”€â”€> [ Confirmed Booking ]
                                                                                   â”‚
                                                                                   â””â”€â”€> [ My Bookings / Cancel ]
```

### Step 1: Movie Discovery
1. The user browses the homepage catalog.
2. The user can filter by Genre (Action, Sci-Fi, Drama...), Age Rating (PG, PG-13, R...), or search title in real-time.
3. The user clicks **View Showtimes** on their chosen release.

### Step 2: Showtime Selection
1. A modal displays movie synopsis, duration, rating, and scheduled screenings.
2. The user reviews venue names, screen formats (IMAX, Dolby Cinema, 2D), show dates, and start times.
3. The user clicks **Choose Seats** on their preferred screening.

### Step 3: Interactive Seat Selection
1. The 2D seating layout opens, oriented towards the curved **Cinema Screen** banner.
2. The user distinguishes seats by category:
   - **VIP** (Gold / Amber tier)
   - **Premium** (Purple tier)
   - **Standard** (Slate / Gray tier)
   - **Booked** (Crossed-out, disabled)
3. The user selects seats by clicking on them. Selected seats glow in vibrant red.
4. The live selection tray displays selected seat labels and calculates the authoritative total price.
5. The user clicks **Proceed to Review**.

### Step 4: Booking Review & Authentication
1. If the user is unauthenticated, a quick modal prompts them to sign in or create an account.
2. The review screen shows an itemized breakdown of tickets, venue, showtime, and authoritative total price.
3. A clear simulation notice clarifies: *"Simulation Mode Notice: Tickets will be confirmed with paymentStatus: unpaid. No real card will be charged."*
4. The user clicks **Confirm & Book Now**.

### Step 5: Concurrency Safety & Confirmation
1. The backend atomically locks and books the requested seats.
2. If another user booked any of the selected seats simultaneously, a friendly conflict banner appears: *"One or more selected seats were just reserved by another customer. Please choose different seats."*
3. On success, the **Booking Confirmed** view presents the unique booking reference (`IMV-XXXXX`), seat list, and status.

### Step 6: Booking Management & Cancellation
1. Users can open **My Bookings** at any time from the top navigation.
2. Displays past and upcoming reservations with status badges.
3. For eligible upcoming shows, the user can click **Cancel Booking**.
4. The booking status transitions to `cancelled`, and the backend immediately releases the seats back to `available` status in the show's inventory.

---

## 2. Administrator Operations & Management Journey

```
[ Admin Login ] â”€â”€> [ Live KPI Overview ] â”€â”€â”¬â”€â”€> [ Movie Management ]
                                           â”œâ”€â”€> [ Venues & Screens ]
                                           â”œâ”€â”€> [ Showtime Scheduling ]
                                           â””â”€â”€> [ Platform Bookings Audit ]
```

### Step 1: Admin Authentication & Route Protection
1. An administrator signs in via the login modal. The backend issues a JWT containing `{ id, role: 'admin' }`.
2. The user profile menu displays an **Admin Dashboard** navigation button.
3. If an unauthenticated user or regular customer navigates directly to `/admin`, the application renders a designated **Access Denied (HTTP 403)** screen with an explanation and a link back to the catalog.
4. Client-side route guarding is paired with server-side authorization middleware (`authorize('admin')`) on every administrative endpoint.

### Step 2: Live Platform Overview & Metrics
1. The **Overview** tab displays real-time KPI counter cards:
   - **Active Movies** (and total catalog size)
   - **Venues & Screens** (theatre count and total screen count)
   - **Scheduled Shows** (and historical screening count)
   - **Total Bookings** (with breakdown of confirmed vs. cancelled)
   - **Total Gross Revenue** (computed directly via MongoDB aggregation pipeline)
2. A summary table highlights the latest platform bookings with direct customer information and status badges.

### Step 3: Movie Management
1. **Catalog Inventory**: Administrators view active and inactive films in a responsive table.
2. **Release Creation**: Administrators click **+ Add Movie** to open the creation form:
   - Title, description, duration (minutes), release date.
   - Comma-separated genre tags, spoken language, age classification rating (`G`, `PG`, `PG-13`, `R`, `NC-17`, `U`, `UA`, `A`).
   - High-resolution poster image URL.
3. **Editing & Status Toggling**:
   - Movie metadata can be updated in-place via **Edit**.
   - Admins can soft-deactivate a movie, removing it from customer listings while preserving historical show records.

### Step 4: Theatres & Screens Configuration
1. **Venues**: Admins can add or update theatre venues, including name, address, city, and state.
2. **Auditoriums / Screens**:
   - Selecting a theatre dynamically loads its associated auditoriums.
   - Admins configure screen name, format (`Standard 2D`, `IMAX`, `Dolby Cinema`, `4DX`), and seating capacities across VIP, Premium, and Standard tiers.
   - Compound uniqueness on `{ theatre, screenNumber }` prevents duplicate room IDs.

### Step 5: Showtime Scheduling & Collision Detection
1. **Scheduling**:
   - Admins pick an active movie, theatre, and screen from dynamic dropdown menus.
   - Admins define screening start time, end time, and custom pricing tiers (VIP, Premium, Standard).
   - Upon submission, the backend automatically generates the 2D seat inventory for the screening based on screen capacity.
2. **Conflict Prevention**:
   - If a new showtime overlaps with an existing screening on the same screen, the backend halts creation with `409 Conflict`.
   - The UI immediately surfaces an alert detailing the time collision so the administrator can adjust schedules.
3. **Screening Cancellation**:
   - Admins can cancel upcoming screenings with a single click, instantly flagging the show as `cancelled`.

### Step 6: Platform Bookings Audit
1. The **Bookings** tab offers a complete overview of all customer transactions across all theatres.
2. Displays booking reference code, customer name/email, movie title, screening venue, booked seats, and authoritative total amount.
3. Admins can view individual booking details or cancel bookings if needed.