import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import { io } from "socket.io-client";
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
  createSeatHold,
  releaseSeatHold,
  fetchSeatHold,
  fetchAdminOverview,
  fetchAdminBookings,
} from "./services/api.js";

const GENRES = ["All", "Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller"];
const RATINGS = ["All", "G", "PG", "PG-13", "R", "NC-17", "U", "UA", "A"];
const SCREEN_TYPES = ["2D", "3D", "IMAX", "4DX", "Dolby Cinema"];
const FORMAT_TABS = ["ALL FORMATS", "IMAX", "DOLBY CINEMA", "4DX"];

const FEATURED_MOVIES = [
  {
    title: "Chronos: Beyond Horizons",
    headlinePart1: "CHRONOS:",
    headlinePart2: "BEYOND HORIZONS",
    tag: "NOW SHOWING — IMAX 70MM EXCLUSIVE",
    rating: "PG-13",
    genreText: "Sci-Fi / Thriller",
    durationText: "2h 45m",
    scoreText: "★ 4.8 (12.4k ratings)",
    audioTag: "DOLBY ATMOS",
    visualTag: "IMAX LASER",
    synopsis:
      "When humanity's final interstellar relay falls silent, a renegade astro-engineer must journey directly into the event horizon to salvage an anomaly that rewrites the fabric of spacetime.",
    upNextTitle: "The Velvet Heist",
    upNextSub: "Starts in 25 mins — Screen 02",
    upNextFormat: "UP NEXT IN IMAX 70MM",
    accentColor: "#ff5500",
  },
  {
    title: "The Velvet Heist",
    headlinePart1: "THE VELVET",
    headlinePart2: "HEIST",
    tag: "NOW SHOWING — DOLBY VISION",
    rating: "R",
    genreText: "Crime / Noir / Thriller",
    durationText: "1h 58m",
    scoreText: "★ 4.7 (8.2k ratings)",
    audioTag: "DOLBY ATMOS",
    visualTag: "DOLBY CINEMA",
    synopsis:
      "In the rain-slicked neon labyrinths of Neo-Verona, an elite heist collective breaches an subterranean corporate citadel to recover encrypted neural memories.",
    upNextTitle: "Aetheria: Kingdom of Sky",
    upNextSub: "Starts in 45 mins — Screen 04",
    upNextFormat: "UP NEXT IN DOLBY CINEMA",
    accentColor: "#06b6d4",
  },
  {
    title: "Aetheria: Kingdom of Sky",
    headlinePart1: "AETHERIA:",
    headlinePart2: "KINGDOM OF SKY",
    tag: "NOW SHOWING — REALD 3D",
    rating: "PG",
    genreText: "Fantasy / Animation",
    durationText: "1h 48m",
    scoreText: "★ 4.9 (15.1k ratings)",
    audioTag: "SPATIAL AUDIO",
    visualTag: "REALD 3D",
    synopsis:
      "Above the cloud canopy, an intrepid young skimmer unearths a forgotten relic capable of re-anchoring the floating islands before the solar rift tears their sanctuary apart.",
    upNextTitle: "Shadow Protocol: Zero",
    upNextSub: "Starts in 1h 10m — Screen 01",
    upNextFormat: "UP NEXT IN 4DX",
    accentColor: "#a855f7",
  },
  {
    title: "Shadow Protocol: Zero",
    headlinePart1: "SHADOW PROTOCOL:",
    headlinePart2: "ZERO",
    tag: "NOW SHOWING — LIVE CRITICS CHOICE",
    rating: "R",
    genreText: "Action / Espionage",
    durationText: "2h 18m",
    scoreText: "★ 4.6 (9.8k ratings)",
    audioTag: "DTS:X IMMERSIVE",
    visualTag: "4DX MOTION",
    synopsis:
      "Framed for an orbital intelligence sabotage, an elite operative wages a relentless counter-insurgency across three continents to avert automated global cyberwarfare.",
    upNextTitle: "Chronos: Beyond Horizons",
    upNextSub: "Starts in 1h 35m — Screen 03",
    upNextFormat: "UP NEXT IN IMAX 70MM",
    accentColor: "#ff5500",
  },
];

