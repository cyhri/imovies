# IMovies â€” End-to-End User Flows

This document details the primary customer and administrator workflows in the IMovies application.

---

## 1. Customer Ticket Booking Journey with Real-Time Holds

```
[ Movie Catalog ] â”€â”€> [ View Showtimes ] â”€â”€> [ Live Seat Map ] â”€â”€> [ Temporary 5-Min Hold ] â”€â”€> [ Booking Review ] â”€â”€> [ Confirmed Booking ]
                                                    â”‚                         â”‚                                            â”‚
                                           (Socket Sync)            (Hold Countdown)                         [ My Bookings / Cancel ]
```

### Step 1: Movie Discovery
1. The user browses the homepage catalog.
2. The user can filter by Genre (Action, Sci-Fi, Drama...), Age Rating (PG, PG-13, R...), or search title in real-time.
3. The user clicks **View Showtimes** on their chosen release.

### Step 2: Showtime Selection
1. A modal displays movie synopsis, duration, rating, and scheduled screenings.
2. The user reviews venue names, screen formats (IMAX, Dolby Cinema, 2D), show dates, and start times.
3. The user clicks **Choose Seats** on their preferred screening.

### Step 3: Interactive Seat Selection & Real-Time Multiplayer Sync
1. The 2D seating layout opens, oriented towards the curved **Cinema Screen** banner.
2. A **Live Availability** badge indicates real-time Socket.IO synchronization:
   - When other users hold, release, or book seats, availability updates instantly on screen without refreshing.
   - If the WebSocket drops, the client automatically falls back to an 8-second polling interval.
3. Seat Category & Status Identification:
   - **VIP** (Gold / Amber tier)
   - **Premium** (Purple tier)
   - **Standard** (Slate / Gray tier)
   - **Held by You** (Glowing gold badge with active hold countdown)
   - **Held by Another Customer** (Orange/amber badge, disabled)
   - **Booked** (Crossed-out, disabled)
4. The user selects seats by clicking on available seats.

### Step 4: Temporary Seat Hold & Countdown
1. When the user clicks **Hold Seats & Review**:
   - If unauthenticated, a quick modal prompts them to sign in.
   - The frontend calls `POST /api/shows/:id/holds`.
   - The backend atomically reserves the seats for 5 minutes (`HOLD_DURATION_SECONDS`).
   - The Socket.IO server broadcasts `seats:held` to all connected clients viewing the same show.
2. An interactive **Hold Countdown Tray** appears with a ticking timer (`04:59`).
3. The user has 5 minutes of guaranteed exclusivity to complete the checkout.
4. If the user navigates away or closes the map, the hold is cleanly released via `DELETE /api/shows/:id/holds/:holdToken`.

### Step 5: Booking Review & Confirmation
1. The review screen shows an itemized breakdown of tickets, venue, showtime, and authoritative total price.
2. A live timer banner reflects the active hold token and remaining checkout time.
3. A clear simulation notice clarifies: *"Simulation Mode Notice: Tickets will be confirmed with paymentStatus: unpaid. No real card will be charged."*
4. The user clicks **Confirm & Book Now**.
5. The backend validates the hold token, transitions the seats to `booked`, marks the hold `completed`, and broadcasts `seats:booked`.
6. On success, the **Booking Confirmed** view presents the unique booking reference (`IMV-XXXXX`), seat list, and status.

### Step 6: Hold Expiration Handling
1. If the 5-minute countdown expires before checkout:
   - A friendly alert notifies the customer: *"Your seat hold has expired. The seats have been released."*
   - The checkout modal automatically closes.
   - The seat map refreshes to show current availability.
   - Background worker and lazy expiration ensure the seats are immediately re-claimable by any customer.

### Step 7: Booking Management & Cancellation
1. Users can open **My Bookings** at any time from the top navigation.
2. Displays past and upcoming reservations with status badges.
3. For eligible upcoming shows, the user can click **Cancel Booking**.
4. The booking status transitions to `cancelled`, the backend releases the seats, and Socket.IO broadcasts `seats:released` to all connected clients.

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