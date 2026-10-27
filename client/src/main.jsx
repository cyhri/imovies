import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import {
  fetchMovies,
  fetchMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  fetchTheatres,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  fetchScreensByTheatre,
  createScreen,
  deleteScreen,
  fetchShows,
  fetchShowById,
  createShow,
  cancelShow,
  createBooking,
  fetchMyBookings,
  cancelBooking,
  loginUser,
  registerUser,
  fetchAdminOverview,
  fetchAdminBookings,
} from "./services/api.js";

const GENRES = ["All", "Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller"];
const RATINGS = ["All", "G", "PG", "PG-13", "R", "NC-17", "U", "UA", "A"];
const SCREEN_TYPES = ["2D", "3D", "IMAX", "4DX", "Dolby Cinema"];

function App() {
  // Current user & authentication state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("imovies_token") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("imovies_user") || "null");
    } catch {
      return null;
    }
  });

  // Top-level navigation: 'storefront' | 'admin'
  const [portalView, setPortalView] = useState(() => {
    return window.location.pathname.startsWith("/admin") ? "admin" : "storefront";
  });

  // ---------------------------------------------------------------------------
  // STOREFRONT STATE
  // ---------------------------------------------------------------------------
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [sortBy, setSortBy] = useState("releaseDate");

  // Selected movie modal
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [movieShows, setMovieShows] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Active Seat Selection View
  const [activeShow, setActiveShow] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [showError, setShowError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Booking Review & Submission
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // User Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
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
  // ADMIN DASHBOARD STATE
  // ---------------------------------------------------------------------------
  const [adminTab, setAdminTab] = useState("overview"); // 'overview' | 'movies' | 'theatres' | 'shows' | 'bookings'
  const [adminOverview, setAdminOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Admin Movies Management
  const [adminMovies, setAdminMovies] = useState([]);
  const [adminMoviesLoading, setAdminMoviesLoading] = useState(false);
  const [movieModalOpen, setMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    duration: 120,
    genres: "Action, Sci-Fi",
    language: "English",
    releaseDate: "2026-01-01",
    rating: "PG-13",
    posterUrl: "",
    isActive: true,
  });
  const [movieFormError, setMovieFormError] = useState(null);
  const [movieFormLoading, setMovieFormLoading] = useState(false);

  // Admin Theatres & Screens Management
  const [adminTheatres, setAdminTheatres] = useState([]);
  const [theatresLoading, setTheatresLoading] = useState(false);
  const [theatreModalOpen, setTheatreModalOpen] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [theatreForm, setTheatreForm] = useState({ name: "", city: "", address: "", phone: "" });
  const [theatreFormError, setTheatreFormError] = useState(null);

  const [selectedTheatreForScreens, setSelectedTheatreForScreens] = useState(null);
  const [theatreScreens, setTheatreScreens] = useState([]);
  const [screensLoading, setScreensLoading] = useState(false);
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [screenForm, setScreenForm] = useState({ screenNumber: 1, name: "Screen 1", screenType: "2D", seatingCapacity: 50 });
  const [screenFormError, setScreenFormError] = useState(null);

  // Admin Showtimes Management
  const [adminShows, setAdminShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [showForm, setShowForm] = useState({
    movieId: "",
    theatreId: "",
    screenId: "",
    startTime: "",
    endTime: "",
    priceStandard: 12,
    pricePremium: 18,
    priceVip: 25,
  });
  const [availableScreensForShow, setAvailableScreensForShow] = useState([]);
  const [showFormError, setShowFormError] = useState(null);
  const [showFormLoading, setShowFormLoading] = useState(false);

  // Admin Bookings Overview
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);
  const [bookingFilterStatus, setBookingFilterStatus] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  // ---------------------------------------------------------------------------
  // Load Storefront Movie Catalog
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
      setError(err.message || "Failed to load movie catalog.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedGenre, selectedRating, sortBy]);

  useEffect(() => {
    if (portalView === "storefront") {
      const handler = setTimeout(() => {
        loadMovies();
      }, 250);
      return () => clearTimeout(handler);
    }
  }, [loadMovies, portalView]);

  // ---------------------------------------------------------------------------
  // Authentication Management
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
    setPortalView("storefront");
  };

  // ---------------------------------------------------------------------------
  // Admin Data Fetchers
  // ---------------------------------------------------------------------------
  const loadAdminOverview = useCallback(async () => {
    if (!authToken || currentUser?.role !== "admin") return;
    setOverviewLoading(true);
    try {
      const res = await fetchAdminOverview(authToken);
      setAdminOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOverviewLoading(false);
    }
  }, [authToken, currentUser]);

  const loadAdminMovies = useCallback(async () => {
    setAdminMoviesLoading(true);
    try {
      const res = await fetchMovies({ all: "true", limit: 100 });
      setAdminMovies(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminMoviesLoading(false);
    }
  }, []);

  const loadAdminTheatres = useCallback(async () => {
    setTheatresLoading(true);
    try {
      const res = await fetchTheatres({ all: "true" });
      setAdminTheatres(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTheatresLoading(false);
    }
  }, []);

  const loadAdminShows = useCallback(async () => {
    setShowsLoading(true);
    try {
      const res = await fetchShows({ includePast: "true" });
      setAdminShows(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setShowsLoading(false);
    }
  }, []);

  const loadAdminBookings = useCallback(async () => {
    if (!authToken || currentUser?.role !== "admin") return;
    setAdminBookingsLoading(true);
    try {
      const res = await fetchAdminBookings(
        { status: bookingFilterStatus, search: bookingSearch, limit: 50 },
        authToken
      );
      setAdminBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminBookingsLoading(false);
    }
  }, [authToken, currentUser, bookingFilterStatus, bookingSearch]);

  useEffect(() => {
    if (portalView === "admin" && currentUser?.role === "admin") {
      if (adminTab === "overview") loadAdminOverview();
      if (adminTab === "movies") loadAdminMovies();
      if (adminTab === "theatres") loadAdminTheatres();
      if (adminTab === "shows") {
        loadAdminShows();
        loadAdminMovies();
        loadAdminTheatres();
      }
      if (adminTab === "bookings") loadAdminBookings();
    }
  }, [
    portalView,
    currentUser,
    adminTab,
    loadAdminOverview,
    loadAdminMovies,
    loadAdminTheatres,
    loadAdminShows,
    loadAdminBookings,
  ]);

  // ---------------------------------------------------------------------------
  // Admin Movie Actions
  // ---------------------------------------------------------------------------
  const handleOpenAddMovie = () => {
    setEditingMovie(null);
    setMovieForm({
      title: "",
      description: "",
      duration: 120,
      genres: "Action, Drama",
      language: "English",
      releaseDate: new Date().toISOString().substring(0, 10),
      rating: "PG-13",
      posterUrl: "",
      isActive: true,
    });
    setMovieFormError(null);
    setMovieModalOpen(true);
  };

  const handleOpenEditMovie = (movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title,
      description: movie.description,
      duration: movie.duration,
      genres: (movie.genres || []).join(", "),
      language: movie.language,
      releaseDate: movie.releaseDate ? movie.releaseDate.substring(0, 10) : "",
      rating: movie.rating || "PG-13",
      posterUrl: movie.posterUrl || "",
      isActive: movie.isActive,
    });
    setMovieFormError(null);
    setMovieModalOpen(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setMovieFormError(null);
    setMovieFormLoading(true);

    const genresArray = movieForm.genres
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    const payload = {
      title: movieForm.title.trim(),
      description: movieForm.description.trim(),
      duration: Number(movieForm.duration),
      genres: genresArray,
      language: movieForm.language.trim(),
      releaseDate: movieForm.releaseDate,
      rating: movieForm.rating,
      posterUrl: movieForm.posterUrl.trim(),
      isActive: Boolean(movieForm.isActive),
    };

    try {
      if (editingMovie) {
        await updateMovie(editingMovie._id, payload, authToken);
      } else {
        await createMovie(payload, authToken);
      }
      setMovieModalOpen(false);
      loadAdminMovies();
      loadMovies();
    } catch (err) {
      setMovieFormError(err.message || "Failed to save movie");
    } finally {
      setMovieFormLoading(false);
    }
  };

  const handleToggleMovieActive = async (movie) => {
    try {
      if (movie.isActive) {
        await deleteMovie(movie._id, authToken);
      } else {
        await updateMovie(movie._id, { isActive: true }, authToken);
      }
      loadAdminMovies();
      loadMovies();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Admin Theatre & Screen Actions
  // ---------------------------------------------------------------------------
  const handleOpenAddTheatre = () => {
    setEditingTheatre(null);
    setTheatreForm({ name: "", city: "", address: "", phone: "" });
    setTheatreFormError(null);
    setTheatreModalOpen(true);
  };

  const handleOpenEditTheatre = (theatre) => {
    setEditingTheatre(theatre);
    setTheatreForm({
      name: theatre.name,
      city: theatre.city,
      address: theatre.address,
      phone: theatre.phone || "",
    });
    setTheatreFormError(null);
    setTheatreModalOpen(true);
  };

  const handleSaveTheatre = async (e) => {
    e.preventDefault();
    setTheatreFormError(null);
    try {
      if (editingTheatre) {
        await updateTheatre(editingTheatre._id, theatreForm, authToken);
      } else {
        await createTheatre(theatreForm, authToken);
      }
      setTheatreModalOpen(false);
      loadAdminTheatres();
    } catch (err) {
      setTheatreFormError(err.message || "Failed to save theatre");
    }
  };

  const handleToggleTheatreActive = async (theatre) => {
    try {
      if (theatre.isActive) {
        await deleteTheatre(theatre._id, authToken);
      } else {
        await updateTheatre(theatre._id, { isActive: true }, authToken);
      }
      loadAdminTheatres();
    } catch (err) {
      alert("Failed to update theatre: " + err.message);
    }
  };

  const handleSelectTheatreForScreens = async (theatre) => {
    setSelectedTheatreForScreens(theatre);
    setScreensLoading(true);
    try {
      const res = await fetchScreensByTheatre(theatre._id);
      setTheatreScreens(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setScreensLoading(false);
    }
  };

  const handleOpenAddScreen = () => {
    const nextNumber = theatreScreens.length + 1;
    setScreenForm({
      screenNumber: nextNumber,
      name: `Screen ${nextNumber}`,
      screenType: "2D",
      seatingCapacity: 40,
    });
    setScreenFormError(null);
    setScreenModalOpen(true);
  };

  const handleSaveScreen = async (e) => {
    e.preventDefault();
    setScreenFormError(null);
    try {
      await createScreen(
        selectedTheatreForScreens._id,
        {
          screenNumber: Number(screenForm.screenNumber),
          name: screenForm.name.trim(),
          screenType: screenForm.screenType,
          seatingCapacity: Number(screenForm.seatingCapacity),
        },
        authToken
      );
      setScreenModalOpen(false);
      handleSelectTheatreForScreens(selectedTheatreForScreens);
    } catch (err) {
      setScreenFormError(err.message || "Failed to add screen");
    }
  };

  const handleDeleteScreen = async (screenId) => {
    if (!window.confirm("Delete this screen auditorium?")) return;
    try {
      await deleteScreen(screenId, authToken);
      handleSelectTheatreForScreens(selectedTheatreForScreens);
    } catch (err) {
      alert("Failed to delete screen: " + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Admin Showtime Actions
  // ---------------------------------------------------------------------------
  const handleOpenAddShow = () => {
    setShowForm({
      movieId: adminMovies[0]?._id || "",
      theatreId: adminTheatres[0]?._id || "",
      screenId: "",
      startTime: "",
      endTime: "",
      priceStandard: 12,
      pricePremium: 18,
      priceVip: 25,
    });
    setAvailableScreensForShow([]);
    setShowFormError(null);
    if (adminTheatres[0]?._id) {
      fetchScreensByTheatre(adminTheatres[0]._id).then((res) => {
        setAvailableScreensForShow(res.data || []);
        if (res.data?.[0]) {
          setShowForm((prev) => ({ ...prev, screenId: res.data[0]._id }));
        }
      });
    }
    setShowModalOpen(true);
  };

  const handleTheatreChangeForShow = async (theatreId) => {
    setShowForm((prev) => ({ ...prev, theatreId, screenId: "" }));
    try {
      const res = await fetchScreensByTheatre(theatreId);
      setAvailableScreensForShow(res.data || []);
      if (res.data?.[0]) {
        setShowForm((prev) => ({ ...prev, screenId: res.data[0]._id }));
      }
    } catch {}
  };

  const handleSaveShow = async (e) => {
    e.preventDefault();
    setShowFormError(null);
    setShowFormLoading(true);

    if (!showForm.screenId) {
      setShowFormError("Please select a screen auditorium");
      setShowFormLoading(false);
      return;
    }

    const payload = {
      movie: showForm.movieId,
      theatre: showForm.theatreId,
      screen: showForm.screenId,
      startTime: new Date(showForm.startTime).toISOString(),
      endTime: new Date(showForm.endTime).toISOString(),
      pricing: [
        { tier: "standard", price: Number(showForm.priceStandard) },
        { tier: "premium", price: Number(showForm.pricePremium) },
        { tier: "vip", price: Number(showForm.priceVip) },
      ],
    };

    try {
      await createShow(payload, authToken);
      setShowModalOpen(false);
      loadAdminShows();
    } catch (err) {
      setShowFormError(err.message || "Failed to schedule show");
    } finally {
      setShowFormLoading(false);
    }
  };

  const handleCancelShow = async (showId) => {
    if (!window.confirm("Cancel this scheduled screening?")) return;
    try {
      await cancelShow(showId, authToken);
      loadAdminShows();
    } catch (err) {
      alert("Failed to cancel show: " + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Storefront Showtime & Seat Selection Actions
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
      setDetailsError(err.message || "Could not retrieve showtimes.");
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

  const startSeatSelection = async (showId) => {
    closeDetails();
    setShowLoading(true);
    setShowError(null);
    setSelectedSeats([]);
    try {
      const res = await fetchShowById(showId);
      setActiveShow(res.data);
    } catch (err) {
      setShowError(err.message || "Could not load seat map.");
    } finally {
      setShowLoading(false);
    }
  };

  const closeSeatSelection = () => {
    setActiveShow(null);
    setSelectedSeats([]);
    setShowError(null);
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== "available") return;
    setSelectedSeats((prev) =>
      prev.includes(seat.seatNumber)
        ? prev.filter((s) => s !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    );
  };

  const selectedSeatObjects =
    activeShow?.seats?.filter((s) => selectedSeats.includes(s.seatNumber)) || [];
  const calculatedTotal = selectedSeatObjects.reduce((sum, s) => sum + (s.price || 0), 0);

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
        { showId: activeShow._id, seatNumbers: selectedSeats },
        authToken
      );
      setConfirmedBooking(res.data);
      setReviewModalOpen(false);
      const updatedShow = await fetchShowById(activeShow._id);
      setActiveShow(updatedShow.data);
      setSelectedSeats([]);
    } catch (err) {
      setBookingError(err.message || "Booking failed.");
      try {
        const refreshed = await fetchShowById(activeShow._id);
        setActiveShow(refreshed.data);
      } catch {}
    } finally {
      setBookingLoading(false);
    }
  };

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
    if (!window.confirm("Cancel this booking and release seats?")) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, authToken);
      const res = await fetchMyBookings(authToken);
      setMyBookings(res.data || []);
      if (activeShow) {
        const refShow = await fetchShowById(activeShow._id);
        setActiveShow(refShow.data);
      }
      if (portalView === "admin") {
        loadAdminBookings();
        loadAdminOverview();
      }
    } catch (err) {
      alert("Cancellation failed: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const groupSeatsByRow = (seats = []) => {
    const rowMap = {};
    for (const seat of seats) {
      const row = seat.seatNumber.charAt(0);
      if (!rowMap[row]) rowMap[row] = [];
      rowMap[row].push(seat);
    }
    for (const r in rowMap) {
      rowMap[r].sort(
        (a, b) =>
          parseInt(a.seatNumber.substring(1), 10) - parseInt(b.seatNumber.substring(1), 10)
      );
    }
    return rowMap;
  };

  return (
    <div className="app">
      {/* ------------------------------------------------------------------- */}
      {/* GLOBAL NAVBAR                                                       */}
      {/* ------------------------------------------------------------------- */}
      <nav className="navbar navbar-dark border-bottom border-secondary px-4 py-3 sticky-top bg-black">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button
              className="navbar-brand fw-bold fs-3 text-white text-decoration-none btn btn-link p-0"
              onClick={() => {
                setPortalView("storefront");
                closeSeatSelection();
              }}
            >
              IMOVIES<span className="accent">.</span>
            </button>

            {portalView === "storefront" && activeShow && (
              <button className="btn btn-outline-secondary btn-sm text-light" onClick={closeSeatSelection}>
                â† Back to Movies
              </button>
            )}

            {/* Portal Switcher Navigation */}
            <div className="btn-group btn-group-sm ms-2">
              <button
                className={`btn ${portalView === "storefront" ? "btn-danger" : "btn-outline-secondary text-secondary"}`}
                onClick={() => setPortalView("storefront")}
              >
                Cinema
              </button>
              <button
                className={`btn ${portalView === "admin" ? "btn-danger" : "btn-outline-secondary text-secondary"}`}
                onClick={() => setPortalView("admin")}
              >
                Admin Portal {currentUser?.role === "admin" && <span className="badge bg-white text-dark ms-1">â˜…</span>}
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {currentUser ? (
              <>
                {portalView === "storefront" && (
                  <button className="btn btn-outline-light btn-sm" onClick={openMyBookings}>
                    ðŸŽŸ My Bookings
                  </button>
                )}
                <span className="text-secondary small d-none d-md-inline ms-2">
                  <span className={`badge ${currentUser.role === "admin" ? "bg-danger" : "bg-secondary"} me-1`}>
                    {currentUser.role}
                  </span>
                  <strong className="text-white">{currentUser.name}</strong>
                </span>
                <button className="btn btn-sm btn-outline-secondary text-secondary ms-2" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn btn-outline-danger btn-sm fw-semibold" onClick={() => setAuthModalOpen(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* PORTAL VIEW: ADMIN MANAGEMENT                                       */}
      {/* ------------------------------------------------------------------- */}
      {portalView === "admin" ? (
        !authToken ? (
          /* Case 1: Unauthenticated -> Prompt Admin Login */
          <main className="container py-5 text-center flex-grow-1" style={{ maxWidth: "480px" }}>
            <div className="p-4 rounded-3 text-start" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="text-center mb-4">
                <span className="fs-1">ðŸ›¡ï¸</span>
                <h4 className="fw-bold text-white mt-2">Admin Portal Authentication</h4>
                <p className="text-secondary small">Sign in with administrative privileges to manage movies, venues, and schedules.</p>
              </div>

              {authError && <div className="alert alert-danger small py-2">{authError}</div>}

              <form onSubmit={handleAuthSubmit}>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Admin Email</label>
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
                <button type="submit" className="btn btn-danger w-100 fw-bold py-2">
                  Sign In to Console
                </button>
              </form>
            </div>
          </main>
        ) : currentUser?.role !== "admin" ? (
          /* Case 2: Authenticated as normal customer -> 403 Forbidden Access Denied */
          <main className="container py-5 text-center flex-grow-1" style={{ maxWidth: "560px" }}>
            <div className="p-5 rounded-3" style={{ background: "#1a1215", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="fs-1 text-danger">â›”</span>
              <h3 className="fw-bold text-white mt-3 mb-2">403 Forbidden â€” Access Denied</h3>
              <p className="text-secondary">
                You are currently signed in as <strong>{currentUser.email}</strong> with standard customer privileges (
                <code>role: 'user'</code>).
              </p>
              <div className="alert alert-warning small text-start my-3" style={{ background: "#251c14", borderColor: "#78350f", color: "#fef3c7" }}>
                â„¹ <em>Administrative clearance is required to view platform metrics, manage theatrical schedules, and access customer bookings.</em>
              </div>
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="btn btn-danger px-4" onClick={() => setPortalView("storefront")}>
                  Return to Cinema Storefront
                </button>
                <button className="btn btn-outline-secondary" onClick={handleLogout}>
                  Switch Account
                </button>
              </div>
            </div>
          </main>
        ) : (
          /* Case 3: Authenticated as Admin -> Render Management Console */
          <main className="container-fluid py-4 px-md-5 flex-grow-1">
            {/* Admin Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-4 border-bottom border-secondary">
              <div>
                <h3 className="fw-bold text-white mb-0">IMovies Administration Console</h3>
                <span className="text-secondary small">Real-time cinema scheduling, venue inventory, and booking records</span>
              </div>

              {/* Sub-navigation tabs */}
              <div className="d-flex gap-2 mt-3 mt-md-0 flex-wrap">
                <button
                  className={`admin-nav-btn ${adminTab === "overview" ? "active" : ""}`}
                  onClick={() => setAdminTab("overview")}
                >
                  ðŸ“Š Overview
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "movies" ? "active" : ""}`}
                  onClick={() => setAdminTab("movies")}
                >
                  ðŸŽ¬ Movies
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "theatres" ? "active" : ""}`}
                  onClick={() => setAdminTab("theatres")}
                >
                  ðŸ›ï¸ Theatres & Screens
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "shows" ? "active" : ""}`}
                  onClick={() => setAdminTab("shows")}
                >
                  ðŸ•’ Showtimes
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "bookings" ? "active" : ""}`}
                  onClick={() => setAdminTab("bookings")}
                >
                  ðŸŽŸï¸ Bookings
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW METRICS */}
            {adminTab === "overview" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-white mb-0">System Performance & Key Indicators</h5>
                  <button className="btn btn-outline-danger btn-sm" onClick={loadAdminOverview} disabled={overviewLoading}>
                    {overviewLoading ? "Refreshing..." : "â†» Refresh Metrics"}
                  </button>
                </div>

                {overviewLoading && !adminOverview ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status" />
                    <p className="text-secondary mt-2">Computing live database aggregations...</p>
                  </div>
                ) : (
                  <>
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="admin-metric-card">
                          <span className="text-secondary small text-uppercase">Movies Catalog</span>
                          <div className="admin-metric-value">{adminOverview?.metrics.movies.total ?? 0}</div>
                          <span className="text-success small">{adminOverview?.metrics.movies.active ?? 0} Active</span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="admin-metric-card">
                          <span className="text-secondary small text-uppercase">Theatres</span>
                          <div className="admin-metric-value">{adminOverview?.metrics.theatres.total ?? 0}</div>
                          <span className="text-success small">{adminOverview?.metrics.theatres.active ?? 0} Active</span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="admin-metric-card">
                          <span className="text-secondary small text-uppercase">Screens</span>
                          <div className="admin-metric-value">{adminOverview?.metrics.screens.total ?? 0}</div>
                          <span className="text-secondary small">Auditoriums</span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="admin-metric-card">
                          <span className="text-secondary small text-uppercase">Shows</span>
                          <div className="admin-metric-value">{adminOverview?.metrics.shows.total ?? 0}</div>
                          <span className="text-success small">{adminOverview?.metrics.shows.scheduled ?? 0} Scheduled</span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="admin-metric-card">
                          <span className="text-secondary small text-uppercase">Bookings</span>
                          <div className="admin-metric-value">{adminOverview?.metrics.bookings.total ?? 0}</div>
                          <span className="text-success small">{adminOverview?.metrics.bookings.confirmed ?? 0} Confirmed</span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="admin-metric-card">
                          <span className="text-secondary small text-uppercase">Revenue</span>
                          <div className="admin-metric-value accent">${adminOverview?.metrics.revenue ?? 0}</div>
                          <span className="text-secondary small">Simulation Total</span>
                        </div>
                      </div>
                    </div>

                    <h5 className="fw-bold text-white mb-3">Recent Customer Activity</h5>
                    <div className="table-responsive rounded-3" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Customer</th>
                            <th>Movie</th>
                            <th>Venue</th>
                            <th>Seats</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminOverview?.recentBookings?.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-4 text-secondary">
                                No customer bookings recorded yet.
                              </td>
                            </tr>
                          ) : (
                            adminOverview?.recentBookings?.map((b) => (
                              <tr key={b._id}>
                                <td className="fw-bold accent">{b.bookingReference}</td>
                                <td>
                                  <div>{b.user?.name || "Customer"}</div>
                                  <span className="text-secondary small">{b.user?.email}</span>
                                </td>
                                <td>{b.show?.movie?.title || "Movie"}</td>
                                <td>
                                  {b.show?.theatre?.name} ({b.show?.theatre?.city})
                                </td>
                                <td>
                                  {b.seats?.map((s) => (
                                    <span key={s.seatNumber} className="badge bg-danger me-1">
                                      {s.seatNumber}
                                    </span>
                                  ))}
                                </td>
                                <td className="fw-bold">${b.totalAmount}</td>
                                <td>
                                  <span className={`badge ${b.bookingStatus === "confirmed" ? "bg-success" : "bg-secondary"}`}>
                                    {b.bookingStatus}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: MOVIE MANAGEMENT */}
            {adminTab === "movies" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-white mb-0">Movie Catalog Management</h5>
                  <button className="btn btn-danger btn-sm fw-semibold" onClick={handleOpenAddMovie}>
                    + Add New Movie
                  </button>
                </div>

                {adminMoviesLoading ? (
                  <div className="text-center py-4 text-secondary">Loading movies...</div>
                ) : (
                  <div className="table-responsive rounded-3" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Movie</th>
                          <th>Duration</th>
                          <th>Genres</th>
                          <th>Language</th>
                          <th>Rating</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminMovies.map((m) => (
                          <tr key={m._id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {m.posterUrl ? (
                                  <img src={m.posterUrl} alt="" style={{ width: "32px", height: "44px", objectFit: "cover", borderRadius: "4px" }} />
                                ) : (
                                  <div style={{ width: "32px", height: "44px", background: "#232334", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>ðŸŽ¬</div>
                                )}
                                <div>
                                  <div className="fw-bold text-white">{m.title}</div>
                                  <div className="text-secondary small">{m.releaseDate ? new Date(m.releaseDate).toLocaleDateString() : ""}</div>
                                </div>
                              </div>
                            </td>
                            <td>{m.duration} mins</td>
                            <td>
                              {m.genres?.map((g) => (
                                <span key={g} className="genre-badge">
                                  {g}
                                </span>
                              ))}
                            </td>
                            <td>{m.language}</td>
                            <td>
                              <span className="badge bg-dark border border-secondary">{m.rating}</span>
                            </td>
                            <td>
                              <span className={`badge ${m.isActive ? "bg-success" : "bg-secondary"}`}>
                                {m.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button className="btn btn-outline-light btn-sm" onClick={() => handleOpenEditMovie(m)}>
                                  Edit
                                </button>
                                <button
                                  className={`btn btn-sm ${m.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                                  onClick={() => handleToggleMovieActive(m)}
                                >
                                  {m.isActive ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: THEATRES & SCREENS */}
            {adminTab === "theatres" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-white mb-0">Venues & Screen Management</h5>
                  <button className="btn btn-danger btn-sm fw-semibold" onClick={handleOpenAddTheatre}>
                    + Add New Theatre
                  </button>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-lg-7">
                    <div className="table-responsive rounded-3" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Theatre Name</th>
                            <th>City</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminTheatres.map((t) => (
                            <tr key={t._id} className={selectedTheatreForScreens?._id === t._id ? "bg-black" : ""}>
                              <td className="fw-bold text-white">{t.name}</td>
                              <td>{t.city}</td>
                              <td className="text-secondary small">{t.address}</td>
                              <td>
                                <span className={`badge ${t.isActive ? "bg-success" : "bg-secondary"}`}>
                                  {t.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleSelectTheatreForScreens(t)}
                                  >
                                    Screens
                                  </button>
                                  <button
                                    className="btn btn-outline-light btn-sm"
                                    onClick={() => handleOpenEditTheatre(t)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => handleToggleTheatreActive(t)}
                                  >
                                    {t.isActive ? "Deactivate" : "Activate"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Screens Panel */}
                  <div className="col-12 col-lg-5">
                    <div className="p-3 rounded-3" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {selectedTheatreForScreens ? (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                            <div>
                              <h6 className="fw-bold text-white mb-0">{selectedTheatreForScreens.name} Screens</h6>
                              <span className="text-secondary small">Venue auditoriums</span>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={handleOpenAddScreen}>
                              + Add Screen
                            </button>
                          </div>

                          {screensLoading ? (
                            <div className="text-center py-3 text-secondary">Loading screens...</div>
                          ) : theatreScreens.length === 0 ? (
                            <div className="text-center py-4 text-secondary small">
                              No screens created for this venue yet. Click "+ Add Screen".
                            </div>
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {theatreScreens.map((s) => (
                                <div
                                  key={s._id}
                                  className="d-flex justify-content-between align-items-center p-2 rounded-2"
                                  style={{ background: "#1c1c2b", border: "1px solid rgba(255,255,255,0.05)" }}
                                >
                                  <div>
                                    <strong className="text-white">{s.name}</strong>
                                    <span className="badge bg-secondary ms-2">{s.screenType}</span>
                                    <div className="text-secondary small">Capacity: {s.seatingCapacity} seats</div>
                                  </div>
                                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteScreen(s._id)}>
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-5 text-secondary small">
                          Select a theatre on the left to manage its screen auditoriums.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SHOWTIMES */}
            {adminTab === "shows" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-white mb-0">Showtime Scheduling</h5>
                  <button className="btn btn-danger btn-sm fw-semibold" onClick={handleOpenAddShow}>
                    + Schedule New Showtime
                  </button>
                </div>

                {showsLoading ? (
                  <div className="text-center py-4 text-secondary">Loading show schedules...</div>
                ) : (
                  <div className="table-responsive rounded-3" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Movie</th>
                          <th>Venue</th>
                          <th>Screen</th>
                          <th>Showtime</th>
                          <th>Available Seats</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminShows.map((s) => (
                          <tr key={s._id}>
                            <td className="fw-bold text-white">{s.movie?.title}</td>
                            <td>{s.theatre?.name} ({s.theatre?.city})</td>
                            <td>{s.screen?.name} ({s.screen?.screenType})</td>
                            <td>
                              <div>{new Date(s.startTime).toLocaleDateString()}</div>
                              <span className="text-secondary small">
                                {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                                {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-dark border border-secondary">
                                {s.seatsAvailableCount ?? s.seats?.filter((x) => x.status === "available").length ?? 0} left
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${s.status === "scheduled" ? "bg-success" : s.status === "cancelled" ? "bg-secondary" : "bg-dark"}`}>
                                {s.status}
                              </span>
                            </td>
                            <td>
                              {s.status === "scheduled" && (
                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelShow(s._id)}>
                                  Cancel Show
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PLATFORM BOOKINGS */}
            {adminTab === "bookings" && (
              <div>
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                  <h5 className="fw-bold text-white mb-0">Platform Reservations</h5>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm custom-input"
                      placeholder="Search booking ref..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                    />
                    <select
                      className="form-select form-select-sm custom-select"
                      value={bookingFilterStatus}
                      onChange={(e) => setBookingFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {adminBookingsLoading ? (
                  <div className="text-center py-4 text-secondary">Loading bookings...</div>
                ) : (
                  <div className="table-responsive rounded-3" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Customer</th>
                          <th>Movie & Venue</th>
                          <th>Show Date</th>
                          <th>Seats</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminBookings.map((b) => (
                          <tr key={b._id}>
                            <td className="fw-bold accent">{b.bookingReference}</td>
                            <td>
                              <div className="text-white">{b.user?.name}</div>
                              <span className="text-secondary small">{b.user?.email}</span>
                            </td>
                            <td>
                              <div className="text-white">{b.show?.movie?.title}</div>
                              <span className="text-secondary small">{b.show?.theatre?.name}</span>
                            </td>
                            <td>
                              {b.show?.startTime ? new Date(b.show.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "N/A"}
                            </td>
                            <td>
                              {b.seats?.map((s) => (
                                <span key={s.seatNumber} className="badge bg-danger me-1">
                                  {s.seatNumber}
                                </span>
                              ))}
                            </td>
                            <td className="fw-bold text-white">${b.totalAmount}</td>
                            <td>
                              <span className={`badge ${b.bookingStatus === "confirmed" ? "bg-success" : "bg-secondary"}`}>
                                {b.bookingStatus}
                              </span>
                            </td>
                            <td>
                              {b.bookingStatus === "confirmed" && (
                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelBooking(b._id)}>
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>
        )
      ) : (
        /* ------------------------------------------------------------------- */
        /* PORTAL VIEW: CINEMA STOREFRONT (DEFAULT)                            */
        /* ------------------------------------------------------------------- */
        activeShow ? (
          /* SEAT SELECTION VIEW */
          <main className="container py-4 flex-grow-1">
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
                <p className="text-secondary mt-2">Loading screen layout...</p>
              </div>
            )}

            {showError && <div className="alert alert-danger">{showError}</div>}

            {!showLoading && !showError && (
              <div className="p-4 rounded-3 text-center" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="screen-visual" />

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
                            title={`${seat.seatNumber} Â· ${seat.tier?.toUpperCase()} Â· $${seat.price}`}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                      <span className="row-label">{row}</span>
                    </div>
                  ))}
                </div>

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
          /* MOVIE CATALOG BROWSER */
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
              <div className="p-3 rounded-3 mb-4" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
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
                    <select className="form-select custom-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
        )
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT MOVIE (ADMIN)                                       */}
      {/* --------------------------------------------------------------------- */}
      {movieModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setMovieModalOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h4 className="fw-bold text-white mb-0">{editingMovie ? "Edit Movie" : "Add New Movie"}</h4>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setMovieModalOpen(false)}>
                âœ•
              </button>
            </div>

            {movieFormError && <div className="alert alert-danger small py-2">{movieFormError}</div>}

            <form onSubmit={handleSaveMovie}>
              <div className="row g-3">
                <div className="col-12 col-md-8">
                  <label className="form-label small text-secondary">Movie Title *</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={movieForm.title}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small text-secondary">Age Rating *</label>
                  <select
                    className="form-select custom-select"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                  >
                    {RATINGS.filter((r) => r !== "All").map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small text-secondary">Description *</label>
                  <textarea
                    className="form-control custom-input"
                    rows="3"
                    value={movieForm.description}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label small text-secondary">Duration (mins) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control custom-input"
                    value={movieForm.duration}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label small text-secondary">Language *</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={movieForm.language}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small text-secondary">Release Date *</label>
                  <input
                    type="date"
                    className="form-control custom-input"
                    value={movieForm.releaseDate}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small text-secondary">Genres (comma separated) *</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={movieForm.genres}
                    required
                    placeholder="Action, Sci-Fi, Thriller"
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small text-secondary">Poster Image URL (optional)</label>
                  <input
                    type="url"
                    className="form-control custom-input"
                    value={movieForm.posterUrl}
                    placeholder="https://..."
                    onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setMovieModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger px-4" disabled={movieFormLoading}>
                  {movieFormLoading ? "Saving..." : editingMovie ? "Update Movie" : "Create Movie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT THEATRE (ADMIN)                                     */}
      {/* --------------------------------------------------------------------- */}
      {theatreModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setTheatreModalOpen(false)}>
          <div className="modal-dialog-custom p-4" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h5 className="fw-bold text-white mb-0">{editingTheatre ? "Edit Theatre" : "Add Cinema Theatre"}</h5>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setTheatreModalOpen(false)}>
                âœ•
              </button>
            </div>

            {theatreFormError && <div className="alert alert-danger small py-2">{theatreFormError}</div>}

            <form onSubmit={handleSaveTheatre}>
              <div className="mb-3">
                <label className="form-label small text-secondary">Theatre Venue Name *</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  value={theatreForm.name}
                  required
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">City *</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  value={theatreForm.city}
                  required
                  onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">Address *</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  value={theatreForm.address}
                  required
                  onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="form-label small text-secondary">Phone Number</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  value={theatreForm.phone}
                  onChange={(e) => setTheatreForm({ ...theatreForm, phone: e.target.value })}
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setTheatreModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger px-4">
                  {editingTheatre ? "Save Changes" : "Create Theatre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD SCREEN AUDITORIUM (ADMIN)                                  */}
      {/* --------------------------------------------------------------------- */}
      {screenModalOpen && selectedTheatreForScreens && (
        <div className="modal-backdrop-custom" onClick={() => setScreenModalOpen(false)}>
          <div className="modal-dialog-custom p-4" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h5 className="fw-bold text-white mb-0">Add Screen to {selectedTheatreForScreens.name}</h5>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setScreenModalOpen(false)}>
                âœ•
              </button>
            </div>

            {screenFormError && <div className="alert alert-danger small py-2">{screenFormError}</div>}

            <form onSubmit={handleSaveScreen}>
              <div className="mb-3">
                <label className="form-label small text-secondary">Screen Number *</label>
                <input
                  type="number"
                  min="1"
                  className="form-control custom-input"
                  value={screenForm.screenNumber}
                  required
                  onChange={(e) =>
                    setScreenForm({
                      ...screenForm,
                      screenNumber: e.target.value,
                      name: `Screen ${e.target.value}`,
                    })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">Screen Name</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  value={screenForm.name}
                  required
                  onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">Format Type *</label>
                <select
                  className="form-select custom-select"
                  value={screenForm.screenType}
                  onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                >
                  {SCREEN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label small text-secondary">Seating Capacity *</label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  className="form-control custom-input"
                  value={screenForm.seatingCapacity}
                  required
                  onChange={(e) => setScreenForm({ ...screenForm, seatingCapacity: e.target.value })}
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setScreenModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger px-4">
                  Add Screen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: SCHEDULE SHOWTIME (ADMIN)                                      */}
      {/* --------------------------------------------------------------------- */}
      {showModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setShowModalOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h4 className="fw-bold text-white mb-0">Schedule New Showtime</h4>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setShowModalOpen(false)}>
                âœ•
              </button>
            </div>

            {showFormError && (
              <div className="alert alert-danger small py-2">
                <strong>Schedule Conflict / Error:</strong> {showFormError}
              </div>
            )}

            <form onSubmit={handleSaveShow}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">Select Movie *</label>
                  <select
                    className="form-select custom-select"
                    value={showForm.movieId}
                    required
                    onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  >
                    {adminMovies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title} ({m.duration} mins)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">Select Theatre Venue *</label>
                  <select
                    className="form-select custom-select"
                    value={showForm.theatreId}
                    required
                    onChange={(e) => handleTheatreChangeForShow(e.target.value)}
                  >
                    {adminTheatres.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small text-secondary">Select Screen Auditorium *</label>
                  <select
                    className="form-select custom-select"
                    value={showForm.screenId}
                    required
                    onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                  >
                    {availableScreensForShow.length === 0 ? (
                      <option value="">No screens available for this venue</option>
                    ) : (
                      availableScreensForShow.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} Â· {s.screenType} ({s.seatingCapacity} seats)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">Start Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control custom-input"
                    value={showForm.startTime}
                    required
                    onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">End Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control custom-input"
                    value={showForm.endTime}
                    required
                    onChange={(e) => setShowForm({ ...showForm, endTime: e.target.value })}
                  />
                </div>

                <div className="col-4">
                  <label className="form-label small text-secondary">Standard Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control custom-input"
                    value={showForm.priceStandard}
                    required
                    onChange={(e) => setShowForm({ ...showForm, priceStandard: e.target.value })}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small text-secondary">Premium Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control custom-input"
                    value={showForm.pricePremium}
                    required
                    onChange={(e) => setShowForm({ ...showForm, pricePremium: e.target.value })}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small text-secondary">VIP Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control custom-input"
                    value={showForm.priceVip}
                    required
                    onChange={(e) => setShowForm({ ...showForm, priceVip: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger px-4" disabled={showFormLoading}>
                  {showFormLoading ? "Verifying..." : "Schedule Showtime"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: MOVIE DETAILS (STOREFRONT)                                     */}
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
                  <p className="text-secondary small">No active screenings scheduled for this release.</p>
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
                              <span className="text-secondary small">{availableCount} seats left</span>
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

                            <button className="btn btn-sm btn-danger fw-semibold px-3" onClick={() => startSeatSelection(show._id)}>
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
      {/* MODAL: BOOKING REVIEW (STOREFRONT)                                    */}
      {/* --------------------------------------------------------------------- */}
      {reviewModalOpen && activeShow && (
        <div className="modal-backdrop-custom" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-start border-bottom border-secondary pb-3 mb-3">
              <div>
                <h4 className="fw-bold text-white mb-0">Review Booking Details</h4>
                <div className="text-secondary small">Confirm tickets before reserving</div>
              </div>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setReviewModalOpen(false)}>
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
                ðŸ“… {new Date(activeShow.startTime).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}
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

            <div className="p-3 rounded-2 small text-secondary mb-4" style={{ background: "#101018", border: "1px dashed rgba(255,255,255,0.15)" }}>
              ðŸ”’ <strong>Simulation Mode Notice:</strong> Tickets will be confirmed with <span className="badge bg-secondary">paymentStatus: unpaid</span>.
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={() => setReviewModalOpen(false)} disabled={bookingLoading}>
                Cancel
              </button>
              <button className="btn btn-danger px-4 fw-bold" onClick={handleConfirmBooking} disabled={bookingLoading}>
                {bookingLoading ? "Reserving Seats..." : "Confirm & Book Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: BOOKING CONFIRMATION                                           */}
      {/* --------------------------------------------------------------------- */}
      {confirmedBooking && (
        <div className="modal-backdrop-custom" onClick={() => setConfirmedBooking(null)}>
          <div className="modal-dialog-custom p-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 fs-1 text-success">âœ“</div>
            <h3 className="fw-bold text-white mb-1">Booking Confirmed!</h3>
            <p className="text-secondary small mb-3">Your tickets have been reserved successfully.</p>

            <div className="p-3 rounded-3 text-start mb-3" style={{ background: "#1c1c2b" }}>
              <div className="small text-secondary">Booking Reference:</div>
              <div className="fs-4 fw-bold accent mb-2">{confirmedBooking.bookingReference}</div>

              <div className="row g-2 small text-light">
                <div className="col-6">
                  <span className="text-secondary">Seats:</span> {confirmedBooking.seats?.map((s) => s.seatNumber).join(", ")}
                </div>
                <div className="col-6 text-end">
                  <span className="text-secondary">Total:</span> <strong>${confirmedBooking.totalAmount}</strong>
                </div>
                <div className="col-6">
                  <span className="text-secondary">Status:</span> <span className="badge bg-success">{confirmedBooking.bookingStatus}</span>
                </div>
                <div className="col-6 text-end">
                  <span className="text-secondary">Payment:</span> <span className="badge bg-warning text-dark">{confirmedBooking.paymentStatus}</span>
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
              <button className="btn btn-outline-secondary" onClick={() => setConfirmedBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: MY BOOKINGS (CUSTOMER)                                         */}
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
                        <span className="badge bg-dark border border-secondary text-light">{b.paymentStatus}</span>
                      </div>
                    </div>

                    <div className="small text-secondary mb-2">
                      {b.show?.theatre?.name} ({b.show?.theatre?.city}) Â· {b.show?.screen?.name || `Screen ${b.show?.screen?.screenNumber}`}
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
                        <span className="text-secondary ms-2">Total:</span> <strong className="accent">${b.totalAmount}</strong>
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
      {/* MODAL: QUICK AUTHENTICATION                                           */}
      {/* --------------------------------------------------------------------- */}
      {authModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-dialog-custom p-4" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-3">
              <h5 className="fw-bold text-white mb-0">{authMode === "login" ? "Sign In" : "Register Account"}</h5>
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
                {authMode === "login" ? "Sign In" : "Create Account"}
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
        <span className="text-secondary">v1.3.0</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);