// Helper Artwork Component for Procedural Posters
function ProceduralPoster({ title = "Cinema", genre = "Sci-Fi", format = "IMAX", index = 0 }) {
  const gradients = [
    "radial-gradient(circle at 50% 30%, #3b1d54 0%, #0d0e17 80%)",
    "radial-gradient(circle at 50% 30%, #152e3d 0%, #090e14 80%)",
    "radial-gradient(circle at 50% 30%, #442a17 0%, #120e0c 80%)",
    "radial-gradient(circle at 50% 30%, #1a2e26 0%, #08110e 80%)",
  ];
  const bg = gradients[index % gradients.length];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "16px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-20%",
          width: "140%",
          height: "140%",
          opacity: 0.15,
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          pointerEvents: "none",
        }}
      />
      <div className="d-flex justify-content-between align-items-center" style={{ zIndex: 1 }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "1px", color: "#ff5500" }}>
          {format}
        </span>
      </div>

      <div style={{ textAlign: "center", margin: "auto 0", zIndex: 1 }}>
        <div style={{ fontSize: "2rem", marginBottom: "8px", filter: "drop-shadow(0 0 12px rgba(255,85,0,0.4))" }}>
          {index % 4 === 0 ? "🌌" : index % 4 === 1 ? "🏙️" : index % 4 === 2 ? "✨" : "⚡"}
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
          {genre}
        </div>
      </div>

      <div style={{ zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
        <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          ORIGINAL EXPERIENCE
        </div>
      </div>
    </div>
  );
}

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

  // Stitch UI State
  const [selectedFormat, setSelectedFormat] = useState("ALL FORMATS");
  const [discoveryCinema, setDiscoveryCinema] = useState("");
  const [discoveryDate, setDiscoveryDate] = useState("Today, Oct 24 (Evening)");
  const [discoveryFormat, setDiscoveryFormat] = useState("All Formats");
  const [heroIndex, setHeroIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [cinemasModalOpen, setCinemasModalOpen] = useState(false);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);

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

  // Real-Time Socket & Hold State
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeHold, setActiveHold] = useState(null); // { holdToken, expiresAt, seats, remainingSeconds }
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdError, setHoldError] = useState(null);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // Real-Time Socket.IO Synchronization for Active Show
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeShow?._id) return;

    const socketUrl = window.location.origin.includes(":5173")
      ? "http://localhost:5000"
      : window.location.origin;

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join:show", activeShow._id);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("seats:held", ({ showId, seatNumbers, holdExpiresAt, userId }) => {
      if (showId !== activeShow._id) return;
      setActiveShow((prev) => {
        if (!prev) return prev;
        const currentId = currentUser?.id || currentUser?._id;
        const isMine = userId && currentId && String(userId) === String(currentId);
        const updated = (prev.seats || []).map((s) => {
          if (seatNumbers.includes(s.seatNumber)) {
            return {
              ...s,
              status: "reserved",
              holdExpiresAt,
              reservedBy: userId,
              isHeldByMe: isMine,
            };
          }
          return s;
        });
        return { ...prev, seats: updated };
      });
    });

    socket.on("seats:released", ({ showId, seatNumbers }) => {
      if (showId !== activeShow._id) return;
      setActiveShow((prev) => {
        if (!prev) return prev;
        const updated = (prev.seats || []).map((s) => {
          if (seatNumbers.includes(s.seatNumber)) {
            return {
              ...s,
              status: "available",
              holdExpiresAt: null,
              reservedBy: null,
              holdToken: null,
              isHeldByMe: false,
            };
          }
          return s;
        });
        return { ...prev, seats: updated };
      });
    });

    socket.on("seats:expired", ({ showId, seatNumbers }) => {
      if (showId !== activeShow._id) return;
      setActiveShow((prev) => {
        if (!prev) return prev;
        const updated = (prev.seats || []).map((s) => {
          if (seatNumbers.includes(s.seatNumber)) {
            return {
              ...s,
              status: "available",
              holdExpiresAt: null,
              reservedBy: null,
              holdToken: null,
              isHeldByMe: false,
            };
          }
          return s;
        });
        return { ...prev, seats: updated };
      });
    });

    socket.on("seats:booked", ({ showId, seatNumbers }) => {
      if (showId !== activeShow._id) return;
      setActiveShow((prev) => {
        if (!prev) return prev;
        const updated = (prev.seats || []).map((s) => {
          if (seatNumbers.includes(s.seatNumber)) {
            return {
              ...s,
              status: "booked",
              holdExpiresAt: null,
              isHeldByMe: false,
            };
          }
          return s;
        });
        return { ...prev, seats: updated };
      });
    });

    // Polling fallback every 8 seconds if socket disconnects
    const pollInterval = setInterval(async () => {
      if (!socket.connected) {
        try {
          const res = await fetchShowById(activeShow._id);
          setActiveShow(res.data);
        } catch {}
      }
    }, 8000);

    return () => {
      clearInterval(pollInterval);
      socket.emit("leave:show", activeShow._id);
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [activeShow?._id, currentUser?.id, currentUser?._id]);

  // ---------------------------------------------------------------------------
  // Hold Countdown Timer & Auto-Release
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeHold?.expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expires = new Date(activeHold.expiresAt).getTime();
      const diffSeconds = Math.max(0, Math.floor((expires - now) / 1000));

      setActiveHold((prev) => (prev ? { ...prev, remainingSeconds: diffSeconds } : null));

      if (diffSeconds <= 0) {
        clearInterval(interval);
        setActiveHold(null);
        setReviewModalOpen(false);
        setHoldError("Your 5-minute seat hold expired. Please reselect your seats.");
        if (activeShow?._id) {
          fetchShowById(activeShow._id).then((res) => setActiveShow(res.data)).catch(() => {});
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold?.expiresAt, activeShow?._id]);

  // ---------------------------------------------------------------------------
  // Load Storefront Movie Catalog
  // ---------------------------------------------------------------------------
  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { sortBy };
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

  // Load theatres for discovery dropdown
  useEffect(() => {
    fetchTheatres({ all: true })
      .then((res) => {
        setAdminTheatres(res.data || []);
        if (res.data?.length && !discoveryCinema) {
          setDiscoveryCinema(res.data[0].name);
        }
      })
      .catch(() => {});
  }, []);

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
      showToast(`Welcome back, ${user.name}!`);
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    setCurrentUser(null);
    localStorage.removeItem("imovies_token");
    localStorage.removeItem("imovies_user");
    setMyBookings([]);
    showToast("Signed out successfully.");
  };

  // ---------------------------------------------------------------------------
  // Admin Data Fetching
  // ---------------------------------------------------------------------------
  const loadAdminOverview = useCallback(async () => {
    if (!authToken) return;
    setOverviewLoading(true);
    try {
      const res = await fetchAdminOverview(authToken);
      setAdminOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOverviewLoading(false);
    }
  }, [authToken]);

  const loadAdminMovies = useCallback(async () => {
    if (!authToken) return;
    setAdminMoviesLoading(true);
    try {
      const res = await fetchMovies({ all: "true" });
      setAdminMovies(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminMoviesLoading(false);
    }
  }, [authToken]);

  const loadAdminTheatres = useCallback(async () => {
    if (!authToken) return;
    setTheatresLoading(true);
    try {
      const res = await fetchTheatres({ all: "true" });
      setAdminTheatres(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTheatresLoading(false);
    }
  }, [authToken]);

  const loadAdminShows = useCallback(async () => {
    if (!authToken) return;
    setShowsLoading(true);
    try {
      const res = await fetchShows({ includePast: "true" });
      setAdminShows(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setShowsLoading(false);
    }
  }, [authToken]);

  const loadAdminBookings = useCallback(async () => {
    if (!authToken) return;
    setAdminBookingsLoading(true);
    try {
      const params = {};
      if (bookingFilterStatus !== "all") params.status = bookingFilterStatus;
      if (bookingSearch.trim()) params.search = bookingSearch.trim();
      const res = await fetchAdminBookings(params, authToken);
      setAdminBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminBookingsLoading(false);
    }
  }, [authToken, bookingFilterStatus, bookingSearch]);

  useEffect(() => {
    if (portalView === "admin" && currentUser?.role === "admin") {
      if (adminTab === "overview") loadAdminOverview();
      if (adminTab === "movies") loadAdminMovies();
      if (adminTab === "theatres") loadAdminTheatres();
      if (adminTab === "shows") loadAdminShows();
      if (adminTab === "bookings") loadAdminBookings();
    }
  }, [
    portalView,
    currentUser?.role,
    adminTab,
    loadAdminOverview,
    loadAdminMovies,
    loadAdminTheatres,
    loadAdminShows,
    loadAdminBookings,
  ]);

  // Admin Movie CRUD
  const handleOpenAddMovie = () => {
    setEditingMovie(null);
    setMovieForm({
      title: "",
      description: "",
      duration: 120,
      genres: "Action, Sci-Fi",
      language: "English",
      releaseDate: new Date().toISOString().split("T")[0],
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
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || 120,
      genres: (movie.genres || []).join(", "),
      language: movie.language || "English",
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split("T")[0] : "",
      rating: movie.rating || "PG-13",
      posterUrl: movie.posterUrl || "",
      isActive: movie.isActive ?? true,
    });
    setMovieFormError(null);
    setMovieModalOpen(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setMovieFormLoading(true);
    setMovieFormError(null);
    try {
      const payload = {
        ...movieForm,
        duration: Number(movieForm.duration),
        genres: movieForm.genres.split(",").map((g) => g.trim()).filter(Boolean),
      };
      if (editingMovie) {
        await updateMovie(editingMovie._id, payload, authToken);
      } else {
        await createMovie(payload, authToken);
      }
      setMovieModalOpen(false);
      loadAdminMovies();
      loadMovies();
      showToast("Movie saved successfully.");
    } catch (err) {
      setMovieFormError(err.message || "Failed to save movie.");
    } finally {
      setMovieFormLoading(false);
    }
  };

  const handleToggleMovieActive = async (movie) => {
    try {
      await updateMovie(movie._id, { isActive: !movie.isActive }, authToken);
      loadAdminMovies();
      loadMovies();
    } catch (err) {
      alert("Failed to toggle movie state: " + err.message);
    }
  };

  // Admin Theatre CRUD
  const handleOpenAddTheatre = () => {
    setEditingTheatre(null);
    setTheatreForm({ name: "", city: "", address: "", phone: "" });
    setTheatreFormError(null);
    setTheatreModalOpen(true);
  };

  const handleOpenEditTheatre = (theatre) => {
    setEditingTheatre(theatre);
    setTheatreForm({
      name: theatre.name || "",
      city: theatre.city || "",
      address: theatre.address || "",
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
      showToast("Venue saved successfully.");
    } catch (err) {
      setTheatreFormError(err.message || "Failed to save theatre.");
    }
  };

  const handleToggleTheatreActive = async (theatre) => {
    try {
      await updateTheatre(theatre._id, { isActive: !theatre.isActive }, authToken);
      loadAdminTheatres();
    } catch (err) {
      alert("Failed to toggle theatre status: " + err.message);
    }
  };

  // Admin Screen Management
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
      name: `Auditorium ${nextNumber}`,
      screenType: "IMAX",
      seatingCapacity: 60,
    });
    setScreenFormError(null);
    setScreenModalOpen(true);
  };

  const handleSaveScreen = async (e) => {
    e.preventDefault();
    setScreenFormError(null);
    try {
      await createScreen(selectedTheatreForScreens._id, screenForm, authToken);
      setScreenModalOpen(false);
      handleSelectTheatreForScreens(selectedTheatreForScreens);
      showToast("Screen added to auditorium.");
    } catch (err) {
      setScreenFormError(err.message || "Failed to add screen.");
    }
  };

  const handleDeleteScreen = async (screenId) => {
    if (!window.confirm("Remove screen? Active shows on this screen may be impacted.")) return;
    try {
      await deleteScreen(screenId, authToken);
      handleSelectTheatreForScreens(selectedTheatreForScreens);
    } catch (err) {
      alert("Failed to remove screen: " + err.message);
    }
  };

  // Admin Showtimes Management
  const handleOpenAddShow = async () => {
    setShowForm({
      movieId: adminMovies[0]?._id || "",
      theatreId: adminTheatres[0]?._id || "",
      screenId: "",
      startTime: "",
      endTime: "",
      priceStandard: 14,
      pricePremium: 20,
      priceVip: 28,
    });
    setShowFormError(null);
    if (adminTheatres[0]?._id) {
      try {
        const res = await fetchScreensByTheatre(adminTheatres[0]._id);
        setAvailableScreensForShow(res.data || []);
        if (res.data?.length > 0) {
          setShowForm((prev) => ({ ...prev, screenId: res.data[0]._id }));
        }
      } catch {}
    }
    setShowModalOpen(true);
  };

  const handleShowTheatreChange = async (theatreId) => {
    setShowForm((prev) => ({ ...prev, theatreId, screenId: "" }));
    try {
      const res = await fetchScreensByTheatre(theatreId);
      setAvailableScreensForShow(res.data || []);
      if (res.data?.length > 0) {
        setShowForm((prev) => ({ ...prev, screenId: res.data[0]._id }));
      }
    } catch {}
  };

  const handleSaveShow = async (e) => {
    e.preventDefault();
    setShowFormLoading(true);
    setShowFormError(null);
    try {
      const payload = {
        movieId: showForm.movieId,
        theatreId: showForm.theatreId,
        screenId: showForm.screenId,
        startTime: new Date(showForm.startTime).toISOString(),
        endTime: showForm.endTime ? new Date(showForm.endTime).toISOString() : undefined,
        pricing: [
          { tier: "standard", price: Number(showForm.priceStandard) },
          { tier: "premium", price: Number(showForm.pricePremium) },
          { tier: "vip", price: Number(showForm.priceVip) },
        ],
      };
      await createShow(payload, authToken);
      setShowModalOpen(false);
      loadAdminShows();
      showToast("Screening scheduled successfully.");
    } catch (err) {
      setShowFormError(err.message || "Failed to schedule screening.");
    } finally {
      setShowFormLoading(false);
    }
  };

  const handleCancelShow = async (showId) => {
    if (!window.confirm("Cancel this scheduled screening?")) return;
    try {
      await cancelShow(showId, authToken);
      loadAdminShows();
      showToast("Screening cancelled.");
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
    setHoldError(null);
    setSelectedSeats([]);
    setActiveHold(null);
    try {
      const res = await fetchShowById(showId);
      setActiveShow(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setShowError(err.message || "Could not load seat map.");
    } finally {
      setShowLoading(false);
    }
  };

  const closeSeatSelection = async () => {
    if (activeHold?.holdToken && activeShow?._id && authToken) {
      try {
        await releaseSeatHold(activeShow._id, activeHold.holdToken, authToken);
      } catch {}
    }
    setActiveShow(null);
    setActiveHold(null);
    setSelectedSeats([]);
    setShowError(null);
    setHoldError(null);
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

  const handleProceedToReview = async () => {
    if (selectedSeats.length === 0) return;
    if (!authToken) {
      setAuthModalOpen(true);
      return;
    }
    setHoldLoading(true);
    setHoldError(null);
    try {
      const res = await createSeatHold(activeShow._id, selectedSeats, authToken);
      setActiveHold(res.data);
      setReviewModalOpen(true);
    } catch (err) {
      setHoldError(err.message || "Failed to place seat hold. Seats may have been reserved by another customer.");
      try {
        const refreshed = await fetchShowById(activeShow._id);
        setActiveShow(refreshed.data);
      } catch {}
    } finally {
      setHoldLoading(false);
    }
  };

  const handleReleaseHold = async () => {
    if (!activeHold?.holdToken || !activeShow?._id || !authToken) {
      setActiveHold(null);
      setReviewModalOpen(false);
      return;
    }
    try {
      await releaseSeatHold(activeShow._id, activeHold.holdToken, authToken);
    } catch {}
    setActiveHold(null);
    setReviewModalOpen(false);
    setSelectedSeats([]);
    try {
      const refreshed = await fetchShowById(activeShow._id);
      setActiveShow(refreshed.data);
    } catch {}
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
          holdToken: activeHold?.holdToken,
        },
        authToken
      );
      setConfirmedBooking(res.data);
      setActiveHold(null);
      setReviewModalOpen(false);
      const updatedShow = await fetchShowById(activeShow._id);
      setActiveShow(updatedShow.data);
      setSelectedSeats([]);
      showToast("Booking confirmed! Tickets issued.");
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
      showToast("Booking cancelled successfully.");
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

  const handleHeroBookAction = (feat) => {
    const matched =
      movies.find((m) =>
        m.title.toLowerCase().includes(feat.title.toLowerCase()) ||
        feat.title.toLowerCase().includes(m.title.toLowerCase())
      ) || movies[0];

    if (matched) {
      openMovieDetails(matched);
    } else {
      const el = document.getElementById("now-showing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFindShowtimesClick = () => {
    if (discoveryFormat && discoveryFormat !== "All Formats") {
      setSelectedFormat(discoveryFormat.includes("IMAX") ? "IMAX" : discoveryFormat.includes("Dolby") ? "DOLBY CINEMA" : "4DX");
    }
    const el = document.getElementById("now-showing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Filtered movies according to Stitch tabs
  const filteredMovies = movies.filter((movie) => {
    if (selectedFormat === "IMAX") {
      return (
        movie.title?.toLowerCase().includes("imax") ||
        movie.genres?.some((g) => g.toLowerCase().includes("sci") || g.toLowerCase().includes("action"))
      );
    }
    if (selectedFormat === "DOLBY CINEMA") {
      return (
        movie.title?.toLowerCase().includes("dolby") ||
        movie.genres?.some((g) => g.toLowerCase().includes("drama") || g.toLowerCase().includes("crime") || g.toLowerCase().includes("mystery"))
      );
    }
    if (selectedFormat === "4DX") {
      return (
        movie.genres?.some((g) => g.toLowerCase().includes("adventure") || g.toLowerCase().includes("action") || g.toLowerCase().includes("thriller"))
      );
    }
    return true;
  });

  const currentHero = FEATURED_MOVIES[heroIndex] || FEATURED_MOVIES[0];

  return (
    <div className="app">
      {/* ------------------------------------------------------------------- */}
      {/* GLOBAL NAVBAR (STITCH DESIGN)                                       */}
      {/* ------------------------------------------------------------------- */}
      <header className="stitch-navbar px-3 px-md-5 py-3">
        <div className="container-fluid d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Brand & Main Nav Links */}
          <div className="d-flex align-items-center gap-3">
            <button
              className="navbar-brand btn btn-link p-0"
              onClick={() => {
                setPortalView("storefront");
                closeSeatSelection();
              }}
            >
              <svg className="brand-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
              </svg>
              <span>IMOVIES</span>
            </button>

            {portalView === "storefront" && activeShow && (
              <button className="stitch-btn-pill stitch-btn-pill-ghost btn-sm" onClick={closeSeatSelection}>
                ← Back to Catalog
              </button>
            )}

            {/* Nav Links */}
            <div className="d-none d-lg-flex align-items-center gap-2 ms-2">
              <button
                className={`stitch-nav-link ${portalView === "storefront" && !activeShow ? "active" : ""}`}
                onClick={() => {
                  setPortalView("storefront");
                  closeSeatSelection();
                }}
              >
                Home
              </button>
              <button
                className="stitch-nav-link"
                onClick={() => {
                  setPortalView("storefront");
                  closeSeatSelection();
                  setTimeout(() => {
                    const el = document.getElementById("now-showing");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Movies Catalog
              </button>
              <button
                className="stitch-nav-link"
                onClick={() => setCinemasModalOpen(true)}
              >
                Cinemas
              </button>
              <button
                className={`stitch-nav-link ${portalView === "admin" ? "active" : ""}`}
                onClick={() => setPortalView(portalView === "admin" ? "storefront" : "admin")}
              >
                Admin Dashboard {currentUser?.role === "admin" && <span className="text-warning">★</span>}
              </button>
            </div>
          </div>

          {/* Right Controls: Search Pill, My Bookings, User Auth */}
          <div className="d-flex align-items-center gap-3">
            {portalView === "storefront" && !activeShow && (
              <div className="stitch-search-pill d-none d-md-flex">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search movies by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {currentUser ? (
              <div className="d-flex align-items-center gap-2">
                {portalView === "storefront" && (
                  <button className="stitch-btn-pill stitch-btn-pill-ghost btn-sm" onClick={openMyBookings}>
                    🎟️ My Bookings
                  </button>
                )}

                <div className="d-flex align-items-center gap-2 ms-1">
                  <span className="stitch-role-badge">
                    {currentUser.role === "admin" ? "ADMINISTRATOR" : "CIVILIAN USER"}
                  </span>
                  <span className="d-none d-sm-inline fw-bold text-white small">
                    {currentUser.name}
                  </span>
                  <button className="stitch-btn-pill stitch-btn-pill-ghost btn-sm" onClick={handleLogout} title="Sign Out">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button className="stitch-btn-pill stitch-btn-pill-orange btn-sm" onClick={() => setAuthModalOpen(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1080,
            background: "#161b2a",
            border: "1px solid var(--stitch-orange)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          <span style={{ color: "var(--stitch-orange)" }}>✓</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: "none", border: "none", color: "#94a3b8", marginLeft: "10px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PORTAL VIEW: ADMIN MANAGEMENT CONSOLE                               */}
      {/* ------------------------------------------------------------------- */}
      {portalView === "admin" ? (
        !authToken ? (
          /* Case 1: Unauthenticated -> Prompt Admin Login */
          <main className="container py-5 text-center flex-grow-1" style={{ maxWidth: "480px" }}>
            <div className="p-4 rounded-4 text-start" style={{ background: "#111420", border: "1px solid var(--stitch-border-light)" }}>
              <div className="text-center mb-4">
                <span className="fs-1">🛡️</span>
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
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange w-100 justify-content-center py-2">
                  Sign In to Console
                </button>
              </form>
            </div>
          </main>
        ) : currentUser?.role !== "admin" ? (
          /* Case 2: Authenticated as normal customer -> 403 Forbidden Access Denied */
          <main className="container py-5 text-center flex-grow-1" style={{ maxWidth: "560px" }}>
            <div className="p-5 rounded-4" style={{ background: "#171216", border: "1px solid rgba(255,85,0,0.3)" }}>
              <span className="fs-1 text-danger">⛔</span>
              <h3 className="fw-bold text-white mt-3 mb-2">403 Forbidden — Access Denied</h3>
              <p className="text-secondary">
                You are currently signed in as <strong>{currentUser.email}</strong> with standard customer privileges (
                <code>role: 'user'</code>).
              </p>
              <div className="alert alert-warning small text-start my-3" style={{ background: "#251c14", borderColor: "#78350f", color: "#fef3c7" }}>
                ℹ <em>Administrative clearance is required to view platform metrics, manage theatrical schedules, and access customer bookings.</em>
              </div>
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="stitch-btn-pill stitch-btn-pill-orange px-4" onClick={() => setPortalView("storefront")}>
                  Return to Cinema Storefront
                </button>
                <button className="stitch-btn-pill stitch-btn-pill-ghost" onClick={handleLogout}>
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
                  📊 Overview
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "movies" ? "active" : ""}`}
                  onClick={() => setAdminTab("movies")}
                >
                  🎬 Movies
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "theatres" ? "active" : ""}`}
                  onClick={() => setAdminTab("theatres")}
                >
                  🏛️ Theatres & Screens
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "shows" ? "active" : ""}`}
                  onClick={() => setAdminTab("shows")}
                >
                  🕒 Showtimes
                </button>
                <button
                  className={`admin-nav-btn ${adminTab === "bookings" ? "active" : ""}`}
                  onClick={() => setAdminTab("bookings")}
                >
                  🎟️ Bookings
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW METRICS */}
            {adminTab === "overview" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-white mb-0">System Performance & Key Indicators</h5>
                  <button className="btn btn-outline-danger btn-sm" onClick={loadAdminOverview} disabled={overviewLoading}>
                    {overviewLoading ? "Refreshing..." : "↻ Refresh Metrics"}
                  </button>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="admin-metric-card">
                      <span className="text-secondary small fw-bold">TOTAL MOVIES</span>
                      <div className="admin-metric-value">{adminOverview?.counts?.movies ?? "—"}</div>
                      <span className="text-success small">Theatrical Releases</span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="admin-metric-card">
                      <span className="text-secondary small fw-bold">ACTIVE THEATRES</span>
                      <div className="admin-metric-value">{adminOverview?.counts?.theatres ?? "—"}</div>
                      <span className="text-info small">{adminOverview?.counts?.screens ?? 0} Screens Configured</span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="admin-metric-card">
                      <span className="text-secondary small fw-bold">SCHEDULED SHOWS</span>
                      <div className="admin-metric-value">{adminOverview?.counts?.upcomingShows ?? "—"}</div>
                      <span className="text-warning small">Upcoming Sessions</span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="admin-metric-card">
                      <span className="text-secondary small fw-bold">TOTAL REVENUE (SIM)</span>
                      <div className="admin-metric-value text-success">
                        ${adminOverview?.revenue?.totalRevenue ?? 0}
                      </div>
                      <span className="text-secondary small">{adminOverview?.counts?.confirmedBookings ?? 0} Confirmed Tickets</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MOVIE MANAGEMENT */}
            {adminTab === "movies" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-white mb-0">Movie Catalog Management</h5>
                  <button className="stitch-btn-pill stitch-btn-pill-orange btn-sm fw-semibold" onClick={handleOpenAddMovie}>
                    + Add New Movie
                  </button>
                </div>

                {adminMoviesLoading ? (
                  <div className="text-center py-4 text-secondary">Loading movies...</div>
                ) : (
                  <div className="table-responsive rounded-3" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
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
                                  <div style={{ width: "32px", height: "44px", background: "#232334", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>🎬</div>
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
                  <button className="stitch-btn-pill stitch-btn-pill-orange btn-sm fw-semibold" onClick={handleOpenAddTheatre}>
                    + Add New Theatre
                  </button>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-lg-7">
                    <div className="table-responsive rounded-3" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
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
                    <div className="p-3 rounded-3" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
                      {selectedTheatreForScreens ? (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                            <div>
                              <h6 className="fw-bold text-white mb-0">{selectedTheatreForScreens.name} Screens</h6>
                              <span className="text-secondary small">Venue auditoriums</span>
                            </div>
                            <button className="stitch-btn-pill stitch-btn-pill-orange btn-sm" onClick={handleOpenAddScreen}>
                              + Add Screen
                            </button>
                          </div>

                          {screensLoading ? (
                            <div className="text-center py-3 text-secondary">Loading auditoriums...</div>
                          ) : theatreScreens.length === 0 ? (
                            <p className="text-secondary small">No screens configured for this venue yet.</p>
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {theatreScreens.map((s) => (
                                <div
                                  key={s._id}
                                  className="d-flex justify-content-between align-items-center p-2 rounded"
                                  style={{ background: "#181c2b" }}
                                >
                                  <div>
                                    <strong className="text-white">{s.name}</strong>
                                    <span className="badge bg-danger ms-2">{s.screenType}</span>
                                    <div className="text-secondary small">{s.seatingCapacity} seats capacity</div>
                                  </div>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteScreen(s._id)}>
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4 text-secondary">
                          <p>Select a theatre on the left to inspect and configure auditoriums.</p>
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
                  <h5 className="fw-bold text-white mb-0">Theatrical Screening Schedules</h5>
                  <button className="stitch-btn-pill stitch-btn-pill-orange btn-sm fw-semibold" onClick={handleOpenAddShow}>
                    + Schedule Showtime
                  </button>
                </div>

                {showsLoading ? (
                  <div className="text-center py-4 text-secondary">Loading show schedules...</div>
                ) : (
                  <div className="table-responsive rounded-3" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Movie</th>
                          <th>Theatre & Screen</th>
                          <th>Screening Time</th>
                          <th>Pricing Tiers</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminShows.map((s) => (
                          <tr key={s._id}>
                            <td className="fw-bold text-white">{s.movie?.title}</td>
                            <td>
                              <div>{s.theatre?.name}</div>
                              <span className="text-secondary small">{s.screen?.name} ({s.screen?.screenType})</span>
                            </td>
                            <td>
                              <div>{new Date(s.startTime).toLocaleDateString()}</div>
                              <span className="text-secondary small">
                                {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                            <td>
                              {s.pricing?.map((p) => (
                                <span key={p.tier} className="badge bg-dark border border-secondary me-1">
                                  {p.tier}: ${p.price}
                                </span>
                              ))}
                            </td>
                            <td>
                              <span className={`badge ${s.status === "scheduled" ? "bg-success" : "bg-danger"}`}>
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

            {/* TAB 5: BOOKINGS */}
            {adminTab === "bookings" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h5 className="fw-bold text-white mb-0">Customer Reservation Records</h5>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      placeholder="Search ref or customer..."
                      className="form-control form-control-sm custom-input"
                      style={{ width: "200px" }}
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
                  <div className="table-responsive rounded-3" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
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
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="card-format-badge position-static">{activeShow.screen?.screenType || "IMAX Laser"}</span>
                  <span className={`realtime-badge ${socketConnected ? "realtime-badge-connected" : "realtime-badge-polling"}`}>
                    {socketConnected ? "● Live Availability" : "○ Polling Mode"}
                  </span>
                </div>
                <h3 className="fw-bold text-white mb-0">{activeShow.movie?.title}</h3>
                <p className="text-secondary small mb-0 mt-1">
                  {activeShow.theatre?.name} ({activeShow.theatre?.city}) ·{" "}
                  {activeShow.screen?.name || `Screen ${activeShow.screen?.screenNumber}`} ·{" "}
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
                <p className="text-secondary mt-2">Loading auditorium seating layout...</p>
              </div>
            )}

            {showError && <div className="alert alert-danger">{showError}</div>}

            {holdError && (
              <div className="alert alert-warning alert-dismissible fade show d-flex justify-content-between align-items-center mb-3">
                <span>⚠️ {holdError}</span>
                <button type="button" className="btn-close btn-close-white" onClick={() => setHoldError(null)} />
              </div>
            )}

            {activeHold && (
              <div className="hold-countdown-banner mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark px-3 py-2 fs-6 fw-bold">
                    ⏱ {Math.floor((activeHold.remainingSeconds || 0) / 60)}:
                    {String((activeHold.remainingSeconds || 0) % 60).padStart(2, "0")}
                  </span>
                  <span className="text-warning fw-semibold">
                    Seats {selectedSeats.join(", ")} reserved exclusively in your session!
                  </span>
                </div>
                <button className="stitch-btn-pill stitch-btn-pill-ghost btn-sm" onClick={handleReleaseHold}>
                  Release Hold
                </button>
              </div>
            )}

            {!showLoading && !showError && (
              <div className="p-4 rounded-4 text-center" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
                <div className="screen-visual" />

                <div className="seat-grid">
                  {Object.entries(groupSeatsByRow(activeShow.seats || [])).map(([row, seats]) => (
                    <div key={row} className="seat-row">
                      <span className="row-label">{row}</span>
                      {seats.map((seat) => {
                        const isSelected = selectedSeats.includes(seat.seatNumber);
                        const isHeldByMe = (activeHold && selectedSeats.includes(seat.seatNumber)) || seat.isHeldByMe;
                        const isHeldByOther = seat.status === "reserved" && !isHeldByMe;
                        const isBooked = seat.status === "booked";

                        let statusClass = "seat-standard";
                        if (seat.tier === "premium") statusClass = "seat-premium";
                        if (seat.tier === "vip") statusClass = "seat-vip";
                        if (isSelected) statusClass = "seat-selected";
                        if (isHeldByMe) statusClass = "seat-held-by-me";
                        if (isHeldByOther) statusClass = "seat-held-by-other";
                        if (isBooked) statusClass = "seat-booked";

                        const seatTitle = isBooked
                          ? `${seat.seatNumber} - Booked`
                          : isHeldByMe
                          ? `${seat.seatNumber} - Held by You (Active Hold)`
                          : isHeldByOther
                          ? `${seat.seatNumber} - Temporarily Held by Another Customer`
                          : `${seat.seatNumber} (${seat.tier?.toUpperCase()}) - $${seat.price}`;

                        return (
                          <button
                            key={seat.seatNumber}
                            type="button"
                            className={`seat-btn ${statusClass}`}
                            disabled={isBooked || isHeldByOther || (Boolean(activeHold) && !isHeldByMe)}
                            onClick={() => handleSeatClick(seat)}
                            title={seatTitle}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap small text-secondary border-top border-secondary pt-3 mt-4">
                  <div>
                    <span className="legend-dot" style={{ background: "#181c2b", border: "1px solid rgba(255,255,255,0.2)" }} />
                    Standard
                  </div>
                  <div>
                    <span className="legend-dot" style={{ background: "#251b3d", border: "1px solid #8b5cf6" }} />
                    Premium
                  </div>
                  <div>
                    <span className="legend-dot" style={{ background: "#36220e", border: "1px solid #f59e0b" }} />
                    VIP Recliner
                  </div>
                  <div>
                    <span className="legend-dot" style={{ background: "var(--stitch-orange)" }} />
                    Selected
                  </div>
                  <div>
                    <span className="legend-dot" style={{ background: "#7c2d12" }} />
                    Held by You
                  </div>
                  <div>
                    <span className="legend-dot" style={{ background: "#2d1e10", border: "1px solid #b45309" }} />
                    Held by Other
                  </div>
                  <div>
                    <span className="legend-dot" style={{ background: "#11141c" }} />
                    Booked
                  </div>
                </div>

                {/* Bottom Checkout Action Tray */}
                <div className="mt-4 pt-3 border-top border-secondary d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="text-start">
                    <span className="text-secondary small d-block">Selected Seats:</span>
                    <strong className="text-white">
                      {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                    </strong>
                    {selectedSeats.length > 0 && (
                      <span className="text-secondary ms-2 small">
                        ({selectedSeats.length} seats · Total: <strong className="accent">${calculatedTotal}</strong>)
                      </span>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button className="stitch-btn-pill stitch-btn-pill-ghost" onClick={closeSeatSelection}>
                      Cancel
                    </button>
                    <button
                      className="stitch-btn-pill stitch-btn-pill-orange"
                      disabled={selectedSeats.length === 0 || holdLoading}
                      onClick={handleProceedToReview}
                    >
                      {holdLoading
                        ? "Locking Seats..."
                        : activeHold
                        ? `Proceed to Review (${selectedSeats.length})`
                        : `Hold Seats & Review (${selectedSeats.length})`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        ) : (
          /* ----------------------------------------------------------------- */
          /* STITCH DESIGN: MOVIE DISCOVERY SHOWCASE                           */
          /* ----------------------------------------------------------------- */
          <>
            {/* HERO SHOWCASE SECTION */}
            <section className="stitch-hero">
              <div className="stitch-hero-bg" />
              <div className="stitch-hero-stars" />

              {/* Spacecraft Silhouette Graphic */}
              <div className="stitch-hero-spacecraft">
                <svg viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M120 200 L240 140 L440 170 L520 200 L440 230 L240 260 Z"
                    fill="#181e2e"
                    stroke="rgba(255, 85, 0, 0.4)"
                    strokeWidth="2"
                  />
                  <polygon points="260,170 380,185 380,215 260,230" fill="#0d111d" stroke="rgba(255,255,255,0.1)" />
                  <circle cx="480" cy="200" r="14" fill="#ff5500" opacity="0.8" filter="blur(4px)" />
                  <path d="M220 190 L160 200 L220 210" stroke="#ffaa00" strokeWidth="3" />
                  <line x1="300" y1="165" x2="320" y2="140" stroke="rgba(255,85,0,0.5)" strokeWidth="2" />
                  <line x1="300" y1="235" x2="320" y2="260" stroke="rgba(255,85,0,0.5)" strokeWidth="2" />
                </svg>
              </div>

              <div className="container stitch-hero-content">
                <div className="row">
                  <div className="col-12 col-lg-8">
                    {/* Eyebrow badge */}
                    <div className="hero-eyebrow">
                      <span className="dot" />
                      <span>{currentHero.tag}</span>
                    </div>

                    {/* Headline */}
                    <h1 className="hero-title">
                      {currentHero.headlinePart1}
                      <span className="title-accent">{currentHero.headlinePart2}</span>
                    </h1>

                    {/* Meta row */}
                    <div className="hero-meta-row">
                      <span className="hero-tag">{currentHero.rating}</span>
                      <span className="hero-tag">{currentHero.genreText}</span>
                      <span className="hero-tag">{currentHero.durationText}</span>
                      <span className="hero-rating-tag">{currentHero.scoreText}</span>
                      <span className="hero-tag" style={{ borderColor: "rgba(255,85,0,0.4)", color: "#ff8833" }}>
                        {currentHero.audioTag}
                      </span>
                      <span className="hero-tag" style={{ borderColor: "rgba(6,182,212,0.4)", color: "#67e8f9" }}>
                        {currentHero.visualTag}
                      </span>
                    </div>

                    {/* Synopsis */}
                    <p className="hero-synopsis">{currentHero.synopsis}</p>

                    {/* CTAs */}
                    <div className="hero-cta-group">
                      <button
                        className="btn-hero-primary"
                        onClick={() => handleHeroBookAction(currentHero)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a3 3 0 0 1 0 6v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a3 3 0 0 1 0-6zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54z" />
                        </svg>
                        <span>BOOK TICKETS →</span>
                      </button>

                      <button
                        className="btn-hero-secondary"
                        onClick={() => {
                          const matched = movies[0];
                          if (matched) openMovieDetails(matched);
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                        <span>View Details & Trailer</span>
                      </button>
                    </div>

                    {/* Carousel Dots */}
                    <div className="stitch-hero-dots">
                      {FEATURED_MOVIES.map((_, idx) => (
                        <button
                          key={idx}
                          className={`stitch-hero-dot ${idx === heroIndex ? "active" : ""}`}
                          onClick={() => setHeroIndex(idx)}
                          aria-label={`Showcase slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating "Up Next" mini-card */}
                <div
                  className="stitch-up-next-card"
                  onClick={() => setHeroIndex((prev) => (prev + 1) % FEATURED_MOVIES.length)}
                  title="Click to view next upcoming presentation"
                >
                  <div className="stitch-up-next-thumb d-flex align-items-center justify-content-center">
                    <span style={{ fontSize: "1.4rem" }}>🎬</span>
                  </div>
                  <div>
                    <div className="stitch-up-next-tag">{currentHero.upNextFormat}</div>
                    <div className="stitch-up-next-title">{currentHero.upNextTitle}</div>
                    <div className="stitch-up-next-sub">{currentHero.upNextSub}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK DISCOVERY / SHOWTIME FINDER FLOATING BAR */}
            <div className="container">
              <div className="stitch-discovery-bar">
                <div className="row g-2 align-items-center">
                  {/* Select Cinema */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="discovery-field-group">
                      <svg className="discovery-field-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <div className="discovery-field-content">
                        <span className="discovery-field-label">SELECT CINEMA / LOCATION</span>
                        <select
                          className="discovery-field-select"
                          value={discoveryCinema}
                          onChange={(e) => setDiscoveryCinema(e.target.value)}
                        >
                          {adminTheatres.length > 0 ? (
                            adminTheatres.map((t) => (
                              <option key={t._id} value={t.name}>
                                {t.name} ({t.city})
                              </option>
                            ))
                          ) : (
                            <option value="Neo Metropolitan — Grand IMAX">
                              Neo Metropolitan — Grand IMAX
                            </option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Show Date */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="discovery-field-group">
                      <svg className="discovery-field-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                      <div className="discovery-field-content">
                        <span className="discovery-field-label">SHOW DATE</span>
                        <select
                          className="discovery-field-select"
                          value={discoveryDate}
                          onChange={(e) => setDiscoveryDate(e.target.value)}
                        >
                          <option value="Today, Oct 24 (Evening)">Today, Oct 24 (Evening)</option>
                          <option value="Tomorrow, Oct 25">Tomorrow, Oct 25</option>
                          <option value="Saturday, Oct 26">Saturday, Oct 26 (Weekend Prime)</option>
                          <option value="Sunday, Oct 27">Sunday, Oct 27</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Format / Auditorium */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="discovery-field-group">
                      <svg className="discovery-field-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                      </svg>
                      <div className="discovery-field-content">
                        <span className="discovery-field-label">PREMIUM FORMAT</span>
                        <select
                          className="discovery-field-select"
                          value={discoveryFormat}
                          onChange={(e) => setDiscoveryFormat(e.target.value)}
                        >
                          <option value="All Formats">All Premium Formats</option>
                          <option value="IMAX Laser 3D">IMAX Laser 3D</option>
                          <option value="Dolby Cinema">Dolby Cinema Atmos</option>
                          <option value="4DX Motion">4DX Dynamic Motion</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <button className="btn-stitch-find" onClick={handleFindShowtimesClick}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span>FIND SHOWTIMES</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* NOW SHOWING IN THEATERS SECTION */}
            <section id="now-showing" className="container mb-5 flex-grow-1">
              {/* Section Header with Tabs */}
              <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3">
                <div>
                  <div className="stitch-section-tag">
                    <span>●</span>
                    <span>TICKETS AVAILABLE</span>
                  </div>
                  <h2 className="stitch-section-title">NOW SHOWING IN THEATERS</h2>
                </div>

                {/* Format Pills */}
                <div className="stitch-tabs-group">
                  {FORMAT_TABS.map((tab) => (
                    <button
                      key={tab}
                      className={`stitch-tab-pill ${selectedFormat === tab ? "active" : ""}`}
                      onClick={() => setSelectedFormat(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Controls Toolbar */}
              <div className="p-3 rounded-4 mb-4" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
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

              {/* Loading & Error States */}
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: "var(--stitch-orange)" }} role="status" />
                  <p className="text-secondary mt-3">Connecting to digital movie catalog...</p>
                </div>
              )}

              {error && !loading && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Error:</strong> {error}
                  </div>
                  <button className="stitch-btn-pill stitch-btn-pill-orange btn-sm" onClick={loadMovies}>
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && filteredMovies.length === 0 && (
                <div className="text-center py-5 rounded-4" style={{ background: "#111420", border: "1px solid var(--stitch-border)" }}>
                  <h4 className="fw-bold text-white">No matching titles found</h4>
                  <p className="text-secondary">Try broadening your search query or reset active filters.</p>
                  <button
                    className="stitch-btn-pill stitch-btn-pill-ghost btn-sm mt-2"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedGenre("All");
                      setSelectedRating("All");
                      setSelectedFormat("ALL FORMATS");
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* Movie Grid */}
              {!loading && !error && filteredMovies.length > 0 && (
                <div className="row g-4">
                  {filteredMovies.map((movie, index) => {
                    const formatList = ["IMAX", "DOLBY", "REALD 3D", "LIVE CRITICS"];
                    const formatLabel = formatList[index % formatList.length];
                    const defaultPrices = ["$13.50", "$15.00", "$12.50", "$14.00"];
                    const displayPrice = defaultPrices[index % defaultPrices.length];
                    const audioTags = ["Dolby Atmos", "Dolby Vision", "Spatial Audio", "Haptic Immersive"];
                    const audioLabel = audioTags[index % audioTags.length];

                    return (
                      <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <div className="movie-card">
                          <div className="poster-wrapper">
                            {movie.posterUrl ? (
                              <img src={movie.posterUrl} alt={movie.title} className="poster-img" />
                            ) : (
                              <ProceduralPoster
                                title={movie.title}
                                genre={movie.genres?.[0] || "Cinema"}
                                format={formatLabel}
                                index={index}
                              />
                            )}

                            {/* Top Left Badge */}
                            <span className="card-format-badge">{formatLabel}</span>

                            {/* Top Right Rating */}
                            <span className="rating-badge">★ {movie.rating === "R" ? "4.7" : "4.8"}</span>
                          </div>

                          <div className="card-body-content">
                            <div>
                              <div className="movie-card-genres">
                                {movie.genres?.join(" / ") || "Theatrical Presentation"} · {movie.duration}m
                              </div>

                              <h5 className="movie-card-title text-truncate" title={movie.title}>
                                {movie.title}
                              </h5>

                              <div className="movie-card-meta-row">
                                <span className="card-tech-tag">{audioLabel}</span>
                                <span className="card-price-tag">From {displayPrice}</span>
                              </div>
                            </div>

                            <button
                              className="btn-card-action"
                              onClick={() => openMovieDetails(movie)}
                            >
                              View Showtimes
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* COMING SOON & PRESALES SECTION */}
            <section className="container mb-5">
              <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
                <div>
                  <div className="stitch-section-tag">
                    <span>●</span>
                    <span>ADVANCE ACCESS PASS</span>
                  </div>
                  <h3 className="stitch-section-title fs-3">COMING SOON & PRESALES</h3>
                </div>
                <button
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ color: "var(--stitch-orange)", fontWeight: 700, fontSize: "0.84rem" }}
                  onClick={() => showToast("Opening upcoming premiere release calendar...")}
                >
                  View Premiere Calendar →
                </button>
              </div>

              <div className="row g-4">
                {/* Presale Card 1 */}
                <div className="col-12 col-md-6">
                  <div className="stitch-presale-card">
                    <div className="presale-thumb d-flex align-items-center justify-content-center" style={{ background: "radial-gradient(circle, #2d1844 0%, #0d0f17 100%)" }}>
                      <span style={{ fontSize: "1.8rem" }}>🪐</span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="presale-badge-row">
                        <span className="presale-tag">PRESALE</span>
                        <span className="presale-date">Premiere Nov 04</span>
                      </div>
                      <h4 className="presale-title">Sub-Orbital 2089</h4>
                      <div className="presale-subtitle">dir. Elena Vane · NEO Wave Films</div>
                      <div className="presale-status-row">
                        <span>⏱ Tickets on sale in 08h</span>
                      </div>
                    </div>
                    <div>
                      <button
                        className="btn-presale-action"
                        onClick={() => showToast("Reminder registered for Sub-Orbital 2089 presale!")}
                      >
                        🔔 Notify Me
                      </button>
                    </div>
                  </div>
                </div>

                {/* Presale Card 2 */}
                <div className="col-12 col-md-6">
                  <div className="stitch-presale-card">
                    <div className="presale-thumb d-flex align-items-center justify-content-center" style={{ background: "radial-gradient(circle, #3d2410 0%, #0e0d10 100%)" }}>
                      <span style={{ fontSize: "1.8rem" }}>🎻</span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="presale-badge-row">
                        <span className="presale-tag" style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
                          EXCLUSIVE
                        </span>
                        <span className="presale-date">Premiere Nov 18</span>
                      </div>
                      <h4 className="presale-title">The Grand Requiem</h4>
                      <div className="presale-subtitle">Acoustic Symphony Hall · 4K HDR</div>
                      <div className="presale-status-row" style={{ color: "#34d399" }}>
                        <span>★ Advance VIP access list</span>
                      </div>
                    </div>
                    <div>
                      <button
                        className="btn-presale-action"
                        onClick={() => showToast("VIP Pass requested! Details sent to your account.")}
                      >
                        🎟 Join Pass
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MEMBERSHIP VALUE PROPOSITION BANNER */}
            <section className="container mb-5">
              <div className="stitch-membership-banner">
                <div className="row align-items-center g-4">
                  <div className="col-12 col-lg-8">
                    <div className="membership-eyebrow">
                      <span>●</span> IMOVIES PREMIERE PASS
                    </div>
                    <h3 className="membership-headline">
                      ZERO BOOKING FEES. 10-MINUTE CART SEAT HOLDS.
                    </h3>
                    <p className="membership-body">
                      Elevate your cinematic ritual. Unlock invitation-only midnight screenings, free recliner upgrades at select auditoriums, and gourmet concession credit on every booking.
                    </p>
                  </div>

                  <div className="col-12 col-lg-4 text-lg-end">
                    <div className="d-flex align-items-center justify-content-lg-end flex-wrap gap-2">
                      <button
                        className="btn-membership-join"
                        onClick={() => setMembershipModalOpen(true)}
                      >
                        JOIN FOR $12 / MONTH
                      </button>
                    </div>
                    <div className="mt-2">
                      <button
                        className="btn btn-link p-0 membership-perks-link"
                        onClick={() => setMembershipModalOpen(true)}
                      >
                        Explore Perks & Rules →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4-COLUMN FOOTER */}
            <footer className="stitch-footer">
              <div className="container">
                <div className="row g-4 mb-4">
                  {/* Col 1: Brand & Bio */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--stitch-orange)">
                        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                      </svg>
                      <strong className="fs-5 text-white tracking-wider">IMOVIES</strong>
                    </div>
                    <p className="small text-secondary" style={{ lineHeight: "1.6" }}>
                      The premier digital cinema destination. Immerse yourself in ultimate projection fidelity, precision soundscapes, and reserved luxury seating.
                    </p>
                  </div>

                  {/* Col 2: Cinemas & Screens */}
                  <div className="col-6 col-md-6 col-lg-3">
                    <div className="footer-col-title">Cinemas & Screens</div>
                    <ul className="footer-link-list">
                      <li><a href="#cinemas" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>Metropolis IMAX Hub</a></li>
                      <li><a href="#cinemas" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>Grand Pavilion Dolby Cinema</a></li>
                      <li><a href="#cinemas" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>Epic Rooftop Cinema</a></li>
                      <li><a href="#cinemas" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>Starlight 70mm Screenhouse</a></li>
                    </ul>
                  </div>

                  {/* Col 3: Experience & Terms */}
                  <div className="col-6 col-md-6 col-lg-3">
                    <div className="footer-col-title">Experience & Terms</div>
                    <ul className="footer-link-list">
                      <li><a href="#terms" onClick={(e) => { e.preventDefault(); showToast("Reservation Terms: 5-minute seat lock with automatic expiry."); }}>Ticket Reservation Terms</a></li>
                      <li><a href="#guidelines" onClick={(e) => { e.preventDefault(); showToast("Digital Pass: Present QR code at auditorium entrance."); }}>Digital Pass Guidelines</a></li>
                      <li><a href="#privacy" onClick={(e) => { e.preventDefault(); showToast("Privacy: No external tracking cookies stored."); }}>Privacy & Policy</a></li>
                      <li><a href="#a11y" onClick={(e) => { e.preventDefault(); showToast("Accessibility: Wheelchair and hearing assistance available."); }}>Accessibility Services</a></li>
                    </ul>
                  </div>

                  {/* Col 4: Architecture & Tech */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="footer-col-title">Architecture & Tech</div>
                    <div>
                      <div className="live-sync-pill">
                        <span className="live-sync-dot" />
                        <span>Live Sync Operational</span>
                      </div>
                      <div className="small text-secondary mb-2">Fullstack Simulation Stack:</div>
                      <div className="footer-tech-stack">
                        <span className="tech-tag-badge">React 19</span>
                        <span className="tech-tag-badge">Vite</span>
                        <span className="tech-tag-badge">Express</span>
                        <span className="tech-tag-badge">MongoDB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bottom Bar */}
                <div className="footer-bottom-bar">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ color: "var(--stitch-orange)" }}>⚡</span>
                    <span>Simulation Mode Active — Educational showcase and demo sandbox environment.</span>
                  </div>
                  <div>© 2026 IMovies Cinema Experiences. All rights reserved.</div>
                </div>
              </div>
            </footer>
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
                ✕
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

                <div className="col-12 col-md-4">
                  <label className="form-label small text-secondary">Duration (minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control custom-input"
                    value={movieForm.duration}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
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
                  <label className="form-label small text-secondary">Release Date</label>
                  <input
                    type="date"
                    className="form-control custom-input"
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-secondary">Genres (comma separated)</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={movieForm.genres}
                    placeholder="e.g. Action, Sci-Fi, Thriller"
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-secondary">Poster URL (Optional)</label>
                  <input
                    type="url"
                    className="form-control custom-input"
                    value={movieForm.posterUrl}
                    placeholder="https://example.com/poster.jpg"
                    onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-secondary">Synopsis Description</label>
                  <textarea
                    rows={3}
                    className="form-control custom-input"
                    value={movieForm.description}
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setMovieModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange px-4" disabled={movieFormLoading}>
                  {movieFormLoading ? "Saving..." : editingMovie ? "Save Changes" : "Create Movie"}
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
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h4 className="fw-bold text-white mb-0">{editingTheatre ? "Edit Theatre" : "Add New Theatre"}</h4>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setTheatreModalOpen(false)}>
                ✕
              </button>
            </div>

            {theatreFormError && <div className="alert alert-danger small py-2">{theatreFormError}</div>}

            <form onSubmit={handleSaveTheatre}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">Theatre Name *</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={theatreForm.name}
                    required
                    onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">City *</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={theatreForm.city}
                    required
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small text-secondary">Physical Address *</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={theatreForm.address}
                    required
                    onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">Phone Contact</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    value={theatreForm.phone}
                    onChange={(e) => setTheatreForm({ ...theatreForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setTheatreModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange px-4">
                  {editingTheatre ? "Save Changes" : "Create Theatre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD SCREEN (ADMIN)                                             */}
      {/* --------------------------------------------------------------------- */}
      {screenModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setScreenModalOpen(false)}>
          <div className="modal-dialog-custom p-4" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h5 className="fw-bold text-white mb-0">Add Screen to {selectedTheatreForScreens?.name}</h5>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setScreenModalOpen(false)}>
                ✕
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
                  onChange={(e) => setScreenForm({ ...screenForm, screenNumber: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">Screen Name *</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  value={screenForm.name}
                  required
                  onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">Screen Type *</label>
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

              <div className="mb-3">
                <label className="form-label small text-secondary">Seating Capacity *</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  className="form-control custom-input"
                  value={screenForm.seatingCapacity}
                  required
                  onChange={(e) => setScreenForm({ ...screenForm, seatingCapacity: e.target.value })}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setScreenModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange px-4">
                  Add Screen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD SHOWTIME (ADMIN)                                           */}
      {/* --------------------------------------------------------------------- */}
      {showModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setShowModalOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h4 className="fw-bold text-white mb-0">Schedule Theatrical Screening</h4>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setShowModalOpen(false)}>
                ✕
              </button>
            </div>

            {showFormError && <div className="alert alert-danger small py-2">{showFormError}</div>}

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
                  <label className="form-label small text-secondary">Select Venue *</label>
                  <select
                    className="form-select custom-select"
                    value={showForm.theatreId}
                    required
                    onChange={(e) => handleShowTheatreChange(e.target.value)}
                  >
                    {adminTheatres.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">Select Auditorium *</label>
                  <select
                    className="form-select custom-select"
                    value={showForm.screenId}
                    required
                    onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                  >
                    {availableScreensForShow.length === 0 ? (
                      <option value="">No screens in selected theatre</option>
                    ) : (
                      availableScreensForShow.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.screenType} - {s.seatingCapacity} seats)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small text-secondary">Screening Start Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control custom-input"
                    value={showForm.startTime}
                    required
                    onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
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
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange px-4" disabled={showFormLoading}>
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
                  <span> · {selectedMovie.language}</span>
                  {selectedMovie.rating && <span> · Rating: {selectedMovie.rating}</span>}
                </div>
              </div>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={closeDetails}>
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-danger" role="status" />
                <p className="text-secondary small mt-2">Loading showtimes...</p>
              </div>
            ) : detailsError ? (
              <div className="alert alert-warning small">{detailsError}</div>
            ) : (
              <div>
                <p className="text-light" style={{ lineHeight: "1.6" }}>
                  {movieDetails?.description || selectedMovie.description || "Immerse yourself in this acclaimed theatrical presentation in premium cinema audio and laser projection."}
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
                                {show.screen?.name || `Screen ${show.screen?.screenNumber}`} ·{" "}
                                {show.screen?.screenType || "2D"}
                              </div>
                            </div>

                            <div className="text-end">
                              <span className="badge bg-danger text-white mb-1 d-block">
                                {formattedDate} · {formattedTime}
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

                            <button className="stitch-btn-pill stitch-btn-pill-orange btn-sm px-3" onClick={() => startSeatSelection(show._id)}>
                              Choose Seats →
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
                ✕
              </button>
            </div>

            {activeHold && (
              <div className="alert alert-warning py-2 px-3 small d-flex align-items-center justify-content-between mt-3 mb-3">
                <div>
                  ⏱ <strong>Hold Token:</strong> <code className="text-dark fw-bold">{activeHold.holdToken}</code>
                </div>
                <span className="badge bg-warning text-dark fs-6 fw-bold">
                  {Math.floor((activeHold.remainingSeconds || 0) / 60)}:
                  {String((activeHold.remainingSeconds || 0) % 60).padStart(2, "0")}
                </span>
              </div>
            )}

            {bookingError && <div className="alert alert-danger small py-2">{bookingError}</div>}

            <div className="p-3 rounded mb-3" style={{ background: "#181c2b" }}>
              <h5 className="fw-bold text-white mb-1">{activeShow.movie?.title}</h5>
              <div className="text-secondary small">
                {activeShow.theatre?.name} · {activeShow.screen?.name} ({activeShow.screen?.screenType})
              </div>
              <div className="text-secondary small mt-1">
                {new Date(activeShow.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold text-white mb-2">Selected Seats ({selectedSeats.length})</h6>
              <div className="d-flex flex-column gap-1">
                {selectedSeatObjects.map((s) => (
                  <div key={s.seatNumber} className="d-flex justify-content-between small text-secondary">
                    <span>
                      Seat <strong>{s.seatNumber}</strong> ({s.tier?.toUpperCase()})
                    </span>
                    <strong className="text-white">${s.price}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-top border-secondary pt-3 mt-3 d-flex justify-content-between align-items-center mb-4">
              <span className="fs-5 fw-bold text-white">Total Amount</span>
              <span className="fs-4 fw-bold accent">${calculatedTotal}</span>
            </div>

            <div className="alert alert-info small" style={{ background: "#102330", borderColor: "#0e7490", color: "#67e8f9" }}>
              ℹ <strong>Educational Simulation:</strong> Payment processing is simulated. No actual financial transaction will occur.
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="stitch-btn-pill stitch-btn-pill-ghost" onClick={() => setReviewModalOpen(false)}>
                Change Seats
              </button>
              <button
                className="stitch-btn-pill stitch-btn-pill-orange px-4"
                disabled={bookingLoading}
                onClick={handleConfirmBooking}
              >
                {bookingLoading ? "Processing Reservation..." : "Confirm & Book Now (Simulated Payment)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: CONFIRMED BOOKING (STOREFRONT)                                 */}
      {/* --------------------------------------------------------------------- */}
      {confirmedBooking && (
        <div className="modal-backdrop-custom" onClick={() => setConfirmedBooking(null)}>
          <div className="modal-dialog-custom p-4 text-center" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <span className="fs-1 text-success">✓</span>
            <h4 className="fw-bold text-white mt-2 mb-1">Booking Confirmed!</h4>
            <p className="text-secondary small mb-3">Your tickets have been reserved and digitally issued.</p>

            <div className="p-3 rounded text-start mb-3" style={{ background: "#181c2b", border: "1px solid var(--stitch-border)" }}>
              <div className="d-flex justify-content-between small text-secondary mb-2">
                <span>Reference:</span>
                <strong className="accent">{confirmedBooking.bookingReference}</strong>
              </div>
              <div className="d-flex justify-content-between small text-secondary mb-2">
                <span>Status:</span>
                <span className="badge bg-success">{confirmedBooking.bookingStatus}</span>
              </div>
              <div className="d-flex justify-content-between small text-secondary mb-2">
                <span>Seats:</span>
                <span className="text-white">{confirmedBooking.seats?.map((s) => s.seatNumber).join(", ")}</span>
              </div>
              <div className="d-flex justify-content-between small text-secondary mb-2">
                <span>Total Paid:</span>
                <strong className="text-white">${confirmedBooking.totalAmount}</strong>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button className="stitch-btn-pill stitch-btn-pill-ghost flex-grow-1 justify-content-center" onClick={() => setConfirmedBooking(null)}>
                Done
              </button>
              <button className="stitch-btn-pill stitch-btn-pill-orange flex-grow-1 justify-content-center" onClick={() => { setConfirmedBooking(null); openMyBookings(); }}>
                View in My Bookings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* DRAWER / MODAL: MY BOOKINGS                                           */}
      {/* --------------------------------------------------------------------- */}
      {myBookingsOpen && (
        <div className="modal-backdrop-custom" onClick={() => setMyBookingsOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h4 className="fw-bold text-white mb-0">My Ticket Bookings</h4>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setMyBookingsOpen(false)}>
                ✕
              </button>
            </div>

            {myBookingsLoading ? (
              <div className="text-center py-5 text-secondary">Loading your booking history...</div>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <span className="fs-1 d-block mb-2">🎟️</span>
                <p>You haven't made any bookings yet.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {myBookings.map((b) => (
                  <div key={b._id} className="booking-item-card">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className="accent fs-5">{b.bookingReference}</strong>
                        <div className="text-white fw-bold mt-1">{b.show?.movie?.title}</div>
                        <div className="text-secondary small">
                          {b.show?.theatre?.name} · {b.show?.screen?.name}
                        </div>
                        <div className="text-secondary small">
                          {b.show?.startTime ? new Date(b.show.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
                        </div>
                      </div>

                      <div className="text-end">
                        <span className={`badge ${b.bookingStatus === "confirmed" ? "bg-success" : "bg-secondary"} mb-1`}>
                          {b.bookingStatus}
                        </span>
                        <div className="fw-bold text-white mt-1">${b.totalAmount}</div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary mt-2">
                      <div className="small text-secondary">
                        Seats:{" "}
                        {b.seats?.map((s) => (
                          <span key={s.seatNumber} className="badge bg-danger me-1">
                            {s.seatNumber}
                          </span>
                        ))}
                      </div>

                      {b.bookingStatus === "confirmed" && (
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
      {/* MODAL: CINEMAS EXPLORER                                               */}
      {/* --------------------------------------------------------------------- */}
      {cinemasModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setCinemasModalOpen(false)}>
          <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <div>
                <h4 className="fw-bold text-white mb-0">Flagship Cinemas & Screenhouses</h4>
                <div className="text-secondary small">Premium auditorium venues and projection standards</div>
              </div>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setCinemasModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="row g-3">
              {adminTheatres.map((t) => (
                <div key={t._id} className="col-12 col-md-6">
                  <div className="p-3 rounded-4" style={{ background: "#181c2b", border: "1px solid var(--stitch-border)" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="card-format-badge position-static">IMAX & DOLBY</span>
                      <strong className="text-white fs-5">{t.name}</strong>
                    </div>
                    <div className="text-secondary small mb-1">📍 {t.address}, {t.city}</div>
                    {t.phone && <div className="text-secondary small">📞 {t.phone}</div>}
                    <div className="mt-3 pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                      <span className="text-success small fw-bold">● Active Screenhouse</span>
                      <button
                        className="stitch-btn-pill stitch-btn-pill-orange btn-sm"
                        onClick={() => {
                          setDiscoveryCinema(t.name);
                          setCinemasModalOpen(false);
                          const el = document.getElementById("now-showing");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Explore Shows →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: PREMIERE PASS MEMBERSHIP                                       */}
      {/* --------------------------------------------------------------------- */}
      {membershipModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setMembershipModalOpen(false)}>
          <div className="modal-dialog-custom p-4" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h4 className="fw-bold text-white mb-0">IMovies Premiere Pass</h4>
              <button className="btn btn-sm btn-outline-secondary text-white" onClick={() => setMembershipModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="text-center py-3">
              <span className="fs-1">🎟️</span>
              <h3 className="fw-bold text-white mt-2">$12 / Month</h3>
              <p className="text-secondary small">Full VIP Privileges (Simulated Sandbox Access)</p>
            </div>

            <ul className="text-secondary small d-flex flex-column gap-2 mb-4">
              <li>✓ <strong>Zero Convenience Fees:</strong> Free digital reservation on every screening.</li>
              <li>✓ <strong>Extended 10-Minute Cart Holds:</strong> Double hold duration for high-demand premieres.</li>
              <li>✓ <strong>VIP Recliner Priority:</strong> Complimentary upgrade to VIP Recliner rows when available.</li>
              <li>✓ <strong>Invitation Midnight Previews:</strong> Early access to exclusive IMAX 70MM releases.</li>
            </ul>

            <div className="alert alert-info small" style={{ background: "#102330", borderColor: "#0e7490", color: "#67e8f9" }}>
              ℹ <strong>Educational Sandbox:</strong> Activating this membership grants instant pass perks in your active session.
            </div>

            <button
              className="stitch-btn-pill stitch-btn-pill-orange w-100 justify-content-center py-2"
              onClick={() => {
                setMembershipModalOpen(false);
                showToast("Premiere Pass activated! You now have zero booking fees and priority holds.");
              }}
            >
              Activate Pass Now
            </button>
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
                ✕
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

              <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange w-100 justify-content-center py-2 mb-3">
                {authMode === "login" ? "Sign In" : "Create Account"}
              </button>

              <div className="text-center small text-secondary">
                {authMode === "login" ? (
                  <>
                    Need an account?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small"
                      style={{ color: "var(--stitch-orange)" }}
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
                      className="btn btn-link p-0 text-decoration-none small"
                      style={{ color: "var(--stitch-orange)" }}
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
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
