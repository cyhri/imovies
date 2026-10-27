import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import {
  fetchMovies,
  fetchMovieById,
  fetchShows,
  fetchShowById,
  createBooking,
  fetchMyBookings,
  cancelBooking,
  loginUser,
  registerUser,
} from "./services/api.js";

const GENRES = ["All", "Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller"];
const RATINGS = ["All", "G", "PG", "PG-13", "R", "NC-17", "U", "UA", "A"];

function App() {
  // Current user state (stored in localStorage for convenience)
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("imovies_token") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("imovies_user") || "null");
    } catch {
      return null;
    }
  });

  // Movie Catalog state
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [sortBy, setSortBy] = useState("releaseDate");

  // Selected movie details & showtimes modal
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [movieShows, setMovieShows] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Active Seat Selection View
  const [activeShow, setActiveShow] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [showError, setShowError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]); // Array of seatNumber strings

  // Booking Review & Submission
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // User Auth Modal (if user tries to checkout unauthenticated)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState("customer@imovies.com");
  const [authPassword, setAuthPassword] = useState("CustomerPassword123!");
  const [authName, setAuthName] = useState("Cinema Fan");
  const [authError, setAuthError] = useState(null);

  // My Bookings Drawer
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // ---------------------------------------------------------------------------
  // Load Movie Catalog
  // ---------------------------------------------------------------------------
  const loadMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        sortBy,
        order: sortBy === "title" ? "asc" : "desc",
      };
      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (selectedGenre !== "All") params.genre = selectedGenre;
      if (selectedRating !== "All") params.rating = selectedRating;

      const res = await fetchMovies(params);
      setMovies(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load movie catalog. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedGenre, selectedRating, sortBy]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadMovies();
    }, 250);
    return () => clearTimeout(handler);
  }, [loadMovies]);

  // ---------------------------------------------------------------------------
  // Open Movie Details & Upcoming Showtimes
  // ---------------------------------------------------------------------------
  const openMovieDetails = async (movie) => {
    setSelectedMovie(movie);
    setDetailsLoading(true);
    setDetailsError(null);
    setMovieShows([]);

    try {
      const [detailRes, showsRes] = await Promise.all([
        fetchMovieById(movie._id),
        fetchShows({ movie: movie._id }),
      ]);
      setMovieDetails(detailRes.data);
      setMovieShows(showsRes.data || []);
    } catch (err) {
      setDetailsError(err.message || "Could not retrieve full showtime details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
    setMovieShows([]);
    setDetailsError(null);
  };

  // ---------------------------------------------------------------------------
  // Seat Selection View
  // ---------------------------------------------------------------------------
  const startSeatSelection = async (showId) => {
    closeDetails();
    setShowLoading(true);
    setShowError(null);
    setSelectedSeats([]);

    try {
      const res = await fetchShowById(showId);
      setActiveShow(res.data);
    } catch (err) {
      setShowError(err.message || "Could not load seat map for this show.");
    } finally {
      setShowLoading(false);
    }
  };

  const closeSeatSelection = () => {
    setActiveShow(null);
    setSelectedSeats([]);
    setShowError(null);
  };

  // Toggle seat selection
  const handleSeatClick = (seat) => {
    if (seat.status !== "available") return;

    setSelectedSeats((prev) => {
      if (prev.includes(seat.seatNumber)) {
        return prev.filter((s) => s !== seat.seatNumber);
      } else {
        return [...prev, seat.seatNumber];
      }
    });
  };

  // Calculate authoritative selected seat objects and total price
  const getSelectedSeatDetails = () => {
    if (!activeShow || !activeShow.seats) return [];
    return activeShow.seats.filter((s) => selectedSeats.includes(s.seatNumber));
  };

  const selectedSeatObjects = getSelectedSeatDetails();
  const calculatedTotal = selectedSeatObjects.reduce((sum, s) => sum + (s.price || 0), 0);

  // ---------------------------------------------------------------------------
  // Authentication Actions
  // ---------------------------------------------------------------------------
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      let res;
      if (authMode === "register") {
        res = await registerUser({ name: authName, email: authEmail, password: authPassword });
      } else {
        res = await loginUser({ email: authEmail, password: authPassword });
      }
      const token = res.data.token;
      const user = res.data.user;
      setAuthToken(token);
      setCurrentUser(user);
      localStorage.setItem("imovies_token", token);
      localStorage.setItem("imovies_user", JSON.stringify(user));
      setAuthModalOpen(false);
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    setCurrentUser(null);
    localStorage.removeItem("imovies_token");
    localStorage.removeItem("imovies_user");
  };

  // ---------------------------------------------------------------------------
  // Booking Submission & Concurrency Handling
  // ---------------------------------------------------------------------------
  const handleProceedToReview = () => {
    if (selectedSeats.length === 0) return;
    if (!authToken) {
      setAuthModalOpen(true);
      return;
    }
    setReviewModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!authToken) {
      setAuthModalOpen(true);
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await createBooking(
        {
          showId: activeShow._id,
          seatNumbers: selectedSeats,
        },
        authToken
      );

      setConfirmedBooking(res.data);
      setReviewModalOpen(false);
      // Refresh active show seat status
      const updatedShow = await fetchShowById(activeShow._id);
      setActiveShow(updatedShow.data);
      setSelectedSeats([]);
    } catch (err) {
      setBookingError(err.message || "Booking failed.");
      // Refresh show seat statuses in case of seat collision
      try {
        const refreshed = await fetchShowById(activeShow._id);
        setActiveShow(refreshed.data);
      } catch {}
    } finally {
      setBookingLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // My Bookings & Cancellation
  // ---------------------------------------------------------------------------
  const openMyBookings = async () => {
    if (!authToken) {
      setAuthModalOpen(true);
      return;
    }
    setMyBookingsOpen(true);
    setMyBookingsLoading(true);
    try {
      const res = await fetchMyBookings(authToken);
      setMyBookings(res.data || []);
    } catch (err) {
      alert("Failed to load booking history: " + err.message);
    } finally {
      setMyBookingsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking and release the seats?")) {
      return;
    }
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, authToken);
      const res = await fetchMyBookings(authToken);
      setMyBookings(res.data || []);
      // If currently viewing the cancelled show, refresh it
      if (activeShow) {
        const refShow = await fetchShowById(activeShow._id);
        setActiveShow(refShow.data);
      }
    } catch (err) {
      alert("Cancellation failed: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // Group seats by row for 2D Seat Map representation
  const groupSeatsByRow = (seats = []) => {
    const rowMap = {};
    for (const seat of seats) {
      const row = seat.seatNumber.charAt(0);
      if (!rowMap[row]) rowMap[row] = [];
      rowMap[row].push(seat);
    }
    // Sort seats in each row by seat number
    for (const r in rowMap) {
      rowMap[r].sort((a, b) => {
        const numA = parseInt(a.seatNumber.substring(1), 10);
        const numB = parseInt(b.seatNumber.substring(1), 10);
        return numA - numB;
      });
    }
    return rowMap;
  };

  return (
    <div className="app">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark border-bottom border-secondary px-4 py-3 sticky-top bg-black">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <a className="navbar-brand fw-bold fs-3 text-white text-decoration-none" href="/">
              IMOVIES<span className="accent">.</span>
            </a>
            {activeShow && (
              <button
                className="btn btn-outline-secondary btn-sm text-light"
                onClick={closeSeatSelection}
              >
                â† Back to Movies
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {currentUser ? (
              <>
                <button className="btn btn-outline-light btn-sm" onClick={openMyBookings}>
                  ðŸŽŸ My Bookings
                </button>
                <span className="text-secondary small d-none d-md-inline ms-2">
                  Hi, <strong className="text-white">{currentUser.name}</strong>
                </span>
                <button className="btn btn-sm btn-outline-secondary text-secondary ms-2" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button
                className="btn btn-outline-danger btn-sm fw-semibold"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* --------------------------------------------------------------------- */}
      {/* SEAT SELECTION VIEW                                                  */}
      {/* --------------------------------------------------------------------- */}
      {activeShow ? (
        <main className="container py-4 flex-grow-1">
          {/* Header Bar */}
          <div className="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-4 border-bottom border-secondary">
            <div>
              <span className="badge bg-danger mb-1">{activeShow.screen?.screenType || "2D"}</span>
              <h3 className="fw-bold text-white mb-0">{activeShow.movie?.title}</h3>
              <p className="text-secondary small mb-0 mt-1">
                {activeShow.theatre?.name} ({activeShow.theatre?.city}) Â·{" "}
                {activeShow.screen?.name || `Screen ${activeShow.screen?.screenNumber}`} Â·{" "}
                {new Date(activeShow.startTime).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(activeShow.startTime).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="d-flex gap-3 text-secondary small mt-3 mt-md-0">
              {(activeShow.pricing || []).map((p) => (
                <div key={p.tier} className="text-light">
                  <span className="text-capitalize">{p.tier}</span>:{" "}
                  <strong className="accent">${p.price}</strong>
                </div>
              ))}
            </div>
          </div>

          {showLoading && (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status" />
              <p className="text-secondary mt-2">Loading interactive screen layout...</p>
            </div>
          )}

          {showError && (
            <div className="alert alert-danger" role="alert">
              {showError}
            </div>
          )}

          {!showLoading && !showError && (
            <div className="p-4 rounded-3 text-center" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Screen graphic */}
              <div className="screen-visual" />

              {/* 2D Interactive Seat Map */}
              <div className="seat-grid">
                {Object.entries(groupSeatsByRow(activeShow.seats || [])).map(([row, seats]) => (
                  <div key={row} className="seat-row">
                    <span className="row-label">{row}</span>
                    {seats.map((seat) => {
                      const isSelected = selectedSeats.includes(seat.seatNumber);
                      const tierClass =
                        seat.tier === "vip"
                          ? "seat-vip"
                          : seat.tier === "premium"
                          ? "seat-premium"
                          : "seat-standard";

                      const statusClass =
                        seat.status === "booked"
                          ? "seat-booked"
                          : seat.status === "reserved"
                          ? "seat-reserved"
                          : isSelected
                          ? "seat-selected"
                          : tierClass;

                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          className={`seat-btn ${statusClass}`}
                          disabled={seat.status !== "available"}
                          onClick={() => handleSeatClick(seat)}
                          title={`${seat.seatNumber} Â· ${seat.tier?.toUpperCase()} Â· $${seat.price} (${seat.status})`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                    <span className="row-label">{row}</span>
                  </div>
                ))}
              </div>

              {/* Seat Legend */}
              <div className="d-flex flex-wrap justify-content-center gap-4 text-secondary small pt-3 border-top border-secondary border-opacity-25">
                <div>
                  <span className="legend-dot seat-standard" /> Standard ($
                  {activeShow.pricing?.find((p) => p.tier === "standard")?.price || 10})
                </div>
                <div>
                  <span className="legend-dot seat-premium" /> Premium ($
                  {activeShow.pricing?.find((p) => p.tier === "premium")?.price || 15})
                </div>
                <div>
                  <span className="legend-dot seat-vip" /> VIP ($
                  {activeShow.pricing?.find((p) => p.tier === "vip")?.price || 20})
                </div>
                <div>
                  <span className="legend-dot seat-selected" /> Selected
                </div>
                <div>
                  <span className="legend-dot seat-booked" /> Booked
                </div>
              </div>

              {/* Selected Seats Bottom Action Tray */}
              <div
                className="mt-4 p-3 rounded-3 d-flex flex-wrap justify-content-between align-items-center"
                style={{ background: "#1c1c2b", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <div className="text-start">
                  <div className="small text-secondary">Selected Seats:</div>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {selectedSeats.length === 0 ? (
                      <span className="text-secondary small fst-italic">None selected (Click available seats above)</span>
                    ) : (
                      selectedSeats.map((num) => (
                        <span key={num} className="badge bg-danger text-white">
                          {num}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3 mt-3 mt-sm-0">
                  <div className="text-end">
                    <div className="small text-secondary">Authoritative Total:</div>
                    <div className="fs-4 fw-bold accent">${calculatedTotal}</div>
                  </div>

                  <button
                    className="btn btn-danger btn-lg px-4 fw-semibold"
                    disabled={selectedSeats.length === 0}
                    onClick={handleProceedToReview}
                  >
                    Proceed to Review ({selectedSeats.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* ------------------------------------------------------------------- */
        /* MOVIE CATALOG VIEW (DEFAULT)                                       */
        /* ------------------------------------------------------------------- */
        <>
          <header className="hero container text-center">
            <p className="accent fw-bold text-uppercase tracking-wider small mb-2">
              Theatrical releases & live seat reservation
            </p>
            <h1 className="display-4 fw-black">
              EXPLORE MOVIES.
              <br />
              <span className="accent">PICK YOUR EXACT SEATS.</span>
            </h1>
            <p className="lead text-secondary mt-3 mx-auto" style={{ maxWidth: "600px" }}>
              Select a title to view schedules and open the real-time cinema seating map.
            </p>
          </header>

          <section className="container mb-5 flex-grow-1">
            {/* Filter bar */}
            <div
              className="p-3 rounded-3 mb-4"
              style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="row g-3 align-items-center">
                <div className="col-12 col-md-5">
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="Search movies by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="col-6 col-md-2">
                  <select
                    className="form-select custom-select"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g === "All" ? "All Genres" : g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <select
                    className="form-select custom-select"
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                  >
                    {RATINGS.map((r) => (
                      <option key={r} value={r}>
                        {r === "All" ? "All Ratings" : r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <select
                    className="form-select custom-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="releaseDate">Sort: Release Date (Newest)</option>
                    <option value="title">Sort: Title (A-Z)</option>
                    <option value="duration">Sort: Duration</option>
                  </select>
                </div>
              </div>
            </div>

            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status" />
                <p className="text-secondary mt-3">Connecting to movie catalog...</p>
              </div>
            )}

            {error && !loading && (
              <div className="alert alert-danger d-flex justify-content-between align-items-center">
                <div>
                  <strong>Error:</strong> {error}
                </div>
                <button className="btn btn-sm btn-outline-danger" onClick={loadMovies}>
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && movies.length === 0 && (
              <div className="text-center py-5 rounded-3" style={{ background: "#14141e" }}>
                <h4 className="fw-bold">No movies found</h4>
                <p className="text-secondary">Try adjusting your search query or filters.</p>
                <button
                  className="btn btn-outline-secondary btn-sm mt-2"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedGenre("All");
                    setSelectedRating("All");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}

            {!loading && !error && movies.length > 0 && (
              <div className="row g-4">
                {movies.map((movie) => (
                  <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div className="movie-card">
                      <div className="poster-wrapper">
                        {movie.posterUrl ? (
                          <img src={movie.posterUrl} alt={movie.title} className="poster-img" />
                        ) : (
                          <div className="poster-placeholder">
                            <span className="fs-1">ðŸŽ¬</span>
                            <span className="small mt-2">{movie.language || "Cinema"}</span>
                          </div>
                        )}
                        {movie.rating && <span className="rating-badge">{movie.rating}</span>}
                      </div>

                      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                        <div>
                          <h5 className="fw-bold text-white text-truncate mb-1" title={movie.title}>
                            {movie.title}
                          </h5>
                          <div className="text-secondary small mb-2">
                            <span>{movie.duration} min</span>
                            {movie.language && <span> Â· {movie.language}</span>}
                          </div>

                          <div className="mb-3">
                            {(movie.genres || []).map((genre) => (
                              <span key={genre} className="genre-badge">
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          className="btn btn-danger btn-sm w-100 fw-semibold mt-auto"
                          onClick={() => openMovieDetails(movie)}
                        >
                          View Showtimes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MOVIE DETAILS & SHOWTIMES MODAL                                       */}
      {/* --------------------------------------------------------------------- */}
      {selectedMovie && (
        <div className="modal-backdrop-custom" onClick={closeDetails}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-start border-bottom border-secondary pb-3 mb-4">
              <div>
                <h3 className="fw-bold text-white mb-1">{selectedMovie.title}</h3>
                <div className="text-secondary small">
                  <span>{selectedMovie.duration} mins</span>
                  <span> Â· {selectedMovie.language}</span>
                  {selectedMovie.rating && <span> Â· Rating: {selectedMovie.rating}</span>}
                </div>
              </div>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={closeDetails}>
                âœ•
              </button>
            </div>

            {detailsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-danger spinner-border-sm" role="status" />
                <p className="text-secondary small mt-2">Loading showtimes...</p>
              </div>
            ) : detailsError ? (
              <div className="alert alert-warning small">{detailsError}</div>
            ) : (
              <div>
                <p className="text-light" style={{ lineHeight: "1.6" }}>
                  {movieDetails?.description || selectedMovie.description}
                </p>

                <h5 className="fw-bold text-white border-bottom border-secondary pb-2 mb-3 mt-4">
                  Select a Showtime
                </h5>

                {movieShows.length === 0 ? (
                  <p className="text-secondary small">
                    No active screenings currently scheduled for this release.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3 mb-3">
                    {movieShows.map((show) => {
                      const startTime = new Date(show.startTime);
                      const formattedDate = startTime.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });
                      const formattedTime = startTime.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const availableCount =
                        show.seatsAvailableCount ??
                        show.seats?.filter((s) => s.status === "available").length ??
                        0;

                      return (
                        <div key={show._id} className="showtime-pill">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                              <strong className="text-white">{show.theatre?.name}</strong>
                              <span className="text-secondary small ms-2">({show.theatre?.city})</span>
                              <div className="text-secondary small">
                                {show.screen?.name || `Screen ${show.screen?.screenNumber}`} Â·{" "}
                                {show.screen?.screenType || "2D"}
                              </div>
                            </div>

                            <div className="text-end">
                              <span className="badge bg-danger text-white mb-1 d-block">
                                {formattedDate} Â· {formattedTime}
                              </span>
                              <span className="text-secondary small">
                                {availableCount} seats left
                              </span>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25">
                            <div className="d-flex gap-2 small">
                              {(show.pricing || []).map((p) => (
                                <span key={p.tier} className="text-secondary">
                                  {p.tier}: <strong className="text-light">${p.price}</strong>
                                </span>
                              ))}
                            </div>

                            <button
                              className="btn btn-sm btn-danger fw-semibold px-3"
                              onClick={() => startSeatSelection(show._id)}
                            >
                              Choose Seats â†’
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* BOOKING REVIEW MODAL                                                  */}
      {/* --------------------------------------------------------------------- */}
      {reviewModalOpen && activeShow && (
        <div className="modal-backdrop-custom" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-start border-bottom border-secondary pb-3 mb-3">
              <div>
                <h4 className="fw-bold text-white mb-0">Review Booking Details</h4>
                <div className="text-secondary small">Confirm your tickets before finalizing</div>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary text-white"
                onClick={() => setReviewModalOpen(false)}
              >
                âœ•
              </button>
            </div>

            {bookingError && (
              <div className="alert alert-danger small mb-3">
                <strong>Booking Conflict:</strong> {bookingError}
              </div>
            )}

            <div className="p-3 rounded-3 mb-3" style={{ background: "#1c1c2b" }}>
              <h5 className="fw-bold text-white mb-1">{activeShow.movie?.title}</h5>
              <div className="text-secondary small mb-2">
                {activeShow.theatre?.name} Â· {activeShow.screen?.name || `Screen ${activeShow.screen?.screenNumber}`} ({activeShow.screen?.screenType})
              </div>
              <div className="text-light small">
                ðŸ“…{" "}
                {new Date(activeShow.startTime).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(activeShow.startTime).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <h6 className="fw-bold text-white mb-2">Selected Seats ({selectedSeats.length})</h6>
            <div className="list-group mb-3">
              {selectedSeatObjects.map((seat) => (
                <div
                  key={seat.seatNumber}
                  className="list-group-item d-flex justify-content-between align-items-center text-light"
                  style={{ background: "#181824", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <div>
                    <span className="badge bg-danger me-2">{seat.seatNumber}</span>
                    <span className="text-capitalize small text-secondary">{seat.tier} Class</span>
                  </div>
                  <strong className="text-white">${seat.price}</strong>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between align-items-center p-3 rounded-2 mb-3 bg-black border border-secondary">
              <span className="text-secondary fw-semibold">Authoritative Total Price:</span>
              <span className="fs-3 fw-bold accent">${calculatedTotal}</span>
            </div>

            {/* Payment simulation notice */}
            <div
              className="p-3 rounded-2 small text-secondary mb-4"
              style={{ background: "#101018", border: "1px dashed rgba(255,255,255,0.15)" }}
            >
              ðŸ”’ <strong>Simulation Mode Notice:</strong> Tickets will be confirmed with{" "}
              <span className="badge bg-secondary">paymentStatus: unpaid</span>. Real credit card charging is intentionally excluded in this milestone.
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setReviewModalOpen(false)}
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger px-4 fw-bold"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
              >
                {bookingLoading ? "Reserving Seats..." : "Confirm & Book Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* BOOKING CONFIRMATION MODAL                                            */}
      {/* --------------------------------------------------------------------- */}
      {confirmedBooking && (
        <div className="modal-backdrop-custom" onClick={() => setConfirmedBooking(null)}>
          <div className="modal-dialog-custom p-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 fs-1 text-success">âœ“</div>
            <h3 className="fw-bold text-white mb-1">Booking Confirmed!</h3>
            <p className="text-secondary small mb-3">
              Your tickets have been reserved successfully.
            </p>

            <div className="p-3 rounded-3 text-start mb-3" style={{ background: "#1c1c2b" }}>
              <div className="small text-secondary">Booking Reference:</div>
              <div className="fs-4 fw-bold accent mb-2">{confirmedBooking.bookingReference}</div>

              <div className="row g-2 small text-light">
                <div className="col-6">
                  <span className="text-secondary">Seats:</span>{" "}
                  {confirmedBooking.seats?.map((s) => s.seatNumber).join(", ")}
                </div>
                <div className="col-6 text-end">
                  <span className="text-secondary">Total:</span>{" "}
                  <strong>${confirmedBooking.totalAmount}</strong>
                </div>
                <div className="col-6">
                  <span className="text-secondary">Booking Status:</span>{" "}
                  <span className="badge bg-success">{confirmedBooking.bookingStatus}</span>
                </div>
                <div className="col-6 text-end">
                  <span className="text-secondary">Payment:</span>{" "}
                  <span className="badge bg-warning text-dark">{confirmedBooking.paymentStatus}</span>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-danger px-4"
                onClick={() => {
                  setConfirmedBooking(null);
                  openMyBookings();
                }}
              >
                View in My Bookings
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setConfirmedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MY BOOKINGS DRAWER / MODAL                                             */}
      {/* --------------------------------------------------------------------- */}
      {myBookingsOpen && (
        <div className="modal-backdrop-custom" onClick={() => setMyBookingsOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
              <div>
                <h4 className="fw-bold text-white mb-0">My Bookings</h4>
                <div className="text-secondary small">Your past and upcoming ticket reservations</div>
              </div>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setMyBookingsOpen(false)}>
                âœ•
              </button>
            </div>

            {myBookingsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-danger spinner-border-sm" role="status" />
                <p className="text-secondary small mt-2">Loading reservations...</p>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <p>You have not booked any tickets yet.</p>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    setMyBookingsOpen(false);
                    closeSeatSelection();
                  }}
                >
                  Explore Current Movies
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {myBookings.map((b) => (
                  <div key={b._id} className="booking-item-card">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className="text-white fs-5">{b.show?.movie?.title || "Movie Booking"}</strong>
                        <div className="text-secondary small">
                          Ref: <strong className="text-light">{b.bookingReference}</strong>
                        </div>
                      </div>
                      <div className="text-end">
                        <span
                          className={`badge ${
                            b.bookingStatus === "confirmed"
                              ? "bg-success"
                              : b.bookingStatus === "cancelled"
                              ? "bg-secondary"
                              : "bg-warning"
                          } me-1`}
                        >
                          {b.bookingStatus}
                        </span>
                        <span className="badge bg-dark border border-secondary text-light">
                          {b.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="small text-secondary mb-2">
                      {b.show?.theatre?.name} ({b.show?.theatre?.city}) Â·{" "}
                      {b.show?.screen?.name || `Screen ${b.show?.screen?.screenNumber}`}
                      <br />
                      ðŸ“… {b.show?.startTime ? new Date(b.show.startTime).toLocaleString() : "Date TBD"}
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25 small">
                      <div>
                        <span className="text-secondary">Seats:</span>{" "}
                        {b.seats?.map((s) => (
                          <span key={s.seatNumber} className="badge bg-danger me-1">
                            {s.seatNumber}
                          </span>
                        ))}
                        <span className="text-secondary ms-2">Total:</span>{" "}
                        <strong className="accent">${b.totalAmount}</strong>
                      </div>

                      {b.bookingStatus !== "cancelled" && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={cancellingId === b._id}
                          onClick={() => handleCancelBooking(b._id)}
                        >
                          {cancellingId === b._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* QUICK AUTH MODAL                                                      */}
      {/* --------------------------------------------------------------------- */}
      {authModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-dialog-custom p-4" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-3">
              <h5 className="fw-bold text-white mb-0">
                {authMode === "login" ? "Customer Sign In" : "Register Account"}
              </h5>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setAuthModalOpen(false)}>
                âœ•
              </button>
            </div>

            {authError && <div className="alert alert-danger small py-2">{authError}</div>}

            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <div className="mb-3">
                  <label className="form-label small text-secondary">Full Name</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={authName}
                    required
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small text-secondary">Email Address</label>
                <input
                  type="email"
                  className="form-control custom-input"
                  value={authEmail}
                  required
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">Password</label>
                <input
                  type="password"
                  className="form-control custom-input"
                  value={authPassword}
                  required
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-danger w-100 fw-bold py-2 mb-3">
                {authMode === "login" ? "Sign In & Continue" : "Create Account & Continue"}
              </button>

              <div className="text-center small text-secondary">
                {authMode === "login" ? (
                  <>
                    Need an account?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-danger text-decoration-none small"
                      onClick={() => setAuthMode("register")}
                    >
                      Register here
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-danger text-decoration-none small"
                      onClick={() => setAuthMode("login")}
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto container py-4 text-secondary border-top border-secondary small d-flex justify-content-between align-items-center">
        <span>IMovies Â· Full-Stack MERN Cinema Management</span>
        <span className="text-secondary">v1.2.0</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);