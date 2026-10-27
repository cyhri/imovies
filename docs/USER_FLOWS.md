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