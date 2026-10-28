import React, { useState, useEffect, useCallback, useRef } from "react";
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

const GENRES = ["All", "Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller", "70mm Vault"];
const RATINGS = ["All", "G", "PG", "PG-13", "R", "NC-17", "U", "UA", "A"];
const SCREEN_TYPES = ["All Formats", "2D", "3D", "IMAX", "4DX", "Dolby Cinema"];
const FORMAT_TABS = ["ALL CURATIONS", "SCI-FI NOIR", "AVANT-GARDE", "ARCHITECTURAL", "70MM VAULT"];

const CURATED_POSTERS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBzaYuPt24UmBdB-zBw-Z_ax0oPGXhpv855nm-y645RuCkZ6t4xWTNjf3ufOdBNwFVbZLkSfmmt_CcUVo0wWp-dLetbhI4y8HIQ13gqC6welhjPreunHHfORo19oqsHscTaR4dMTCiX5Nd0TOOm_HfW3Mf2ggRDUzuftT8fcbDPvq8AmlQBsNPLpknetBGFXelY37Leepx8ZxRqsTwMwjHZV8gKch22uiJeu2wg5-9_",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUT5JCakRL5sm94Mpvl5UiF-J2Gh9sSwxoAfsNtrA1cac3-B5cFLEZL2RCbi5Rom5em8sh5IJTi-4GWbeSVAsgfs89lZbORCRJpmvo2AEyXch67F4koxN5pHj0P_68l95Ckrz6KAILemHat5jfDEp4sSVaq0_3ZX2u2aLykt6Gubh_LdreAlXfNpn8dn8EQ_zAT5cbSHkJwxIbipzA5677M2M--741S7FWQPLe02Fz",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCdEREWWkXMKoiGeicm1Hg443mCPXRi5mHhCXazoEZJzV15_9ogaxO2qnZ84N8sH4QaTvlDEa70CZq3U4-S6aWGY25ugPGKuGFUt3bO1SyzElBlSGWUKQ0hp-G9vY_RGe7m2IUmzWm1fwoTDXbPyN91eSOa6tFEADnqzqI5HCWbjDJzmJCG2mf6XbtIrgkXAbcxvUQOpj7_cdZ3sKh-pU9I9TuNeafL-X2ucPa7BJKg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBiNbNJuxO7ll5eM492lMaxbfxkj9dN_-aqvhh7CObzbmyawF70U3EFNSWYum72kK_LTzcqTr5XCAXSb0cCHwe6paR1LCHM9VbL8oYKw4TFR4KIj49TLb-71LNhmshX6-kgNiB9QI7gN7u8pQRUjPVv531PbxqwUjczJFRDSoefRvrYGqD0kMfGLSR4wtyBVpP1ARKK1fKNkxivZA6ILCxwlMFTm6myY3hHULrpgRbi",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAmEN9JmiSSj-9O-5vfCmaPE2XHn4cym3a5Err6fiKnA6Y8AHJOaSZdaMEnfUXUm71aauHCApy2CBb512y5xXIcxVXgNnQj5cE9BKsyBDPr6nG_DHrVctFQSNuGvL1S0NDOTht8S92dRTr9tuMmM460UmK5dTxfxAui62k1SuQGDhE9gktmkfDtDIoDETllvWt_9oqWXcPB3aIF7_YG2hTEbcIBlDu_S0umkkeJY_EP",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAR0y09P1mvOWoZ3qwHIW3v-1v0dEnXktthdAMSOuGHenJyCh8qNjPCDFdvISUvzAzGrGVZHfbIJzHhNww195QeHTKodzUlJo0gInZbYy60fG7fjkpfFZIGVRwhM9UPWUg3SyyFjw9pft607q5WdkjENuyy1IoBEdUhicHL1ebNXz3XSzyQ6Rpuu1lB8GWpMaJ0wSnwMjdWX9ktxgzpnrrUzLTqMRHsoGILF1KhjhfO",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXFoV_ecsIsPrbDwL7RufMpYELfpXO5I_uufnkOOOULiYWRYIggutY5rYgbOojkpw4eRCgTVfoblAk0B4C5XMWpEyGEIP3HB0HV-lXeEBNCFJKgsfi2WJ4kp74sSLRMOGkkiPhxFx_GHpA2Gp-tTlIzfYvVBVObxCz_CQNicSOnjTcGsm0nEO7tg8gwuD9mjOAquOVvSja1cZbvRPzTnUOVVGInQ64xOJwBv3p_6FA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8FPMs9naiKLl58N_05ZygFDR15CkqDpWxNz6J7EOfdxWTfuw4orSz91oailiNKjCeazS7mxZif1GGJvzKQLMXZbQZE4xouF-GxD0m5lRYuYz6cqTKXbQzk_7xOSdIK3T0sxNlFE_3saCURWkCKOIPEzGoN1jsHJm14yEIPgrB-3aSFf57bsTDtonJ0ePHDG8FS9KO-29l0w6WVTyvR6O9wywwjiWjGoO2_DnYRBaL",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDAqZj2ud7TvWUj56JNy-WszFgkyFFM6KUQFA2H5Bk41vb9Z6R2DJPwW7bkGIz_bxRp-HsBxAWDR4PBRa_zGXzxvoCrqrfjs7i-caS9AezJa3AoAl-raZfoB80iGZ5SAAl8okZUBopyV0ekhITO1QxTH3Zt8eSCaE0N4rV-6-0vwvjkn7N3hU0PblmTOqnJ97ra5S4mP_YAOXx9jPwLwv-04RhCZDOpmiBGvchfqE0N",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAdrVqR5F1xoM0Epu3tu7YyY0bQCXbaZyfuV_JeZsj35dmaHb9tWmPs5LJmJHnZpJ_r_W2BlwwnThqW3qn6D9x8oygR_uuPBjTVcFJVj1gPcQvgxCo8Fwa-F5P8Gf12Je1NGQr49UHxd1yZxjbcKzItcC_URk1m6EcO6-w2KCI8XgpBbm8tuM_wbCmDv-BWnbk5TxjVgtLk0GvLU3Pk6xA5Z8mPSjEUXXmTnfTjpmKx",
];

const FEATURED_HEROES = [
  {
    title: "Chronos: Beyond Horizons",
    headlinePart1: "CHRONOS:",
    headlinePart2: "BEYOND HORIZONS.",
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
    bgImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD__PhmCmVhMNbOi85_RZ0VLKOMA8Vgp-NQvAgH0yV9ukpcT5GkhiHLP_5hUkxGJ_xvkLpWCzdGUgi4sg6SnPCG9LvIwbLBdWLo_E3HhpzNa4_jVI0YN0EoDL9B7Oyy-v_TKcJrXud3rvb6lSZ9GpRIPhLUTNdZylhXL2qNnpIl-oRJNjTfgMjQhOi-VfeaUeBmBu0_reGDcatZOlPSLznklX90j84gmLXggWZobCQH",
    posterImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzaYuPt24UmBdB-zBw-Z_ax0oPGXhpv855nm-y645RuCkZ6t4xWTNjf3ufOdBNwFVbZLkSfmmt_CcUVo0wWp-dLetbhI4y8HIQ13gqC6welhjPreunHHfORo19oqsHscTaR4dMTCiX5Nd0TOOm_HfW3Mf2ggRDUzuftT8fcbDPvq8AmlQBsNPLpknetBGFXelY37Leepx8ZxRqsTwMwjHZV8gKch22uiJeu2wg5-9_",
  },
  {
    title: "The Velvet Heist",
    headlinePart1: "THE VELVET",
    headlinePart2: "HEIST.",
    tag: "NOW SHOWING — DOLBY VISION",
    rating: "R",
    genreText: "Crime / Noir / Thriller",
    durationText: "1h 58m",
    scoreText: "★ 4.7 (8.2k ratings)",
    audioTag: "DOLBY ATMOS",
    visualTag: "DOLBY CINEMA",
    synopsis:
      "In the rain-slicked neon labyrinths of Neo-Verona, an elite heist collective breaches a subterranean corporate citadel to recover encrypted neural memories.",
    upNextTitle: "Aetheria: Kingdom of Winds",
    upNextSub: "Starts in 45 mins — Screen 04",
    upNextFormat: "UP NEXT IN DOLBY CINEMA",
    bgImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDUT5JCakRL5sm94Mpvl5UiF-J2Gh9sSwxoAfsNtrA1cac3-B5cFLEZL2RCbi5Rom5em8sh5IJTi-4GWbeSVAsgfs89lZbORCRJpmvo2AEyXch67F4koxN5pHj0P_68l95Ckrz6KAILemHat5jfDEp4sSVaq0_3ZX2u2aLykt6Gubh_LdreAlXfNpn8dn8EQ_zAT5cbSHkJwxIbipzA5677M2M--741S7FWQPLe02Fz",
    posterImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDUT5JCakRL5sm94Mpvl5UiF-J2Gh9sSwxoAfsNtrA1cac3-B5cFLEZL2RCbi5Rom5em8sh5IJTi-4GWbeSVAsgfs89lZbORCRJpmvo2AEyXch67F4koxN5pHj0P_68l95Ckrz6KAILemHat5jfDEp4sSVaq0_3ZX2u2aLykt6Gubh_LdreAlXfNpn8dn8EQ_zAT5cbSHkJwxIbipzA5677M2M--741S7FWQPLe02Fz",
  },
  {
    title: "Aetheria: Kingdom of Winds",
    headlinePart1: "AETHERIA:",
    headlinePart2: "KINGDOM OF WINDS.",
    tag: "NOW SHOWING — REALD 3D",
    rating: "PG",
    genreText: "Fantasy / Animation",
    durationText: "1h 48m",
    scoreText: "★ 4.9 (15.1k ratings)",
    audioTag: "SPATIAL AUDIO",
    visualTag: "REALD 3D",
    synopsis:
      "Above the cloud canopy, an intrepid young skimmer unearths a forgotten relic capable of re-anchoring the floating islands before the solar rift tears their sanctuary apart.",
    upNextTitle: "Shadow Protocol: Zero Hour",
    upNextSub: "Starts in 1h 10m — Screen 01",
    upNextFormat: "UP NEXT IN 4DX",
    bgImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdEREWWkXMKoiGeicm1Hg443mCPXRi5mHhCXazoEZJzV15_9ogaxO2qnZ84N8sH4QaTvlDEa70CZq3U4-S6aWGY25ugPGKuGFUt3bO1SyzElBlSGWUKQ0hp-G9vY_RGe7m2IUmzWm1fwoTDXbPyN91eSOa6tFEADnqzqI5HCWbjDJzmJCG2mf6XbtIrgkXAbcxvUQOpj7_cdZ3sKh-pU9I9TuNeafL-X2ucPa7BJKg",
    posterImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdEREWWkXMKoiGeicm1Hg443mCPXRi5mHhCXazoEZJzV15_9ogaxO2qnZ84N8sH4QaTvlDEa70CZq3U4-S6aWGY25ugPGKuGFUt3bO1SyzElBlSGWUKQ0hp-G9vY_RGe7m2IUmzWm1fwoTDXbPyN91eSOa6tFEADnqzqI5HCWbjDJzmJCG2mf6XbtIrgkXAbcxvUQOpj7_cdZ3sKh-pU9I9TuNeafL-X2ucPa7BJKg",
  },
  {
    title: "Shadow Protocol: Zero Hour",
    headlinePart1: "SHADOW PROTOCOL:",
    headlinePart2: "ZERO HOUR.",
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
    bgImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiNbNJuxO7ll5eM492lMaxbfxkj9dN_-aqvhh7CObzbmyawF70U3EFNSWYum72kK_LTzcqTr5XCAXSb0cCHwe6paR1LCHM9VbL8oYKw4TFR4KIj49TLb-71LNhmshX6-kgNiB9QI7gN7u8pQRUjPVv531PbxqwUjczJFRDSoefRvrYGqD0kMfGLSR4wtyBVpP1ARKK1fKNkxivZA6ILCxwlMFTm6myY3hHULrpgRbi",
    posterImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiNbNJuxO7ll5eM492lMaxbfxkj9dN_-aqvhh7CObzbmyawF70U3EFNSWYum72kK_LTzcqTr5XCAXSb0cCHwe6paR1LCHM9VbL8oYKw4TFR4KIj49TLb-71LNhmshX6-kgNiB9QI7gN7u8pQRUjPVv531PbxqwUjczJFRDSoefRvrYGqD0kMfGLSR4wtyBVpP1ARKK1fKNkxivZA6ILCxwlMFTm6myY3hHULrpgRbi",
  },
];

// Helper Artwork Component for Procedural Posters
function ProceduralPoster({ title = "Cinema", genre = "Sci-Fi", format = "IMAX", index = 0 }) {
  const gradients = [
    "radial-gradient(circle at 50% 30%, #3b1d54 0%, #100d11 80%)",
    "radial-gradient(circle at 50% 30%, #4a0d24 0%, #100d11 80%)",
    "radial-gradient(circle at 50% 30%, #20132b 0%, #100d11 80%)",
    "radial-gradient(circle at 50% 30%, #2e0915 0%, #100d11 80%)",
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
          backgroundImage: "radial-gradient(circle, #ffb3b2 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 800,
            color: "#ffb3b2",
            border: "1px solid rgba(216,13,53,0.5)",
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(216,13,53,0.2)",
            textTransform: "uppercase",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {format}
        </span>
        <span
          style={{
            fontSize: "0.65rem",
            color: "#e6bdbc",
            fontFamily: "Space Grotesk, monospace",
          }}
        >
          ARC-70MM
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <h4
          style={{
            color: "#ffffff",
            fontWeight: 800,
            textTransform: "uppercase",
            fontSize: "1.1rem",
            lineHeight: 1.15,
            margin: "0 0 4px",
            letterSpacing: "-0.01em",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {title}
        </h4>
        <span style={{ fontSize: "0.7rem", color: "#ad8887", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {genre}
        </span>
      </div>
    </div>
  );
}

// Seat Row Grouping Helper
function groupSeatsByRow(seats = []) {
  const rowMap = {};
  for (const seat of seats) {
    const row = seat.seatNumber ? seat.seatNumber.charAt(0) : "A";
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
}

function App() {
  // Navigation & View State
  const [portalView, setPortalView] = useState("storefront"); // "storefront" | "admin"
  const [activeTab, setActiveTab] = useState("discover"); // "discover" | "movies" | "cinemas" | "coming-soon" | "about"
  const [heroIndex, setHeroIndex] = useState(0);

  // Authentication State
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("imovies_token") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("imovies_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState(null);

  // Storefront Catalog State
  const [movies, setMovies] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [selectedScreenType, setSelectedScreenType] = useState("All Formats");
  const [activeCuratorFilter, setActiveCuratorFilter] = useState("ALL CURATIONS");
  const [sortBy, setSortBy] = useState("releaseDate");

  // Discovery Bar State
  const [discoveryCinema, setDiscoveryCinema] = useState("");
  const [discoveryDate, setDiscoveryDate] = useState("Today, Oct 24 (Evening)");
  const [discoveryFormat, setDiscoveryFormat] = useState("IMAX Laser 3D");

  // Movie Details & Shows Modal
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [movieShows, setMovieShows] = useState([]);
  const [allShowsList, setAllShowsList] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Seat Selection & Real-Time Holds
  const [activeShow, setActiveShow] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [showError, setShowError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeHold, setActiveHold] = useState(null);
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdError, setHoldError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);

  // Review & Booking
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // User's Booking History Drawer
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Informational Modals
  const [cinemasModalOpen, setCinemasModalOpen] = useState(false);
  const [selectedMetropolis, setSelectedMetropolis] = useState("TOKYO");
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Admin Dashboard State
  const [adminTab, setAdminTab] = useState("overview"); // "overview" | "movies" | "theatres" | "shows" | "bookings"
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
    genre: ["Sci-Fi"],
    language: "English",
    rating: "PG-13",
    releaseDate: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  // Admin Theatres & Screens Management
  const [adminTheatres, setAdminTheatres] = useState([]);
  const [theatresLoading, setTheatresLoading] = useState(false);
  const [theatreModalOpen, setTheatreModalOpen] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [theatreForm, setTheatreForm] = useState({
    name: "",
    city: "Tokyo",
    address: "",
    amenities: ["IMAX GT", "Dolby Atmos", "4K Laser"],
  });
  const [selectedTheatreForScreens, setSelectedTheatreForScreens] = useState(null);
  const [screensList, setScreensList] = useState([]);
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [screenForm, setScreenForm] = useState({
    name: "",
    screenNumber: 1,
    screenType: "IMAX",
    rows: 8,
    seatsPerRow: 10,
  });

  // Admin Showtimes Management
  const [adminShows, setAdminShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [theatreScreensForShow, setTheatreScreensForShow] = useState([]);
  const [showForm, setShowForm] = useState({
    movieId: "",
    theatreId: "",
    screenId: "",
    startTime: "",
    standardPrice: 15,
    premiumPrice: 20,
    vipPrice: 25,
  });

  // Admin Bookings Management
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);
  const [bookingFilterStatus, setBookingFilterStatus] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const currentHero = FEATURED_HEROES[heroIndex] || FEATURED_HEROES[0];

  // Socket.IO Connection for Real-Time Seat Synchronization
  useEffect(() => {
    const socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      if (activeShow?._id) {
        socket.emit("join:show", activeShow._id);
      }
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("seat:held", (payload) => {
      if (!activeShow || payload.showId !== activeShow._id) return;
      setActiveShow((prev) => {
        if (!prev) return prev;
        const updatedSeats = prev.seats.map((seat) => {
          if (payload.seatNumbers.includes(seat.seatNumber)) {
            return {
              ...seat,
              status: "reserved",
              holdToken: payload.holdToken,
              isHeldByMe: payload.userId === currentUser?._id,
            };
          }
          return seat;
        });
        return { ...prev, seats: updatedSeats };
      });
    });

    socket.on("seat:released", (payload) => {
      if (!activeShow || payload.showId !== activeShow._id) return;
      setActiveShow((prev) => {
        if (!prev) return prev;
        const updatedSeats = prev.seats.map((seat) => {
          if (payload.seatNumbers.includes(seat.seatNumber)) {
            return { ...seat, status: "available", holdToken: null, isHeldByMe: false };
          }
          return seat;
        });
        return { ...prev, seats: updatedSeats };
      });
    });

    socket.on("seat:booked", (payload) => {
      if (!activeShow || payload.showId !== activeShow._id) return;
      setActiveShow((prev) => {
        if (!prev) return prev;
        const updatedSeats = prev.seats.map((seat) => {
          if (payload.seatNumbers.includes(seat.seatNumber)) {
            return { ...seat, status: "booked" };
          }
          return seat;
        });
        return { ...prev, seats: updatedSeats };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [activeShow?._id, currentUser?._id]);

  // Join/leave show room on activeShow changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && activeShow?._id) {
      socketRef.current.emit("join:show", activeShow._id);
      return () => {
        socketRef.current.emit("leave:show", activeShow._id);
      };
    }
  }, [activeShow?._id]);

  // Countdown Timer for Active Seat Hold
  useEffect(() => {
    if (!activeHold?.expiresAt) return;
    const interval = setInterval(() => {
      const remainingMs = new Date(activeHold.expiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        clearInterval(interval);
        setActiveHold(null);
        setSelectedSeats([]);
        setReviewModalOpen(false);
        setHoldError("Your 5-minute seat hold has expired. The seats have been released.");
        if (activeShow?._id) {
          fetchShowById(activeShow._id).then((res) => setActiveShow(res.data)).catch(() => {});
        }
      } else {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setActiveHold((prev) => (prev ? { ...prev, remainingSeconds } : null));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold?.expiresAt, activeShow?._id]);

  // Load Movies for Storefront Catalog
  const loadMovies = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const params = {};
      if (searchTerm.trim()) {
        params.q = searchTerm.trim();
        params.search = searchTerm.trim();
      }
      if (selectedGenre !== "All") params.genre = selectedGenre;
      if (selectedRating !== "All") params.rating = selectedRating;
      if (sortBy) params.sortBy = sortBy;
      const res = await fetchMovies(params);
      setMovies(res.data || []);
    } catch (err) {
      setCatalogError(err.message || "Failed to load movie catalog.");
    } finally {
      setCatalogLoading(false);
    }
  }, [searchTerm, selectedGenre, selectedRating, sortBy]);

  useEffect(() => {
    if (portalView === "storefront") {
      const handler = setTimeout(() => {
        loadMovies();
      }, 100);
      return () => clearTimeout(handler);
    }
  }, [loadMovies, portalView]);

  // Initial Load of All Scheduled Shows
  useEffect(() => {
    fetchShows({ includePast: "true" })
      .then((res) => setAllShowsList(res.data || []))
      .catch(() => {});
  }, []);

  // Initial Load of Theatres
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

  // Authentication Handlers
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

  // Admin Data Loaders
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
      genre: ["Sci-Fi"],
      language: "English",
      rating: "PG-13",
      releaseDate: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setMovieModalOpen(true);
  };

  const handleOpenEditMovie = (movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title,
      description: movie.description || "",
      duration: movie.duration || 120,
      genre: movie.genre || ["Sci-Fi"],
      language: movie.language || "English",
      rating: movie.rating || "PG-13",
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : new Date().toISOString().split("T")[0],
      isActive: movie.isActive !== false,
    });
    setMovieModalOpen(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        await updateMovie(editingMovie._id, movieForm, authToken);
        showToast("Movie updated successfully.");
      } else {
        await createMovie(movieForm, authToken);
        showToast("Movie added successfully.");
      }
      setMovieModalOpen(false);
      loadAdminMovies();
      loadMovies();
    } catch (err) {
      alert("Movie operation failed: " + err.message);
    }
  };

  const handleToggleMovieActive = async (movie) => {
    try {
      await updateMovie(movie._id, { isActive: !movie.isActive }, authToken);
      showToast(`Movie ${movie.isActive ? "deactivated" : "activated"}.`);
      loadAdminMovies();
      loadMovies();
    } catch (err) {
      alert("Status change failed: " + err.message);
    }
  };

  // Admin Theatre CRUD
  const handleOpenAddTheatre = () => {
    setEditingTheatre(null);
    setTheatreForm({ name: "", city: "Tokyo", address: "", amenities: ["IMAX GT", "Dolby Atmos", "4K Laser"] });
    setTheatreModalOpen(true);
  };

  const handleOpenEditTheatre = (theatre) => {
    setEditingTheatre(theatre);
    setTheatreForm({
      name: theatre.name,
      city: theatre.city,
      address: theatre.address || "",
      amenities: theatre.amenities || ["IMAX GT", "Dolby Atmos"],
    });
    setTheatreModalOpen(true);
  };

  const handleSaveTheatre = async (e) => {
    e.preventDefault();
    try {
      if (editingTheatre) {
        await updateTheatre(editingTheatre._id, theatreForm, authToken);
        showToast("Theatre updated successfully.");
      } else {
        await createTheatre(theatreForm, authToken);
        showToast("Theatre created successfully.");
      }
      setTheatreModalOpen(false);
      loadAdminTheatres();
    } catch (err) {
      alert("Theatre operation failed: " + err.message);
    }
  };

  const handleToggleTheatreActive = async (theatre) => {
    try {
      await updateTheatre(theatre._id, { isActive: !theatre.isActive }, authToken);
      showToast(`Theatre ${theatre.isActive ? "deactivated" : "activated"}.`);
      loadAdminTheatres();
    } catch (err) {
      alert("Status change failed: " + err.message);
    }
  };

  // Admin Screen Management
  const handleSelectTheatreForScreens = async (theatre) => {
    setSelectedTheatreForScreens(theatre);
    try {
      const res = await fetchScreensByTheatre(theatre._id);
      setScreensList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddScreen = () => {
    if (!selectedTheatreForScreens) return;
    setScreenForm({
      name: `Auditorium 0${screensList.length + 1}`,
      screenNumber: screensList.length + 1,
      screenType: "IMAX",
      rows: 8,
      seatsPerRow: 10,
    });
    setScreenModalOpen(true);
  };

  const handleSaveScreen = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: screenForm.name,
        screenNumber: Number(screenForm.screenNumber),
        screenType: screenForm.screenType,
        seatLayout: {
          rows: Number(screenForm.rows),
          seatsPerRow: Number(screenForm.seatsPerRow),
        },
      };
      await createScreen(selectedTheatreForScreens._id, payload, authToken);
      showToast("Screen added to auditorium successfully.");
      setScreenModalOpen(false);
      handleSelectTheatreForScreens(selectedTheatreForScreens);
    } catch (err) {
      alert("Screen creation failed: " + err.message);
    }
  };

  const handleDeleteScreen = async (screenId) => {
    if (!window.confirm("Delete this screen layout?")) return;
    try {
      await deleteScreen(selectedTheatreForScreens._id, screenId, authToken);
      showToast("Screen removed successfully.");
      handleSelectTheatreForScreens(selectedTheatreForScreens);
    } catch (err) {
      alert("Failed to delete screen: " + err.message);
    }
  };

  // Admin Showtimes Management
  const handleOpenAddShow = async () => {
    if (adminTheatres.length > 0) {
      handleShowTheatreChange(adminTheatres[0]._id);
    }
    setShowForm({
      movieId: adminMovies[0]?._id || "",
      theatreId: adminTheatres[0]?._id || "",
      screenId: "",
      startTime: "",
      standardPrice: 18,
      premiumPrice: 24,
      vipPrice: 32,
    });
    setShowModalOpen(true);
  };

  const handleShowTheatreChange = async (theatreId) => {
    setShowForm((prev) => ({ ...prev, theatreId, screenId: "" }));
    try {
      const res = await fetchScreensByTheatre(theatreId);
      setTheatreScreensForShow(res.data || []);
      if (res.data?.length) {
        setShowForm((prev) => ({ ...prev, screenId: res.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveShow = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        movie: showForm.movieId,
        theatre: showForm.theatreId,
        screen: showForm.screenId,
        startTime: new Date(showForm.startTime).toISOString(),
        pricing: [
          { tier: "standard", price: Number(showForm.standardPrice) },
          { tier: "premium", price: Number(showForm.premiumPrice) },
          { tier: "vip", price: Number(showForm.vipPrice) },
        ],
      };
      await createShow(payload, authToken);
      showToast("Showtime scheduled successfully.");
      setShowModalOpen(false);
      loadAdminShows();
    } catch (err) {
      alert("Showtime scheduling failed: " + err.message);
    }
  };

  const handleCancelShow = async (showId) => {
    if (!window.confirm("Cancel this scheduled show?")) return;
    try {
      await cancelShow(showId, authToken);
      showToast("Show cancelled.");
      loadAdminShows();
    } catch (err) {
      alert("Show cancellation failed: " + err.message);
    }
  };

  // Storefront Movie Details & Show Selection
  const openMovieDetails = async (movie) => {
    setSelectedMovie(movie);
    setDetailsError(null);

    // Immediately pre-populate from cached shows so buttons are instant
    const existing = allShowsList.filter(
      (s) => s.movie?._id === movie._id || s.movie === movie._id || s.movie?.title === movie.title
    );
    if (existing.length > 0) {
      setMovieShows(existing);
      setDetailsLoading(false);
    } else {
      setDetailsLoading(true);
    }

    try {
      const [detailRes, showsRes] = await Promise.all([
        fetchMovieById(movie._id),
        fetchShows({ movie: movie._id, includePast: "true" }),
      ]);
      setMovieDetails(detailRes.data);
      if (showsRes.data && showsRes.data.length > 0) {
        setMovieShows(showsRes.data);
      } else if (existing.length === 0) {
        const resAll = await fetchShows({ includePast: "true" });
        const matched = (resAll.data || []).filter(
          (s) => s.movie?._id === movie._id || s.movie?.title === movie.title
        );
        setMovieShows(matched);
      }
    } catch (err) {
      if (!existing.length) {
        setDetailsError(err.message || "Could not retrieve showtimes.");
      }
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

  const handleHeroBookAction = (feat) => {
    const matched =
      movies.find((m) =>
        m.title.toLowerCase().includes(feat.title.toLowerCase()) ||
        feat.title.toLowerCase().includes(m.title.toLowerCase())
      ) || movies[0];

    if (matched) {
      openMovieDetails(matched);
    } else {
      showToast("Loading scheduled showtimes for " + feat.title);
    }
  };

  const handleFindShowtimesClick = () => {
    if (movies.length > 0) {
      openMovieDetails(movies[0]);
    }
  };

  return (
    <div className="app bg-surface text-on-surface min-h-screen flex flex-col font-['Inter']">
      {/* ------------------------------------------------------------------- */}
      {/* STITCH HEADER / NAVBAR                                              */}
      {/* ------------------------------------------------------------------- */}
      <header className="fixed top-0 w-full z-50 bg-[#080609]/80 backdrop-blur-xl border-b border-white/[0.08] stitch-navbar">
        <div className="h-20 w-full px-4 md:px-8 lg:px-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="navbar-brand flex items-center gap-3 text-decoration-none"
              onClick={(e) => {
                e.preventDefault();
                setPortalView("storefront");
                setActiveTab("discover");
                setActiveShow(null);
              }}
            >
              <div className="w-9 h-9 rounded bg-[#2c292d] border border-white/[0.12] flex items-center justify-center text-[#d80d35] shadow-[0_0_16px_rgba(216,13,53,0.35)] brand-icon-box">
                <span className="material-symbols-outlined text-[20px]">theaters</span>
              </div>
              <div className="flex flex-col">
                <span className="font-['Space_Grotesk'] text-lg uppercase tracking-wider text-[#e8e0e6] leading-none font-bold">
                  IMO<span className="text-[#d80d35]">VIES</span>
                </span>
                <span className="font-['Space_Grotesk'] text-[9px] text-[#e6bdbc] tracking-[0.2em] uppercase mt-1">
                  Cinema, Beyond the Ordinary
                </span>
              </div>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6">
            <a
              href="#discover"
              className={`uppercase transition-colors text-xs tracking-wider font-semibold font-['Space_Grotesk'] text-decoration-none ${
                portalView === "storefront" && activeTab === "discover" && !activeShow
                  ? "text-[#ffb3b2] font-bold border-b-2 border-[#d80d35] pb-0.5"
                  : "text-[#e6bdbc] hover:text-[#e8e0e6]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setPortalView("storefront");
                setActiveTab("discover");
                setActiveShow(null);
              }}
            >
              Discover
            </a>
            <a
              href="#movies"
              className={`uppercase transition-colors text-xs tracking-wider font-semibold font-['Space_Grotesk'] text-decoration-none ${
                portalView === "storefront" && activeTab === "movies" && !activeShow
                  ? "text-[#ffb3b2] font-bold border-b-2 border-[#d80d35] pb-0.5"
                  : "text-[#e6bdbc] hover:text-[#e8e0e6]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setPortalView("storefront");
                setActiveTab("movies");
                setActiveShow(null);
              }}
            >
              Movies
            </a>
            <a
              href="#cinemas"
              className="uppercase transition-colors text-xs tracking-wider font-semibold font-['Space_Grotesk'] text-[#e6bdbc] hover:text-[#e8e0e6] text-decoration-none"
              onClick={(e) => {
                e.preventDefault();
                setCinemasModalOpen(true);
              }}
            >
              Cinemas
            </a>
            <a
              href="#coming-soon"
              className="uppercase transition-colors text-xs tracking-wider font-semibold font-['Space_Grotesk'] text-[#e6bdbc] hover:text-[#e8e0e6] text-decoration-none"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("the-next-chapter");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                else {
                  setPortalView("storefront");
                  setActiveTab("discover");
                  setActiveShow(null);
                  setTimeout(() => {
                    document.getElementById("the-next-chapter")?.scrollIntoView({ behavior: "smooth" });
                  }, 200);
                }
              }}
            >
              Coming Soon
            </a>
            <a
              href="#about"
              className="uppercase transition-colors text-xs tracking-wider font-semibold font-['Space_Grotesk'] text-[#e6bdbc] hover:text-[#e8e0e6] text-decoration-none"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("manifesto");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                else {
                  setPortalView("storefront");
                  setActiveTab("discover");
                  setActiveShow(null);
                  setTimeout(() => {
                    document.getElementById("manifesto")?.scrollIntoView({ behavior: "smooth" });
                  }, 200);
                }
              }}
            >
              About
            </a>
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-[#221f23] border border-white/[0.08] flex items-center justify-center text-[#e6bdbc] hover:text-white hover:border-white/[0.2] transition-colors"
              onClick={() => {
                setPortalView("storefront");
                setActiveTab("movies");
                setActiveShow(null);
                setTimeout(() => {
                  document.querySelector('input[placeholder="Search movies by title..."]')?.focus();
                }, 200);
              }}
              title="Search Movie Titles"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>

            <button
              type="button"
              className="items-center gap-2 h-9 px-3.5 rounded-lg bg-[#221f23] border border-white/[0.08] hover:border-white/[0.2] text-[#e8e0e6] transition-colors text-decoration-none inline-flex"
              onClick={openMyBookings}
            >
              <span className="material-symbols-outlined text-[16px] text-[#e6bdbc]">confirmation_number</span>
              <span className="text-xs font-semibold font-['Space_Grotesk']">Bookings</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-[#d80d35] text-white font-['Space_Grotesk'] text-[10px] font-bold">
                {myBookings.length > 0 ? myBookings.length : 3}
              </span>
            </button>

            {/* Admin Management Portal Access Button */}
            <button
              type="button"
              className={`items-center gap-2 px-3 py-1.5 rounded bg-[#310713]/70 border transition-all text-decoration-none inline-flex ${
                portalView === "admin"
                  ? "border-[#d80d35] text-white shadow-[0_0_12px_rgba(216,13,53,0.4)]"
                  : "border-white/[0.12] text-[#ffb3b2] hover:border-[#d80d35]"
              }`}
              onClick={() => {
                if (portalView === "admin") {
                  setPortalView("storefront");
                } else {
                  setPortalView("admin");
                }
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb3b2] animate-pulse" />
              <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest font-bold">
                Admin Dashboard
              </span>
            </button>

            {/* Profile Avatar / Quick Login */}
            <button
              type="button"
              className="flex items-center gap-2 p-0 border-0 bg-transparent"
              onClick={() => {
                if (currentUser) {
                  handleLogout();
                } else {
                  setAuthModalOpen(true);
                }
              }}
              title={currentUser ? `Signed in as ${currentUser.name} (Click to sign out)` : "Sign In / Register"}
            >
              <div className="w-8 h-8 rounded-full bg-[#ffb3b2] flex items-center justify-center text-[#680013] font-bold text-xs shadow-[0_0_10px_rgba(255,179,178,0.3)]">
                {currentUser ? (
                  currentUser.name?.charAt(0).toUpperCase()
                ) : (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                )}
              </div>
            </button>
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
            background: "#1e1b1e",
            border: "1px solid #d80d35",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 16px rgba(216,13,53,0.3)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          <span style={{ color: "#ffb3b2" }}>✓</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: "none", border: "none", color: "#e6bdbc", marginLeft: "10px", cursor: "pointer" }}
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
          /* Unauthenticated -> Prompt Admin Login */
          <main className="w-full pt-28 pb-16 px-4 flex justify-center items-center flex-grow">
            <div className="p-8 rounded-2xl w-full max-w-md bg-[#100d11] border border-white/[0.12] shadow-2xl">
              <div className="text-center mb-6">
                <span className="material-symbols-outlined text-[42px] text-[#ffb3b2]">admin_panel_settings</span>
                <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-white uppercase mt-2">
                  Admin Verification
                </h3>
                <p className="text-[#e6bdbc] text-xs mt-1">Sign in with administrative privileges to manage movies, venues, and schedules.</p>
              </div>

              {authError && <div className="alert alert-danger text-xs py-2 bg-red-950/60 border-red-800 text-red-200">{authError}</div>}

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#ad8887] font-['Space_Grotesk'] mb-1">Admin Email</label>
                  <input
                    type="email"
                    className="custom-input w-full"
                    value={authEmail}
                    required
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#ad8887] font-['Space_Grotesk'] mb-1">Password</label>
                  <input
                    type="password"
                    className="custom-input w-full"
                    value={authPassword}
                    required
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange w-full justify-center py-2.5 mt-2">
                  Sign In to Console
                </button>
              </form>
            </div>
          </main>
        ) : currentUser?.role !== "admin" ? (
          /* Authenticated as regular customer -> 403 Forbidden */
          <main className="w-full pt-28 pb-16 px-4 flex justify-center items-center flex-grow">
            <div className="p-8 rounded-2xl w-full max-w-lg text-center bg-[#100d11] border border-[#d80d35]/40 shadow-2xl">
              <span className="material-symbols-outlined text-[48px] text-[#d80d35]">block</span>
              <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-white uppercase mt-3 mb-2">
                403 Forbidden — Access Denied
              </h3>
              <p className="text-[#e6bdbc] text-sm">
                You are currently signed in as <strong>{currentUser.email}</strong> with standard customer privileges (
                <code>role: 'user'</code>).
              </p>
              <div className="bg-[#310713]/40 border border-[#d80d35]/30 text-[#ffb3b2] text-xs p-3 rounded-lg text-left my-4">
                ℹ <em>Administrative clearance is required to view platform metrics, manage theatrical schedules, and access customer bookings.</em>
              </div>
              <div className="flex justify-center gap-3 mt-4">
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
          /* Authorized Admin -> Render Management Console */
          <main className="w-full pt-24 pb-16 px-4 md:px-8 lg:px-16 flex-grow">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center pb-4 mb-6 border-b border-white/[0.08] gap-4">
              <div>
                <h2 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold text-white uppercase tracking-tight m-0">
                  IMovies Administration Console
                </h2>
                <span className="text-xs text-[#e6bdbc]">Real-time cinema scheduling, venue inventory, and booking records</span>
              </div>

              {/* Sub-nav Tabs */}
              <div className="flex gap-2 flex-wrap">
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
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase">System Performance & Key Indicators</h4>
                  <button className="stitch-btn-pill stitch-btn-pill-ghost text-xs py-1" onClick={loadAdminOverview}>
                    ↻ Refresh Telemetry
                  </button>
                </div>

                {overviewLoading || !adminOverview ? (
                  <div className="text-center py-12 text-[#e6bdbc]">Loading system metrics...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="admin-metric-card">
                      <span className="text-xs text-[#ad8887] uppercase tracking-wider font-['Space_Grotesk']">Gross Box Office</span>
                      <span className="admin-metric-value text-[#ffb3b2]">${adminOverview.totalRevenue?.toLocaleString() || "0"}</span>
                      <span className="text-[11px] text-emerald-400">Authorized Transactions</span>
                    </div>
                    <div className="admin-metric-card">
                      <span className="text-xs text-[#ad8887] uppercase tracking-wider font-['Space_Grotesk']">Total Bookings</span>
                      <span className="admin-metric-value">{adminOverview.totalBookings || 0}</span>
                      <span className="text-[11px] text-[#e6bdbc]">{adminOverview.confirmedBookings || 0} confirmed passes</span>
                    </div>
                    <div className="admin-metric-card">
                      <span className="text-xs text-[#ad8887] uppercase tracking-wider font-['Space_Grotesk']">Active Repertoire</span>
                      <span className="admin-metric-value">{adminOverview.totalMovies || 0}</span>
                      <span className="text-[11px] text-[#e6bdbc]">Curated Theatrical Releases</span>
                    </div>
                    <div className="admin-metric-card">
                      <span className="text-xs text-[#ad8887] uppercase tracking-wider font-['Space_Grotesk']">Venues & Halls</span>
                      <span className="admin-metric-value">{adminOverview.totalTheatres || 0}</span>
                      <span className="text-[11px] text-[#e6bdbc]">{adminOverview.totalScreens || 0} projection auditoriums</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MOVIE MANAGEMENT */}
            {adminTab === "movies" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase">Curated Catalog Management</h4>
                  <button className="stitch-btn-pill stitch-btn-pill-orange text-xs py-1.5" onClick={handleOpenAddMovie}>
                    + Add New Film
                  </button>
                </div>

                {adminMoviesLoading ? (
                  <div className="text-center py-12 text-[#e6bdbc]">Loading movies...</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl bg-[#100d11] border border-white/[0.08]">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Film Title</th>
                          <th>Genre</th>
                          <th>Runtime</th>
                          <th>Rating</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminMovies.map((m) => (
                          <tr key={m._id}>
                            <td className="font-bold text-white font-['Space_Grotesk']">{m.title}</td>
                            <td>{Array.isArray(m.genre) ? m.genre.join(", ") : m.genre}</td>
                            <td>{m.duration} mins</td>
                            <td><span className="px-1.5 py-0.5 rounded bg-[#221f23] text-xs font-mono">{m.rating}</span></td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.isActive !== false ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
                                {m.isActive !== false ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button className="stitch-btn-pill stitch-btn-pill-ghost text-xs py-1 px-2.5" onClick={() => handleOpenEditMovie(m)}>
                                  Edit
                                </button>
                                <button
                                  className={`stitch-btn-pill text-xs py-1 px-2.5 ${m.isActive !== false ? "bg-red-950/80 text-red-300 hover:bg-red-900" : "bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900"}`}
                                  onClick={() => handleToggleMovieActive(m)}
                                >
                                  {m.isActive !== false ? "Deactivate" : "Activate"}
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase">Architectural Salons</h4>
                    <button className="stitch-btn-pill stitch-btn-pill-orange text-xs py-1.5" onClick={handleOpenAddTheatre}>
                      + Add Venue
                    </button>
                  </div>
                  {theatresLoading ? (
                    <div className="text-center py-8 text-[#e6bdbc]">Loading theatres...</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl bg-[#100d11] border border-white/[0.08]">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Cinema Name</th>
                            <th>Metropolis</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminTheatres.map((t) => (
                            <tr key={t._id} className={selectedTheatreForScreens?._id === t._id ? "bg-white/[0.05]" : ""}>
                              <td className="font-bold text-white font-['Space_Grotesk']">{t.name}</td>
                              <td>{t.city}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.isActive !== false ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
                                  {t.isActive !== false ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <div className="flex gap-1.5">
                                  <button className="stitch-btn-pill stitch-btn-pill-ghost text-xs py-0.5 px-2" onClick={() => handleSelectTheatreForScreens(t)}>
                                    Screens
                                  </button>
                                  <button className="stitch-btn-pill stitch-btn-pill-ghost text-xs py-0.5 px-2" onClick={() => handleOpenEditTheatre(t)}>
                                    Edit
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

                <div className="lg:col-span-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase">
                      {selectedTheatreForScreens ? `${selectedTheatreForScreens.name} Screens` : "Auditorium Screens"}
                    </h4>
                    {selectedTheatreForScreens && (
                      <button className="stitch-btn-pill stitch-btn-pill-orange text-xs py-1.5" onClick={handleOpenAddScreen}>
                        + Add Screen
                      </button>
                    )}
                  </div>
                  {!selectedTheatreForScreens ? (
                    <div className="p-8 rounded-xl bg-[#100d11] border border-white/[0.08] text-center text-[#e6bdbc] text-sm">
                      Select a theatre from the left to inspect its auditorium layouts and seating matrices.
                    </div>
                  ) : screensList.length === 0 ? (
                    <div className="p-8 rounded-xl bg-[#100d11] border border-white/[0.08] text-center text-[#e6bdbc] text-sm">
                      No screens registered for this venue yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl bg-[#100d11] border border-white/[0.08]">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Screen</th>
                            <th>Format</th>
                            <th>Capacity</th>
                            <th>Layout</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {screensList.map((s) => (
                            <tr key={s._id}>
                              <td className="font-bold text-white font-['Space_Grotesk']">{s.name} (#{s.screenNumber})</td>
                              <td><span className="px-1.5 py-0.5 rounded bg-[#221f23] text-xs">{s.screenType}</span></td>
                              <td>{s.totalCapacity || s.seatLayout?.rows * s.seatLayout?.seatsPerRow || 80} seats</td>
                              <td className="text-xs text-[#ad8887]">{s.seatLayout?.rows}R × {s.seatLayout?.seatsPerRow}S</td>
                              <td>
                                <button className="stitch-btn-pill text-xs py-0.5 px-2 bg-red-950/80 text-red-300 hover:bg-red-900" onClick={() => handleDeleteScreen(s._id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SHOWTIMES */}
            {adminTab === "shows" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase">Theatrical Screening Schedule</h4>
                  <button className="stitch-btn-pill stitch-btn-pill-orange text-xs py-1.5" onClick={handleOpenAddShow}>
                    + Schedule Screening
                  </button>
                </div>

                {showsLoading ? (
                  <div className="text-center py-12 text-[#e6bdbc]">Loading showtimes...</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl bg-[#100d11] border border-white/[0.08]">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Movie</th>
                          <th>Venue & Screen</th>
                          <th>Screening Time</th>
                          <th>Pricing Tiers</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminShows.map((s) => (
                          <tr key={s._id}>
                            <td className="font-bold text-white font-['Space_Grotesk']">{s.movie?.title}</td>
                            <td>
                              <div>{s.theatre?.name}</div>
                              <span className="text-xs text-[#ad8887]">{s.screen?.name} ({s.screen?.screenType})</span>
                            </td>
                            <td>
                              <div>{new Date(s.startTime).toLocaleDateString()}</div>
                              <span className="text-xs text-[#ad8887]">
                                {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-1 flex-wrap">
                                {s.pricing?.map((p) => (
                                  <span key={p.tier} className="px-1.5 py-0.5 rounded bg-[#221f23] border border-white/[0.08] text-xs font-mono">
                                    {p.tier}: ${p.price}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === "scheduled" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
                                {s.status}
                              </span>
                            </td>
                            <td>
                              {s.status === "scheduled" && (
                                <button className="stitch-btn-pill text-xs py-1 px-2.5 bg-red-950/80 text-red-300 hover:bg-red-900" onClick={() => handleCancelShow(s._id)}>
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
                <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                  <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase m-0">Customer Reservation Manifests</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search ref or customer..."
                      className="custom-input text-xs py-1 px-2.5"
                      style={{ width: "200px" }}
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                    />
                    <select
                      className="custom-select text-xs py-1 px-2"
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
                  <div className="text-center py-12 text-[#e6bdbc]">Loading booking manifests...</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl bg-[#100d11] border border-white/[0.08]">
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
                            <td className="font-bold text-[#ffb3b2] font-mono">{b.bookingReference}</td>
                            <td>
                              <div className="text-white font-medium">{b.user?.name}</div>
                              <span className="text-xs text-[#ad8887]">{b.user?.email}</span>
                            </td>
                            <td>
                              <div className="text-white">{b.show?.movie?.title}</div>
                              <span className="text-xs text-[#ad8887]">{b.show?.theatre?.name}</span>
                            </td>
                            <td className="text-xs">
                              {b.show?.startTime ? new Date(b.show.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "N/A"}
                            </td>
                            <td>
                              {b.seats?.map((s) => (
                                <span key={s.seatNumber} className="px-1.5 py-0.5 rounded bg-[#310713] text-[#ffb3b2] text-xs font-mono mr-1">
                                  {s.seatNumber}
                                </span>
                              ))}
                            </td>
                            <td className="font-bold text-white font-mono">${b.totalAmount}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.bookingStatus === "confirmed" ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                                {b.bookingStatus}
                              </span>
                            </td>
                            <td>
                              {b.bookingStatus === "confirmed" && (
                                <button className="stitch-btn-pill text-xs py-1 px-2.5 bg-red-950/80 text-red-300 hover:bg-red-900" onClick={() => handleCancelBooking(b._id)}>
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

        activeShow ? (
          /* ----------------------------------------------------------------- */
          /* STITCH: SEAT SELECTION & HOLD TIMER (CRIMSON EDITORIAL)          */
          /* ----------------------------------------------------------------- */
          <main className="w-full pt-20 bg-surface min-h-screen flex flex-col">
            <div className="relative w-full overflow-hidden">
              {/* Atmospheric Glows */}
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-[#d80d35]/20 rounded-full blur-[140px] pointer-events-none" />
              <div className="absolute top-96 -left-32 w-80 h-80 bg-[#c23768]/15 rounded-full blur-[110px] pointer-events-none" />

              {/* Live Reservation Header Ribbon */}
              <div className="w-full bg-[#100d11] px-4 md:px-8 lg:px-16 py-3 border-b border-white/[0.08]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-['Space_Grotesk'] text-[#ffb3b2] tracking-widest uppercase mb-1">
                      <span>Live Hall Session</span>
                      <span>•</span>
                      <span>{new Date(activeShow.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Today</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#221f23] text-white">
                        {activeShow.screen?.screenType || "Laser IMAX 70mm"}
                      </span>
                      <span className={`realtime-badge ${socketConnected ? "realtime-badge-connected" : "realtime-badge-polling"}`}>
                        {socketConnected ? "● Live Availability" : "● Live Availability (Syncing)"}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-['Space_Grotesk'] font-bold text-white uppercase tracking-tight m-0">
                      {activeShow.movie?.title}
                    </h2>
                    <span className="text-xs text-[#e6bdbc]">
                      {activeShow.theatre?.name} ({activeShow.theatre?.city}) · {activeShow.screen?.name || `Auditorium 01`}
                    </span>
                  </div>

                  {/* Hold Timer Ribbon & Quick Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {activeHold && (
                      <div className="hold-countdown-banner flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="badge bg-[#f59e0b] text-black font-bold px-2 py-1 text-xs font-mono">
                            ⏱ {Math.floor((activeHold.remainingSeconds || 0) / 60)}:
                            {String((activeHold.remainingSeconds || 0) % 60).padStart(2, "0")} REMAINING
                          </span>
                          <span className="text-xs text-[#ffb3b2] font-semibold hidden sm:inline">
                            Seats {selectedSeats.join(", ")} locked in session
                          </span>
                        </div>
                        <button
                          type="button"
                          className="stitch-btn-pill stitch-btn-pill-ghost py-1 px-2.5 text-xs inline-flex items-center gap-1"
                          onClick={handleReleaseHold}
                        >
                          <span className="material-symbols-outlined text-[14px]">lock_open</span>
                          <span>Release Hold</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      className="stitch-btn-pill stitch-btn-pill-secondary py-1.5 px-3 text-xs"
                      onClick={closeSeatSelection}
                    >
                      ← Back to Films
                    </button>
                  </div>
                </div>
              </div>

              {/* Seating Layout Error / Loading */}
              {showLoading && (
                <div className="text-center py-16">
                  <div className="spinner-border text-danger" role="status" />
                  <p className="text-[#e6bdbc] text-sm mt-3 font-['Space_Grotesk']">Loading spatial auditorium matrix...</p>
                </div>
              )}

              {showError && <div className="alert alert-danger mx-4 md:mx-16 mt-4">{showError}</div>}
              {holdError && <div className="alert alert-warning mx-4 md:mx-16 mt-4">{holdError}</div>}

              {/* Main Spatial Layout: Seating Matrix (8 cols) & Checkout Ledger Dock (4 cols) */}
              {!showLoading && !showError && (
                <div className="w-full px-4 md:px-8 lg:px-16 py-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left/Center Stage: Screen Curved Arc & Auditorium Grid (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col items-center bg-[#100d11] rounded-2xl p-6 md:p-8 shadow-2xl border border-white/[0.08] relative">
                      {/* Cinema Curved Laser Screen Visualization */}
                      <div className="screen-visual w-full max-w-3xl flex flex-col items-center mb-8 pt-2 relative">
                        <div className="screen-halo-glow" />
                        <svg className="w-full h-16 max-w-2xl text-primary overflow-visible" fill="none" viewBox="0 0 600 60" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="screenGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                              <stop offset="0%" stopColor="#373438" stopOpacity="0.2" />
                              <stop offset="25%" stopColor="#D80D35" stopOpacity="0.8" />
                              <stop offset="50%" stopColor="#FFB3B2" stopOpacity="1" />
                              <stop offset="75%" stopColor="#D80D35" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#373438" stopOpacity="0.2" />
                            </linearGradient>
                            <linearGradient id="beamFill" x1="50%" x2="50%" y1="0%" y2="100%">
                              <stop offset="0%" stopColor="#D80D35" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="#D80D35" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 40 18 Q 300 48 560 18 L 590 60 L 10 60 Z" fill="url(#beamFill)" />
                          <path d="M 40 18 Q 300 48 560 18" stroke="url(#screenGrad)" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                        <span className="font-label-caps text-[#ad8887] tracking-[0.25em] uppercase text-[10px] mt-1 font-mono">
                          SCREEN 01 // DUAL 4K LASER PROJECTION (1.43:1 RATIO)
                        </span>
                      </div>

                      {/* Seating Grid */}
                      <div className="seat-grid w-full mb-8">
                        {Object.entries(groupSeatsByRow(activeShow.seats || [])).map(([row, seats]) => (
                          <div key={row} className="seat-row flex items-center gap-2 justify-center">
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

                              return (
                                <button
                                  key={seat.seatNumber}
                                  type="button"
                                  className={`seat-btn ${statusClass}`}
                                  disabled={isBooked || isHeldByOther || (Boolean(activeHold) && !isHeldByMe)}
                                  onClick={() => handleSeatClick(seat)}
                                  title={`${seat.seatNumber} (${seat.tier?.toUpperCase() || "STANDARD"}) - $${seat.price}`}
                                >
                                  {seat.seatNumber}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Seating Legend & Status Dictionary */}
                      <div className="w-full flex items-center justify-center gap-4 flex-wrap text-xs text-[#e6bdbc] border-t border-white/[0.08] pt-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#221f23] border border-white/[0.12]" />
                          <span>Standard</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#d80d35]/20 border border-[#d80d35]/60" />
                          <span>Premium (Row F)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#1e2a38] border border-sky-400" />
                          <span>VIP Lounger</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#d80d35] shadow-[0_0_8px_rgba(216,13,53,0.8)]" />
                          <span className="text-[#ffb3b2] font-semibold">Selected (You)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#b45309]" />
                          <span>Held by You</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#2a1f18] border border-[#78350f]" />
                          <span>On Hold (Others)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#181518]" />
                          <span>Booked</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Booking Summary & Realtime Checkout Dock (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                      {/* High Demand Realtime Notice Box */}
                      <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] flex items-start gap-3 shadow-md">
                        <span className="material-symbols-outlined text-[#ffb3b2] text-[22px] shrink-0 mt-0.5">local_fire_department</span>
                        <div className="flex flex-col">
                          <span className="font-['Space_Grotesk'] text-xs font-bold text-[#ffb3b2] uppercase tracking-wider">
                            High Demand Territory
                          </span>
                          <p className="text-xs text-[#e6bdbc] mt-0.5 leading-relaxed">
                            Seats in <span className="text-white font-semibold">Row F</span> are currently being inspected by{" "}
                            <span className="text-[#ffb3b2] font-semibold">8 other guests</span> in real-time.
                          </p>
                        </div>
                      </div>

                      {/* Movie Snapshot & Specifications */}
                      <div className="p-6 rounded-2xl bg-[#100d11] border border-white/[0.08] shadow-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-24 rounded-lg bg-cover bg-center shrink-0 shadow-md border border-white/[0.1]"
                            style={{
                              backgroundImage: `url('${activeShow.movie?.posterImage || CURATED_POSTERS[0]}')`,
                            }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-wider font-bold">
                              {Array.isArray(activeShow.movie?.genre) ? activeShow.movie?.genre.join(" / ") : activeShow.movie?.genre || "SCI-FI"} // {activeShow.movie?.duration || 168} MIN
                            </span>
                            <h3 className="font-['Space_Grotesk'] text-base uppercase text-white font-bold truncate mt-0.5">
                              {activeShow.movie?.title}
                            </h3>
                            <span className="text-xs text-[#e6bdbc]">Screening: Today at {new Date(activeShow.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="px-1.5 py-0.5 rounded bg-[#221f23] text-[9px] font-mono text-white">
                                {activeShow.screen?.screenType || "IMAX 3D"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#221f23] text-[9px] font-mono text-white">
                                70MM OPTICAL
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Screening Details Pill Strip */}
                        <div className="grid grid-cols-2 gap-2 text-left">
                          <div className="p-2.5 rounded-lg bg-[#221f23] border border-white/[0.05]">
                            <span className="text-[9px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Auditorium</span>
                            <span className="text-xs text-white font-semibold">{activeShow.screen?.name || "Laser Hall 01"}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#221f23] border border-white/[0.05]">
                            <span className="text-[9px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Audio Mix</span>
                            <span className="text-xs text-white font-semibold">Atmos 128-Track</span>
                          </div>
                        </div>

                        {/* Selected Seats Registry */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
                          <div className="flex items-center justify-between">
                            <span className="font-['Space_Grotesk'] text-xs uppercase text-[#e6bdbc] tracking-wider font-bold">
                              Reserved Seats ({selectedSeats.length})
                            </span>
                            {activeHold && (
                              <span className="text-[10px] text-[#ffb3b2] font-mono uppercase tracking-widest">
                                Hold Active
                              </span>
                            )}
                          </div>

                          {selectedSeatObjects.length === 0 ? (
                            <div className="text-xs text-[#ad8887] py-2 text-center italic">
                              Select seats from the auditorium matrix to proceed.
                            </div>
                          ) : (
                            selectedSeatObjects.map((s) => (
                              <div key={s.seatNumber} className="flex items-center justify-between p-2 rounded-lg bg-[#221f23] border border-white/[0.05]">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-[#d80d35] text-white flex items-center justify-center font-['Space_Grotesk'] text-[10px] font-bold">
                                    {s.seatNumber}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-white font-semibold">Seat {s.seatNumber}</span>
                                    <span className="text-[9px] text-[#ad8887] uppercase font-mono">
                                      {s.tier === "vip" ? "VIP Recliner" : s.seatNumber.startsWith("F") ? "Sweet Spot Center" : "Standard Spatial"}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-white font-bold font-mono">${s.price || 18}</span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Transparent Financial Ledger */}
                        <div className="flex flex-col gap-1.5 pt-3 border-t border-white/[0.08] text-xs text-[#e6bdbc]">
                          <div className="flex justify-between">
                            <span>Tickets Subtotal ({selectedSeats.length} seats)</span>
                            <span className="text-white font-mono">${calculatedTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Direct Audio & Processing Fee</span>
                            <span className="text-white font-mono">${(selectedSeats.length > 0 ? 2.50 : 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>City Entertainment & Cultural Tax</span>
                            <span className="text-white font-mono">${(calculatedTotal * 0.08).toFixed(2)}</span>
                          </div>

                          {/* Total Amount Callout */}
                          <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/[0.08]">
                            <div>
                              <span className="text-[10px] text-[#ad8887] uppercase font-['Space_Grotesk'] tracking-wider block">
                                Total Amount
                              </span>
                              <span className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
                                ${(calculatedTotal + (selectedSeats.length > 0 ? 2.50 : 0) + (calculatedTotal * 0.08)).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 font-['Space_Grotesk'] text-[10px] uppercase font-bold">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              Price Locked
                            </div>
                          </div>
                        </div>

                        {/* Primary Checkout Action */}
                        <button
                          type="button"
                          className="stitch-btn-pill stitch-btn-pill-orange w-full py-3 justify-center text-sm tracking-wider"
                          disabled={selectedSeats.length === 0 || holdLoading}
                          onClick={handleProceedToReview}
                        >
                          {holdLoading
                            ? "Locking Seats..."
                            : activeHold
                            ? `Proceed to Review (${selectedSeats.length})`
                            : `Hold Seats & Review (${selectedSeats.length})`}
                        </button>

                        <div className="flex items-center justify-center gap-1.5 text-center text-[#ad8887]">
                          <span className="material-symbols-outlined text-[13px]">security</span>
                          <span className="text-[9px] uppercase tracking-wider font-['Space_Grotesk']">
                            Instant encrypted ticketing • 100% refund guarantee 2hr prior
                          </span>
                        </div>
                      </div>

                      {/* Soundstage Specs Card */}
                      <div className="p-4 rounded-xl bg-[#100d11] border border-white/[0.08] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#ffb3b2] text-[22px]">spatial_audio</span>
                          <div className="flex flex-col">
                            <span className="text-xs text-white font-semibold">Row F Sound Optimization</span>
                            <span className="text-[9px] text-[#ad8887] uppercase font-mono">Exact acoustic node sweetspot</span>
                          </div>
                        </div>
                        <span className="font-['Space_Grotesk'] text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                          Grade A+
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        ) : activeTab === "movies" ? (

          /* ----------------------------------------------------------------- */
          /* STITCH: THE FILM INDEX - MOVIE CATALOGUE                         */
          /* ----------------------------------------------------------------- */
          <main className="w-full pt-20 bg-surface min-h-screen">
            <div className="flex flex-col w-full">
              {/* Radial Aura Background Glows */}
              <div className="relative w-full overflow-hidden">
                <div className="absolute -top-40 right-10 w-[600px] h-[600px] rounded-full bg-[#d80d35]/20 blur-[130px] pointer-events-none" />
                <div className="absolute top-[35%] -left-32 w-[520px] h-[520px] rounded-full bg-[#e30140]/15 blur-[150px] pointer-events-none" />

                {/* Page Header: Editorial Title & Global Metrics Strip */}
                <div className="w-full px-4 md:px-8 lg:px-16 pt-10 pb-8 border-b border-white/[0.08]">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ffb3b2] animate-pulse" />
                        <span className="font-['Space_Grotesk'] text-xs text-[#ffb3b2] uppercase tracking-[0.25em]">
                          [CATALOGUE NO. 02] // WINTER SEASON REPERTOIRE
                        </span>
                      </div>
                      <h1 className="font-['Space_Grotesk'] text-4xl md:text-6xl font-bold uppercase tracking-tight text-white m-0">
                        THE FILM <span className="text-[#ffb3b2] italic">INDEX.</span>
                      </h1>
                      <p className="text-sm text-[#e6bdbc] max-w-2xl leading-relaxed">
                        Curated cinematic releases, archival retrospectives, and 70mm special engagements projected across our architectural salons.
                      </p>
                    </div>

                    {/* Metric Quick Counter Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#100d11] border border-white/[0.08]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#ad8887] uppercase font-['Space_Grotesk']">Archived Vault</span>
                        <span className="font-['Space_Grotesk'] text-xl font-bold text-white">342 TITLES</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#ad8887] uppercase font-['Space_Grotesk']">Active Engagements</span>
                        <span className="font-['Space_Grotesk'] text-xl font-bold text-[#ffb3b2]">18 LIVE</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#ad8887] uppercase font-['Space_Grotesk']">Format Integrity</span>
                        <span className="font-['Space_Grotesk'] text-xl font-bold text-white">100% 70MM</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#ad8887] uppercase font-['Space_Grotesk']">Projection Calibre</span>
                        <span className="font-['Space_Grotesk'] text-xl font-bold text-white">4K / 8K RESTORE</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col gap-4 pt-6">
                    <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                      {/* Search Input Box */}
                      <div className="relative w-full lg:w-96">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#ad8887] text-[18px]">search</span>
                        <input
                          type="text"
                          placeholder="Search movies by title..."
                          className="custom-input w-full pl-10 pr-4 py-2"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button
                            className="absolute right-3 top-2.5 text-[#ad8887] hover:text-white"
                            onClick={() => setSearchTerm("")}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filter Selects */}
                      <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
                        <select
                          className="custom-select"
                          value={selectedGenre}
                          onChange={(e) => setSelectedGenre(e.target.value)}
                        >
                          <option value="All">Genre: All Genres</option>
                          {GENRES.filter((g) => g !== "All").map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>

                        <select
                          className="custom-select"
                          value={selectedScreenType}
                          onChange={(e) => setSelectedScreenType(e.target.value)}
                        >
                          <option value="All Formats">Format: All Formats</option>
                          <option value="IMAX">IMAX 70mm</option>
                          <option value="Dolby Cinema">Dolby Vision / Atmos</option>
                          <option value="4DX">4DX Motion</option>
                        </select>

                        <select
                          className="custom-select"
                          value={selectedRating}
                          onChange={(e) => setSelectedRating(e.target.value)}
                        >
                          <option value="All">Rating: All Age Ratings</option>
                          {RATINGS.filter((r) => r !== "All").map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Genre Quick Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {GENRES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`px-3 py-1 rounded-full text-xs font-['Space_Grotesk'] uppercase tracking-wider transition-all whitespace-nowrap ${
                            selectedGenre === g
                              ? "bg-[#d80d35] text-white font-bold shadow-[0_0_12px_rgba(216,13,53,0.4)]"
                              : "bg-[#221f23] text-[#e6bdbc] hover:bg-[#2c292d] hover:text-white"
                          }`}
                          onClick={() => setSelectedGenre(g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>

                    {/* Results Counter */}
                    <div className="flex items-center justify-between text-xs text-[#ad8887] font-['Space_Grotesk'] pt-1">
                      <span>Showing {movies.length} of 342 Titles — Chronologically Indexed</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> All Archival Prints 100% Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Film Grid */}
                <div className="w-full px-4 md:px-8 lg:px-16 py-8">
                  {catalogLoading ? (
                    <div className="text-center py-20">
                      <div className="spinner-border text-danger" role="status" />
                      <p className="text-[#e6bdbc] text-sm mt-3 font-['Space_Grotesk']">Loading architectural catalog...</p>
                    </div>
                  ) : catalogError ? (
                    <div className="alert alert-danger my-8">{catalogError}</div>
                  ) : movies.length === 0 ? (
                    <div className="p-12 text-center bg-[#100d11] rounded-2xl border border-white/[0.08] my-8">
                      <span className="material-symbols-outlined text-[48px] text-[#ad8887]">movie_filter</span>
                      <h4 className="font-['Space_Grotesk'] text-xl font-bold text-white uppercase mt-2">No Archival Prints Found</h4>
                      <p className="text-[#e6bdbc] text-xs mt-1">Try resetting your search filters or selecting 'All' genres.</p>
                      <button
                        className="stitch-btn-pill stitch-btn-pill-orange text-xs mt-4"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedGenre("All");
                          setSelectedRating("All");
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {movies.map((movie, idx) => {
                        const posterUrl = movie.posterImage || CURATED_POSTERS[idx % CURATED_POSTERS.length];
                        const formatTag = idx % 2 === 0 ? "IMAX 70MM" : "DOLBY VISION";
                        const score = 95 + (idx % 5);

                        return (
                          <article
                            key={movie._id}
                            className="movie-card group flex flex-col bg-[#100d11] rounded-xl overflow-hidden hover:shadow-[0_0_36px_rgba(216,13,53,0.35)] transition-all duration-500 border border-white/[0.08]"
                          >
                            {/* Poster Stage */}
                            <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#221f23] movie-poster-stage">
                              {posterUrl ? (
                                <img
                                  src={posterUrl}
                                  alt={movie.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                              ) : (
                                <ProceduralPoster
                                  title={movie.title}
                                  genre={Array.isArray(movie.genre) ? movie.genre[0] : movie.genre}
                                  format={formatTag}
                                  index={idx}
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#100d11] via-[#100d11]/30 to-transparent pointer-events-none" />

                              {/* Badges */}
                              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                                <span className="px-2 py-0.5 rounded bg-[#100d11]/90 backdrop-blur-md font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] font-bold uppercase tracking-wider">
                                  {formatTag}
                                </span>
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#310713]/90 backdrop-blur-md text-[#ffb3b2]">
                                  <span className="material-symbols-outlined text-[13px]">star</span>
                                  <span className="font-['Space_Grotesk'] text-xs font-bold">{score}%</span>
                                </div>
                              </div>

                              {/* Quick Showtime Preview Tray (Slide up on hover) */}
                              <div className="quick-showtimes-tray">
                                <div className="flex items-center justify-between">
                                  <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-widest font-bold">
                                    Today's Screenings
                                  </span>
                                  <span className="text-[10px] text-[#e6bdbc] font-mono">Salon 01</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {["14:30", "18:00", "21:45"].map((time) => (
                                    <div
                                      key={time}
                                      role="button"
                                      tabIndex={0}
                                      className="quick-showtime-btn cursor-pointer text-center"
                                      onClick={() => openMovieDetails(movie)}
                                    >
                                      {time}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Movie Content */}
                            <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[#e6bdbc] font-['Space_Grotesk'] text-[10px] tracking-wider uppercase">
                                  <span>{Array.isArray(movie.genre) ? movie.genre.join(" / ") : movie.genre || "SCI-FI"}</span>
                                  <span>•</span>
                                  <span>{movie.duration || 120} MIN</span>
                                  <span>•</span>
                                  <span className="px-1 py-0.2 rounded bg-[#2c292d] text-white text-[9px] font-mono">{movie.rating || "PG-13"}</span>
                                </div>

                                <h5 className="font-['Space_Grotesk'] text-base uppercase text-white font-bold tracking-tight group-hover:text-[#ffb3b2] transition-colors m-0 leading-tight">
                                  {movie.title}
                                </h5>

                                <p className="text-xs text-[#e6bdbc] line-clamp-2 m-0 mt-1 leading-relaxed">
                                  {movie.description || "In an architectural masterpiece of projection, experience humanity's unmapped frontiers across 70mm celluloid."}
                                </p>
                              </div>

                              {/* Action CTAs */}
                              <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="flex-1 py-2 px-3 text-center rounded-lg bg-[#d80d35] hover:bg-[#f0143f] text-white font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_16px_rgba(216,13,53,0.35)]"
                                    onClick={() => openMovieDetails(movie)}
                                  >
                                    Book Tickets
                                  </button>
                                  <button
                                    type="button"
                                    className="p-2 rounded-lg bg-[#2c292d] hover:bg-[#373438] text-white transition-colors flex items-center justify-center"
                                    onClick={() => openMovieDetails(movie)}
                                    title="View Details"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">info</span>
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-[#ad8887] font-['Space_Grotesk'] text-[9px] tracking-widest pt-0.5">
                                  <span>ENG / JPN SUB</span>
                                  <span className="text-[#ffb3b2]">ARCHIVAL MASTER 4K</span>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {/* Restricted Vault Screenings Banner */}
                  <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-[#310713] via-[#100d11] to-[#1f050c] border border-white/[0.08] relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-[0.25em] font-bold block">
                        [ RESTRICTED VAULT SCREENINGS ]
                      </span>
                      <h3 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold uppercase text-white m-0">
                        THE TARKOVSKY & KUBRICK 70MM REPRINTS
                      </h3>
                      <p className="text-xs text-[#e6bdbc] leading-relaxed">
                        Exclusively remastered from original camera negatives. Strictly limited to 3 screenings per salon with direct audio fidelity.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        className="stitch-btn-pill stitch-btn-pill-orange text-xs py-2.5 px-5"
                        onClick={() => showToast("Vault access requested. Invitations dispatched via email.")}
                      >
                        Request Private Access
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* ----------------------------------------------------------------- */
          /* STITCH: MOVIE DISCOVERY SHOWCASE (HOME SCREEN)                    */
          /* ----------------------------------------------------------------- */
          <main className="w-full pt-20 bg-surface min-h-screen text-on-surface">
            {/* HERO SHOWCASE SECTION */}
            <section className="relative w-full overflow-hidden bg-[#100d11] stitch-hero">
              <div className="hero-aura-1" />
              <div className="hero-aura-2" />

              <div className="w-full px-4 md:px-8 lg:px-16 pt-8 pb-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 flex flex-col">
                    {/* Eyebrow */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-[#d80d35] animate-pulse" />
                      <span className="font-['Space_Grotesk'] text-xs uppercase tracking-[0.25em] text-[#ffb3b2] font-bold">
                        {currentHero.tag}
                      </span>
                    </div>

                    {/* Headline */}
                    <h1 className="hero-title">
                      {currentHero.headlinePart1}{" "}
                      <span className="title-accent">{currentHero.headlinePart2}</span>
                    </h1>

                    {/* Meta Row */}
                    <div className="hero-meta-row">
                      <span className="hero-tag">{currentHero.rating}</span>
                      <span className="hero-tag">{currentHero.genreText}</span>
                      <span className="hero-tag">{currentHero.durationText}</span>
                      <span className="hero-rating-tag">{currentHero.scoreText}</span>
                      <span className="hero-tag" style={{ borderColor: "rgba(216,13,53,0.4)", color: "#ffb3b2" }}>
                        {currentHero.audioTag}
                      </span>
                      <span className="hero-tag" style={{ borderColor: "rgba(56,189,248,0.4)", color: "#7dd3fc" }}>
                        {currentHero.visualTag}
                      </span>
                    </div>

                    {/* Synopsis */}
                    <p className="hero-synopsis">{currentHero.synopsis}</p>

                    {/* CTAs */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        type="button"
                        className="stitch-btn-pill stitch-btn-pill-orange py-3 px-6 text-sm"
                        onClick={() => handleHeroBookAction(currentHero)}
                      >
                        <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                        <span>BOOK TICKETS</span>
                      </button>

                      <button
                        type="button"
                        className="stitch-btn-pill stitch-btn-pill-ghost py-3 px-6 text-sm"
                        onClick={() => {
                          const matched = movies[0];
                          if (matched) openMovieDetails(matched);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">play_circle</span>
                        <span>EXPERIENCE TEASER (2:14)</span>
                      </button>
                    </div>

                    {/* Pager Indicator (01 / 04) */}
                    <div className="flex items-center gap-4 mt-8 pt-4 border-t border-white/[0.08]">
                      <span className="font-['Space_Grotesk'] text-xs font-mono text-[#ffb3b2] tracking-widest font-bold">
                        0{heroIndex + 1} / 0{FEATURED_HEROES.length}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 rounded bg-[#221f23] border border-white/[0.08] flex items-center justify-center text-white hover:bg-[#2c292d]"
                          onClick={() => setHeroIndex((prev) => (prev > 0 ? prev - 1 : FEATURED_HEROES.length - 1))}
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded bg-[#221f23] border border-white/[0.08] flex items-center justify-center text-white hover:bg-[#2c292d]"
                          onClick={() => setHeroIndex((prev) => (prev < FEATURED_HEROES.length - 1 ? prev + 1 : 0))}
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Up Next Card Preview (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col justify-end">
                    <div className="p-6 rounded-2xl bg-[#100d11]/90 backdrop-blur-xl border border-white/[0.1] shadow-2xl flex flex-col gap-3">
                      <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-[0.2em] font-bold">
                        {currentHero.upNextFormat}
                      </span>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-20 rounded bg-cover bg-center shrink-0 border border-white/[0.1]"
                          style={{
                            backgroundImage: `url('${FEATURED_HEROES[(heroIndex + 1) % FEATURED_HEROES.length].posterImage}')`,
                          }}
                        />
                        <div className="flex flex-col">
                          <h4 className="font-['Space_Grotesk'] text-base uppercase text-white font-bold m-0">
                            {currentHero.upNextTitle}
                          </h4>
                          <span className="text-xs text-[#e6bdbc] mt-1">{currentHero.upNextSub}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* BRUTALIST THEATRICAL MANIFESTO BANNER */}
            <section id="manifesto" className="manifesto-section w-full px-4 md:px-8 lg:px-16">
              <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
                <span className="font-['Space_Grotesk'] text-xs text-[#ffb3b2] uppercase tracking-[0.3em] font-bold">
                  [ ARCHITECTURAL PROJECTION MANIFESTO ]
                </span>
                <h2 className="manifesto-title">
                  NOT JUST A MOVIE. AN ENTIRE <span className="highlight">EXPERIENCE</span> THAT LEAVES A LASTING IMPRESSION.
                </h2>
              </div>

              {/* 3 Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
                <div className="metric-card">
                  <span className="metric-number">75+</span>
                  <span className="metric-label">Screenings Daily</span>
                  <p className="metric-desc">Curated across four flagship architectural soundstages with dual 4K laser projection.</p>
                </div>
                <div className="metric-card">
                  <span className="metric-number text-[#ffb3b2]">98%</span>
                  <span className="metric-label">Audiophile Score</span>
                  <p className="metric-desc">Custom acoustic engineering with 128 discrete Dolby Atmos tracks and zero resonance.</p>
                </div>
                <div className="metric-card">
                  <span className="metric-number">14K</span>
                  <span className="metric-label">Lumens Peak Power</span>
                  <p className="metric-desc">Dual laser xenon replacement delivering infinite contrast and true optical deep blacks.</p>
                </div>
              </div>
            </section>

            {/* NOW SHOWING SECTION */}
            <section id="showtimes" className="w-full px-4 md:px-8 lg:px-16 py-16 bg-[#151216]">
              {/* Section Header & Category Filters */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <span className="font-['Space_Grotesk'] text-xs text-[#ffb3b2] tracking-[0.25em] uppercase font-bold">
                    [ THE SELECTION ]
                  </span>
                  <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold uppercase text-white tracking-tight m-0">
                    NOW SHOWING.
                  </h2>
                  <p className="text-xs text-[#e6bdbc]">Live scheduled showtimes across Tokyo, Berlin, New York and London salons.</p>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {FORMAT_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`px-3 py-1.5 rounded-full text-xs font-['Space_Grotesk'] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        activeCuratorFilter === tab
                          ? "bg-[#d80d35] text-white shadow-[0_0_12px_rgba(216,13,53,0.4)]"
                          : "bg-[#221f23] text-[#e6bdbc] hover:bg-[#2c292d] hover:text-white"
                      }`}
                      onClick={() => setActiveCuratorFilter(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Filter Inputs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <div className="relative flex-grow w-full">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#ad8887] text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Search movies by title..."
                    className="custom-input w-full pl-10 pr-4 py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-3 top-2.5 text-[#ad8887] hover:text-white"
                      onClick={() => setSearchTerm("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  className="custom-select w-full sm:w-auto"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  <option value="All">All Genres</option>
                  {GENRES.filter((g) => g !== "All").map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Movie Cards Grid */}
              {catalogLoading ? (
                <div className="text-center py-16">
                  <div className="spinner-border text-danger" role="status" />
                  <p className="text-[#e6bdbc] text-sm mt-3 font-['Space_Grotesk']">Loading cinema engagements...</p>
                </div>
              ) : movies.length === 0 ? (
                <div className="p-12 text-center bg-[#100d11] rounded-2xl border border-white/[0.08]">
                  <p className="text-[#e6bdbc] text-sm font-['Space_Grotesk']">No movies currently match the selected criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {movies.slice(0, 8).map((movie, idx) => {
                    const posterUrl = movie.posterImage || CURATED_POSTERS[idx % CURATED_POSTERS.length];
                    const formatTag = idx % 2 === 0 ? "IMAX 70MM" : "DOLBY VISION";
                    const score = 95 + (idx % 5);

                    return (
                      <article
                        key={movie._id}
                        className="movie-card group flex flex-col bg-[#100d11] rounded-xl overflow-hidden hover:shadow-[0_0_36px_rgba(216,13,53,0.35)] transition-all duration-500 border border-white/[0.08]"
                      >
                        {/* Poster Stage */}
                        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#221f23] movie-poster-stage">
                          {posterUrl ? (
                            <img
                              src={posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <ProceduralPoster
                              title={movie.title}
                              genre={Array.isArray(movie.genre) ? movie.genre[0] : movie.genre}
                              format={formatTag}
                              index={idx}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#100d11] via-[#100d11]/30 to-transparent pointer-events-none" />

                          {/* Badges */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                            <span className="px-2 py-0.5 rounded bg-[#100d11]/90 backdrop-blur-md font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] font-bold uppercase tracking-wider">
                              {formatTag}
                            </span>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#310713]/90 backdrop-blur-md text-[#ffb3b2]">
                              <span className="material-symbols-outlined text-[13px]">star</span>
                              <span className="font-['Space_Grotesk'] text-xs font-bold">{score}%</span>
                            </div>
                          </div>

                          {/* Quick Showtime Preview Tray */}
                          <div className="quick-showtimes-tray">
                            <div className="flex items-center justify-between">
                              <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-widest font-bold">
                                Today's Screenings
                              </span>
                              <span className="text-[10px] text-[#e6bdbc] font-mono">Salon 01</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {["14:30", "18:00", "21:45"].map((time) => (
                                <div
                                  key={time}
                                  role="button"
                                  tabIndex={0}
                                  className="quick-showtime-btn cursor-pointer text-center"
                                  onClick={() => openMovieDetails(movie)}
                                >
                                  {time}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[#e6bdbc] font-['Space_Grotesk'] text-[10px] tracking-wider uppercase">
                              <span>{Array.isArray(movie.genre) ? movie.genre.join(" / ") : movie.genre || "SCI-FI"}</span>
                              <span>•</span>
                              <span>{movie.duration || 120} MIN</span>
                              <span>•</span>
                              <span className="px-1 py-0.2 rounded bg-[#2c292d] text-white text-[9px] font-mono">{movie.rating || "PG-13"}</span>
                            </div>

                            <h5 className="font-['Space_Grotesk'] text-base uppercase text-white font-bold tracking-tight group-hover:text-[#ffb3b2] transition-colors m-0 leading-tight">
                              {movie.title}
                            </h5>

                            <p className="text-xs text-[#e6bdbc] line-clamp-2 m-0 mt-1 leading-relaxed">
                              {movie.description || "In an architectural masterpiece of projection, experience humanity's unmapped frontiers across 70mm celluloid."}
                            </p>
                          </div>

                          {/* Dual Action CTAs */}
                          <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="flex-1 py-2 px-3 text-center rounded-lg bg-[#d80d35] hover:bg-[#f0143f] text-white font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_16px_rgba(216,13,53,0.35)]"
                                onClick={() => openMovieDetails(movie)}
                              >
                                Book Tickets
                              </button>
                              <button
                                type="button"
                                className="p-2 rounded-lg bg-[#2c292d] hover:bg-[#373438] text-white transition-colors flex items-center justify-center"
                                onClick={() => openMovieDetails(movie)}
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-[18px]">info</span>
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[#ad8887] font-['Space_Grotesk'] text-[9px] tracking-widest pt-0.5">
                              <span>ENG / JPN SUB</span>
                              <span className="text-[#ffb3b2]">ARCHIVAL MASTER 4K</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Curated Weekend Passports Banner */}
              <div className="mt-12 p-6 rounded-2xl bg-[#1e1b1e] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffb3b2] text-[28px]">local_activity</span>
                  <div>
                    <h4 className="font-['Space_Grotesk'] text-base uppercase text-white font-bold m-0">Curated Weekend Passports</h4>
                    <p className="text-xs text-[#e6bdbc] m-0 mt-0.5">Access three archival 70mm screenings with priority seat allocation and private salon admittance.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="stitch-btn-pill stitch-btn-pill-ghost text-xs whitespace-nowrap"
                  onClick={() => setMembershipModalOpen(true)}
                >
                  Explore Passports →
                </button>
              </div>
            </section>

            {/* THE NEXT CHAPTER PREVIEWS SECTION */}
            <section id="the-next-chapter" className="w-full px-4 md:px-8 lg:px-16 py-16 bg-[#100d11] relative overflow-hidden border-t border-white/[0.08]">
              <div className="absolute bottom-0 right-10 w-[550px] h-[550px] bg-[#d80d35]/10 rounded-full blur-[140px] pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="font-['Space_Grotesk'] text-xs text-[#ffb3b2] tracking-[0.25em] uppercase font-bold block mb-1">
                    [ PREVIEWS & RETROSPECTIVES ]
                  </span>
                  <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold uppercase text-white tracking-tight m-0">
                    THE NEXT CHAPTER.
                  </h2>
                </div>
                <button
                  type="button"
                  className="text-xs font-['Space_Grotesk'] text-[#ffb3b2] uppercase tracking-wider font-bold hover:underline"
                  onClick={() => {
                    setActiveTab("movies");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  View Full Repertoire Calendar →
                </button>
              </div>

              {/* Asymmetric 12-col Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Large Featured Premiere (7 cols) */}
                <div className="lg:col-span-7 rounded-2xl bg-[#1e1b1e] border border-white/[0.08] overflow-hidden p-6 md:p-8 flex flex-col justify-between relative shadow-xl min-h-[360px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBAzRnhtT2H_pNEkFfUYjUxxVoAyLm5zt0mnJEtkN3DMxcLZEq7PsEe5iCQnne668aj2HTj3E2m3GQHCG2CiPcVFTSYf-4jpCcZ-Maqz-Jd6Z3oHxMtaC9Jk3UhevzSKjEFgjmFvTBpvT7SFIuePxUeNYnOgszHhGLNcJNP13tdNMRQcJPIKdoeplKTbqaN6rLAUEgQCfBztoKlHHntsG905vrE-6aIicndooO0ss7O')`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#100d11] via-[#100d11]/70 to-transparent" />

                  <div className="relative z-10 space-y-2">
                    <span className="px-2.5 py-1 rounded bg-[#d80d35] font-['Space_Grotesk'] text-[10px] text-white font-bold uppercase tracking-wider">
                      WORLD PREMIERE 70MM
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-2xl md:text-4xl font-bold uppercase text-white mt-2">
                      SUB-ORBITAL 2099
                    </h3>
                    <p className="text-xs text-[#e6bdbc] max-w-lg leading-relaxed">
                      Captured exclusively on ultra-large 65mm celluloid cameras, this orbital saga charts humanity's desperate evacuation toward Kepler-452b.
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      className="stitch-btn-pill stitch-btn-pill-orange text-xs py-2 px-4"
                      onClick={() => showToast("Subscribed! Presale access will be emailed 48 hours prior.")}
                    >
                      Notify Presale
                    </button>
                    <span className="text-xs text-[#ad8887] font-['Space_Grotesk']">Tickets on sale in 14 days</span>
                  </div>
                </div>

                {/* Stacked Upcoming Cards (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="p-6 rounded-2xl bg-[#1e1b1e] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-['Space_Grotesk'] text-[#ffb3b2] font-bold uppercase tracking-wider">
                        SYMPHONY ACOUSTIC HALL
                      </span>
                      <h4 className="font-['Space_Grotesk'] text-xl uppercase font-bold text-white mt-1">
                        The Grand Requiem
                      </h4>
                      <p className="text-xs text-[#e6bdbc] mt-1 leading-relaxed">
                        An orchestral live scoring accompaniment to classic silent horror cinema.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.08]">
                      <span className="text-xs text-[#ad8887] font-mono">Starts Nov 15</span>
                      <button
                        type="button"
                        className="stitch-btn-pill stitch-btn-pill-ghost text-xs py-1 px-3"
                        onClick={() => showToast("Added to your wishlist.")}
                      >
                        Reserve Pass
                      </button>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#1e1b1e] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-['Space_Grotesk'] text-[#ffb3b2] font-bold uppercase tracking-wider">
                        35MM ARCHIVAL VAULT
                      </span>
                      <h4 className="font-['Space_Grotesk'] text-xl uppercase font-bold text-white mt-1">
                        Monolith In Absentia
                      </h4>
                      <p className="text-xs text-[#e6bdbc] mt-1 leading-relaxed">
                        Original European director's cut projection with restored chemical color timing.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.08]">
                      <span className="text-xs text-[#ad8887] font-mono">Starts Dec 01</span>
                      <button
                        type="button"
                        className="stitch-btn-pill stitch-btn-pill-ghost text-xs py-1 px-3"
                        onClick={() => showToast("Added to your wishlist.")}
                      >
                        Reserve Pass
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ARCHITECTURAL CINEMA LOCATOR SECTION */}
            <section id="cinemas" className="w-full px-4 md:px-8 lg:px-16 py-16 bg-[#151216] border-t border-white/[0.08]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: Locator & Metropolis Selector */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <span className="font-['Space_Grotesk'] text-xs text-[#ffb3b2] tracking-[0.25em] uppercase font-bold block mb-1">
                      [ PROJECTION SALONS ]
                    </span>
                    <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold uppercase text-white tracking-tight m-0">
                      FIND YOUR CINEMA.
                    </h2>
                    <p className="text-xs text-[#e6bdbc] mt-2 leading-relaxed max-w-lg">
                      Architectural spaces engineered for acoustic purity, custom projection acoustics, and uncompromised seating sightlines.
                    </p>
                  </div>

                  {/* Metropolis Selection Tabs */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {["TOKYO", "BERLIN", "NEW YORK", "LONDON"].map((city) => (
                      <button
                        key={city}
                        type="button"
                        className={`px-4 py-2 rounded-lg font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider transition-all ${
                          selectedMetropolis === city
                            ? "bg-[#d80d35] text-white shadow-[0_0_16px_rgba(216,13,53,0.35)]"
                            : "bg-[#221f23] text-[#e6bdbc] hover:bg-[#2c292d] hover:text-white"
                        }`}
                        onClick={() => setSelectedMetropolis(city)}
                      >
                        {city}
                      </button>
                    ))}
                  </div>

                  {/* Flagship Salon Spec Sheet */}
                  <div className="p-6 rounded-2xl bg-[#100d11] border border-white/[0.08] shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase">
                        Salon Alpha // {selectedMetropolis === "TOKYO" ? "Shibuya District" : selectedMetropolis === "BERLIN" ? "Mitte Pavilion" : selectedMetropolis === "NEW YORK" ? "Hudson Yards" : "Soho Hall"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase font-['Space_Grotesk']">
                        Open Now
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-[#221f23]">
                        <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Screen Ratio</span>
                        <span className="font-bold text-white">IMAX GT 1.43:1</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#221f23]">
                        <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Acoustic Mix</span>
                        <span className="font-bold text-white">Dolby Atmos 128-Track</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#221f23]">
                        <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Projection</span>
                        <span className="font-bold text-white">Dual 4K Laser + 70mm</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#221f23]">
                        <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Amenities</span>
                        <span className="font-bold text-white">Crimson Lounge Bar</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Map Preview Card */}
                <div className="lg:col-span-6">
                  <div className="p-6 rounded-2xl bg-[#100d11] border border-white/[0.08] shadow-2xl relative overflow-hidden flex flex-col gap-4">
                    <div
                      className="w-full aspect-[16/9] rounded-xl bg-cover bg-center border border-white/[0.1] relative"
                      style={{
                        backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCBCsbP6vMHcx5KyHYZKhGDCzaSz50lAbR0W2PUqVZphINCc4TqfTWCMejgWm1aejUFYlcFiQbixvWTlEKd3bszpf0PJo4BABtHg_Y7BIMGLWxO9aVH-7IoGW6wwWKwqWuyKcs4ZnuxYJePHwfUiabpKV1w4j-xdwBnAOy_Wo9T3QiuvvxLefwMr9SyKH6q0lZcIIAq1mo0gwqS0a_VjtTG2qyy8sYvURSAIjHuASkV')`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-[#100d11] via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                        <span className="font-['Space_Grotesk'] font-bold">
                          {selectedMetropolis} Flagship Salon
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#d80d35] font-['Space_Grotesk'] text-[10px] font-bold">
                          Directions
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#e6bdbc]">
                      <span>Open daily 10:00 — 02:00</span>
                      <button
                        type="button"
                        className="text-[#ffb3b2] font-['Space_Grotesk'] uppercase tracking-wider font-bold hover:underline"
                        onClick={() => setCinemasModalOpen(true)}
                      >
                        View Full Salon Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PATRON PRIVILEGES MEMBERSHIP BANNER */}
            <section className="w-full px-4 md:px-8 lg:px-16 py-16 bg-[#100d11]">
              <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#310713] via-[#100d11] to-[#1f050c] border border-white/[0.1] relative overflow-hidden shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                  <span className="font-['Space_Grotesk'] text-xs text-[#ffb3b2] uppercase tracking-[0.25em] font-bold block">
                    [ ARCHITECTURAL PATRON GUILD ]
                  </span>
                  <h3 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold uppercase text-white tracking-tight m-0">
                    MAKE EVERY <span className="text-[#ffb3b2] italic">FRAME</span> COUNT. ZERO COMPROMISE CINEMA.
                  </h3>
                  <p className="text-xs text-[#e6bdbc] leading-relaxed">
                    Elevate your cinematic ritual. Unlock invitation-only midnight screenings, free recliner upgrades at select auditoriums, and zero booking surcharges.
                  </p>

                  <div className="flex items-center gap-4 flex-wrap pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-white font-['Space_Grotesk'] font-semibold">
                      <span className="text-emerald-400">✓</span> 0% Booking Fees
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white font-['Space_Grotesk'] font-semibold">
                      <span className="text-emerald-400">✓</span> 10-Min Seat Lock Guarantee
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white font-['Space_Grotesk'] font-semibold">
                      <span className="text-emerald-400">✓</span> Center-Sight Guarantee
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#100d11]/80 backdrop-blur-xl border border-white/[0.12] flex flex-col gap-4 text-center shrink-0 w-full lg:w-72">
                  <span className="font-['Space_Grotesk'] text-xs text-[#ad8887] uppercase tracking-wider font-bold">
                    Become an Architectural Patron
                  </span>
                  <div className="font-['Space_Grotesk'] text-3xl font-bold text-white">
                    $180 <span className="text-xs text-[#ad8887] font-normal">/ YEAR</span>
                  </div>
                  <button
                    type="button"
                    className="stitch-btn-pill stitch-btn-pill-orange justify-center py-2.5 text-xs"
                    onClick={() => setMembershipModalOpen(true)}
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </section>

            {/* BRUTALIST ARCHITECTURAL FOOTER */}
            <footer className="w-full bg-[#080609] border-t border-white/[0.08] px-4 md:px-8 lg:px-16 py-12 text-[#e6bdbc] text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-white/[0.08]">
                {/* Col 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb3b2] text-[20px]">theaters</span>
                    <span className="font-['Space_Grotesk'] text-base font-bold text-white uppercase tracking-wider">
                      IMOVIES
                    </span>
                  </div>
                  <p className="text-[#ad8887] leading-relaxed text-[11px]">
                    The premier digital cinema destination. Immerse yourself in ultimate projection fidelity, precision soundstages, and reserved heavy seating.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#ffb3b2]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>ALL SYSTEMS OPERATIONAL</span>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-2">
                  <span className="font-['Space_Grotesk'] text-xs font-bold text-white uppercase tracking-wider block mb-2">
                    Cinemas & Screens
                  </span>
                  <ul className="space-y-1.5 list-none p-0 m-0">
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>Tokyo Flagship // Shibuya GT</a></li>
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>Berlin Mitte // 70mm Vault</a></li>
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>New York // Hudson Pavilion</a></li>
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]" onClick={(e) => { e.preventDefault(); setCinemasModalOpen(true); }}>London // Soho Architectural</a></li>
                  </ul>
                </div>

                {/* Col 3 */}
                <div className="space-y-2">
                  <span className="font-['Space_Grotesk'] text-xs font-bold text-white uppercase tracking-wider block mb-2">
                    Experience & Terms
                  </span>
                  <ul className="space-y-1.5 list-none p-0 m-0">
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]">Ticket Reservation Terms</a></li>
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]">Digital Pass Guidelines</a></li>
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]">Privacy & License Policy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors text-decoration-none text-[#e6bdbc]">Accessibility Services</a></li>
                  </ul>
                </div>

                {/* Col 4 */}
                <div className="space-y-2">
                  <span className="font-['Space_Grotesk'] text-xs font-bold text-white uppercase tracking-wider block mb-2">
                    Architecture & Tech
                  </span>
                  <div className="p-3 rounded-lg bg-[#100d11] border border-white/[0.08] space-y-2">
                    <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-wider font-bold block">
                      STK // React + Vite + Express + Mongo
                    </span>
                    <span className="text-[10px] text-[#ad8887] block leading-tight">
                      Real-time Socket.IO synchronization, 5-minute atomic holds, educational sandbox mode.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Copyright Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[10px] text-[#ad8887] font-['Space_Grotesk']">
                <span>© 2026 IMovies Cinema Experience. All rights reserved.</span>
                <span>Simulation Mode Online — Educational showcase and demo sandbox environment.</span>
              </div>
            </footer>
          </main>
        )
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: MOVIE DETAILS & SHOWTIME SCHEDULER (STOREFRONT)              */}
      {/* ------------------------------------------------------------------- */}
      {selectedMovie && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-2xl">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#ffb3b2] font-['Space_Grotesk'] uppercase tracking-wider font-bold">
                    <span>{Array.isArray(selectedMovie.genre) ? selectedMovie.genre.join(" / ") : selectedMovie.genre || "SCI-FI"}</span>
                    <span>•</span>
                    <span>{selectedMovie.duration || 120} MINS</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#221f23] text-white font-mono text-[10px]">{selectedMovie.rating || "PG-13"}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-['Space_Grotesk'] font-bold text-white uppercase tracking-tight m-0">
                    {selectedMovie.title}
                  </h3>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#221f23] text-[#e6bdbc] hover:text-white flex items-center justify-center border border-white/[0.08]"
                  onClick={closeDetails}
                >
                  ✕
                </button>
              </div>

              <p className="text-xs md:text-sm text-[#e6bdbc] leading-relaxed m-0">
                {selectedMovie.description || "A breathtaking theatrical voyage projected on archival large-format celluloid with discrete immersive sound engineering."}
              </p>

              {/* Scheduled Showtimes */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <h4 className="font-['Space_Grotesk'] text-sm font-bold uppercase text-white tracking-wider m-0">
                  Available Scheduled Screenings
                </h4>

                {detailsLoading ? (
                  <div className="text-center py-6 text-xs text-[#e6bdbc]">Loading scheduled sessions...</div>
                ) : detailsError ? (
                  <div className="alert alert-danger text-xs">{detailsError}</div>
                ) : movieShows.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] text-xs text-[#e6bdbc] text-center">
                    No public screenings scheduled for today. Check back soon or select another film.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {movieShows.map((s) => (
                      <div
                        key={s._id}
                        className="p-3 rounded-xl bg-[#1e1b1e] border border-white/[0.08] flex items-center justify-between gap-4"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white font-semibold font-['Space_Grotesk']">
                            {s.theatre?.name} ({s.theatre?.city}) · {s.screen?.name || `Screen ${s.screen?.screenNumber}`}
                          </span>
                          <span className="text-[11px] text-[#ffb3b2] font-mono">
                            {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Today • {s.screen?.screenType || "IMAX Laser"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="stitch-btn-pill stitch-btn-pill-orange text-xs py-1.5 px-3 choose-seats-btn"
                          onClick={() => startSeatSelection(s._id)}
                        >
                          Choose Seats →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: RESERVATION VERIFICATION / BOOKING REVIEW                    */}
      {/* ------------------------------------------------------------------- */}
      {reviewModalOpen && activeShow && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              {/* Stepper Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ffb3b2] animate-ping" />
                    <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] tracking-widest uppercase font-bold">
                      STAGE 02 / 03 — TRANSACTION DISPATCH
                    </span>
                  </div>
                  <h2 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold uppercase text-white tracking-tight m-0">
                    RESERVATION <span className="text-[#ffb3b2] italic">VERIFICATION</span>
                  </h2>
                  <p className="text-xs text-[#e6bdbc] m-0">
                    Review Booking Details — Audit your spatial allotment and secure authorized tickets.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600/40 text-amber-300 text-xs font-mono font-bold">
                    ⏱ {Math.floor((activeHold?.remainingSeconds || 0) / 60)}:
                    {String((activeHold?.remainingSeconds || 0) % 60).padStart(2, "0")} REMAINING
                  </span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-[#221f23] text-[#e6bdbc] hover:text-white flex items-center justify-center border border-white/[0.08]"
                    onClick={() => setReviewModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Simulation Mode Notice */}
              <div className="p-3 rounded-xl bg-[#310713]/60 border border-[#d80d35]/40 text-xs text-[#ffb3b2] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>
                  <strong>Simulation Mode:</strong> Educational sandbox environment. No actual payment card will be charged.
                </span>
              </div>

              {bookingError && <div className="alert alert-danger text-xs">{bookingError}</div>}

              {/* Two Column Summary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Manifest and Price Ledger (7 cols) */}
                <div className="md:col-span-7 flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] space-y-2">
                    <span className="text-[10px] text-[#ad8887] uppercase font-['Space_Grotesk'] font-bold block">
                      Film & Session Summary
                    </span>
                    <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase m-0">
                      {activeShow.movie?.title}
                    </h4>
                    <div className="text-xs text-[#e6bdbc] space-y-0.5">
                      <div>Venue: {activeShow.theatre?.name} ({activeShow.theatre?.city})</div>
                      <div>Hall: {activeShow.screen?.name || "Auditorium 01"} ({activeShow.screen?.screenType || "IMAX Laser"})</div>
                      <div>Time: {new Date(activeShow.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div>
                      <div className="text-[#ffb3b2] font-semibold mt-1">
                        Seats: {selectedSeats.join(", ")} ({selectedSeats.length} seats)
                      </div>
                    </div>
                  </div>

                  {/* Financial Ledger Breakdown */}
                  <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] space-y-2 text-xs text-[#e6bdbc]">
                    <div className="flex justify-between">
                      <span>Admission Subtotal ({selectedSeats.length} seats)</span>
                      <span className="text-white font-mono">${calculatedTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audio Engineering Surcharge</span>
                      <span className="text-white font-mono">${(selectedSeats.length > 0 ? 2.50 : 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>City Tax & Facility Surcharge</span>
                      <span className="text-white font-mono">${(calculatedTotal * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/[0.08] font-bold text-white text-sm">
                      <span>Total Amount Due</span>
                      <span className="text-[#ffb3b2] font-mono">
                        ${(calculatedTotal + (selectedSeats.length > 0 ? 2.50 : 0) + (calculatedTotal * 0.08)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Digital Pass Admittance Preview (5 cols) */}
                <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] text-center gap-4">
                  <div>
                    <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-widest font-bold block mb-1">
                      DIGITAL PASS PREVIEW
                    </span>
                    <h5 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase m-0">
                      {activeShow.movie?.title}
                    </h5>
                    <span className="text-[10px] text-[#ad8887] block mt-0.5">
                      {activeShow.theatre?.name}
                    </span>
                  </div>

                  {/* Generated QR Code Preview */}
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="25" height="25" fill="#151216" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="#d80d35" />
                      <rect x="65" y="10" width="25" height="25" fill="#151216" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="#d80d35" />
                      <rect x="10" y="65" width="25" height="25" fill="#151216" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="#d80d35" />
                      <rect x="42" y="15" width="8" height="12" fill="#151216" />
                      <rect x="45" y="35" width="14" height="8" fill="#151216" />
                      <rect x="65" y="45" width="10" height="10" fill="#151216" />
                      <rect x="40" y="65" width="16" height="8" fill="#151216" />
                      <rect x="65" y="70" width="20" height="10" fill="#151216" />
                    </svg>
                  </div>

                  <div className="font-mono text-[10px] text-[#ad8887] tracking-widest uppercase">
                    IMV-{selectedSeats.join("")}-PASS
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  className="stitch-btn-pill stitch-btn-pill-ghost text-xs"
                  onClick={() => setReviewModalOpen(false)}
                >
                  Adjust Seats
                </button>
                <button
                  type="button"
                  className="stitch-btn-pill stitch-btn-pill-orange text-xs py-2.5 px-6 font-bold"
                  disabled={bookingLoading}
                  onClick={handleConfirmBooking}
                >
                  {bookingLoading ? "Processing Booking..." : "Confirm & Book Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: CONFIRMED BOOKING / DIGITAL PASS                             */}
      {/* ------------------------------------------------------------------- */}
      {confirmedBooking && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-lg">
            <div className="p-6 md:p-8 flex flex-col gap-6 text-center">
              <div>
                <span className="material-symbols-outlined text-[48px] text-emerald-400">check_circle</span>
                <h3 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white mt-2">
                  Booking Confirmed!
                </h3>
                <p className="text-xs text-[#e6bdbc] mt-1">
                  Your reservation is confirmed. Your digital boarding pass has been registered in the salon manifest.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="p-6 rounded-2xl bg-[#1e1b1e] border border-white/[0.08] shadow-2xl flex flex-col gap-4 text-left">
                <div className="flex justify-between items-start pb-3 border-b border-white/[0.08]">
                  <div>
                    <span className="font-['Space_Grotesk'] text-[10px] text-[#ffb3b2] uppercase tracking-wider font-bold block">
                      ADMITTANCE PASS
                    </span>
                    <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase m-0">
                      {confirmedBooking.show?.movie?.title}
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#ffb3b2] bg-[#310713] px-2 py-1 rounded">
                    {confirmedBooking.bookingReference}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#e6bdbc]">
                  <div>
                    <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Auditorium</span>
                    <span className="font-semibold text-white">{confirmedBooking.show?.screen?.name || "Laser Hall 01"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Seats Allocated</span>
                    <span className="font-semibold text-[#ffb3b2] font-mono">
                      {confirmedBooking.seats?.map((s) => s.seatNumber).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Screening Time</span>
                    <span className="font-semibold text-white">
                      {new Date(confirmedBooking.show?.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#ad8887] uppercase block font-['Space_Grotesk']">Total Paid</span>
                    <span className="font-semibold text-white font-mono">${confirmedBooking.totalAmount}</span>
                  </div>
                </div>

                {/* QR Code Barcode Representation */}
                <div className="p-3 rounded-xl bg-white text-black flex flex-col items-center gap-2 mt-2">
                  <div className="w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="25" height="25" fill="#151216" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="#d80d35" />
                      <rect x="65" y="10" width="25" height="25" fill="#151216" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="#d80d35" />
                      <rect x="10" y="65" width="25" height="25" fill="#151216" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="#d80d35" />
                      <rect x="42" y="15" width="8" height="12" fill="#151216" />
                      <rect x="45" y="35" width="14" height="8" fill="#151216" />
                      <rect x="65" y="45" width="10" height="10" fill="#151216" />
                      <rect x="40" y="65" width="16" height="8" fill="#151216" />
                      <rect x="65" y="70" width="20" height="10" fill="#151216" />
                    </svg>
                  </div>
                  <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-700">
                    {confirmedBooking.bookingReference}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className="stitch-btn-pill stitch-btn-pill-orange text-xs py-2.5 px-6 font-bold"
                  onClick={() => {
                    setConfirmedBooking(null);
                    openMyBookings();
                  }}
                >
                  View in My Bookings →
                </button>
                <button
                  type="button"
                  className="stitch-btn-pill stitch-btn-pill-ghost text-xs"
                  onClick={() => setConfirmedBooking(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* DRAWER / MODAL: MY BOOKINGS                                         */}
      {/* ------------------------------------------------------------------- */}
      {myBookingsOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold uppercase text-white m-0">
                    My Bookings
                  </h3>
                  <span className="text-xs text-[#e6bdbc]">Past and upcoming cinema reservations</span>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#221f23] text-[#e6bdbc] hover:text-white flex items-center justify-center border border-white/[0.08] btn-close-white"
                  onClick={() => setMyBookingsOpen(false)}
                >
                  ✕
                </button>
              </div>

              {myBookingsLoading ? (
                <div className="text-center py-12 text-xs text-[#e6bdbc]">Loading booking history...</div>
              ) : myBookings.length === 0 ? (
                <div className="p-8 text-center bg-[#1e1b1e] rounded-xl text-xs text-[#e6bdbc]">
                  No reservation records found for this account.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myBookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#ffb3b2]">{b.bookingReference}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${b.bookingStatus === "confirmed" ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                            {b.bookingStatus}
                          </span>
                        </div>
                        <h5 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase m-0">
                          {b.show?.movie?.title}
                        </h5>
                        <div className="text-xs text-[#ad8887]">
                          {b.show?.theatre?.name} · Seats: {b.seats?.map((s) => s.seatNumber).join(", ")}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">${b.totalAmount}</span>
                        {b.bookingStatus === "confirmed" && (
                          <button
                            type="button"
                            className="stitch-btn-pill text-xs py-1 px-3 bg-red-950/80 text-red-300 hover:bg-red-900 border-red-800"
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
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: CINEMAS EXPLORER                                             */}
      {/* ------------------------------------------------------------------- */}
      {cinemasModalOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-2xl">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <h3 className="font-['Space_Grotesk'] text-xl font-bold uppercase text-white m-0">
                  Global Projection Salons
                </h3>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#221f23] text-[#e6bdbc] hover:text-white flex items-center justify-center border border-white/[0.08]"
                  onClick={() => setCinemasModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] space-y-1">
                  <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase m-0">Tokyo Flagship // Shibuya GT</h4>
                  <p className="text-xs text-[#e6bdbc] m-0">Dual 4K Laser 1.43:1, 128-Track Atmos, Crimson Lounge.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] space-y-1">
                  <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase m-0">Berlin Mitte // 70mm Vault</h4>
                  <p className="text-xs text-[#e6bdbc] m-0">Chemical 70mm optical transport, zero resonance acoustics.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] space-y-1">
                  <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase m-0">New York // Hudson Pavilion</h4>
                  <p className="text-xs text-[#e6bdbc] m-0">Dolby Cinema flagship, motorized ergonomic recliners.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1e1b1e] border border-white/[0.08] space-y-1">
                  <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase m-0">London // Soho Architectural</h4>
                  <p className="text-xs text-[#e6bdbc] m-0">Intimate 60-seat salon with curated 35mm revival repertoire.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: PREMIERE PASS MEMBERSHIP                                     */}
      {/* ------------------------------------------------------------------- */}
      {membershipModalOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-lg text-center">
            <div className="p-8 flex flex-col gap-6">
              <div>
                <span className="material-symbols-outlined text-[48px] text-[#ffb3b2]">loyalty</span>
                <h3 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white mt-2">
                  Architectural Patron Guild
                </h3>
                <p className="text-xs text-[#e6bdbc] mt-1">
                  Join the guild for 0% booking fees, guaranteed center-sight seating, and 10-minute cart holds.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#1e1b1e] border border-white/[0.08] text-center space-y-3">
                <span className="font-['Space_Grotesk'] text-xs text-[#ad8887] uppercase font-bold">Annual Membership</span>
                <div className="font-['Space_Grotesk'] text-4xl font-bold text-white">
                  $180 <span className="text-xs text-[#ad8887] font-normal">/ YEAR</span>
                </div>
                <ul className="text-xs text-[#e6bdbc] text-left space-y-2 list-none p-0 m-0 pt-2 border-t border-white/[0.08]">
                  <li>✓ 0% transaction & direct audio surcharges</li>
                  <li>✓ 10-minute exclusive seat lock duration</li>
                  <li>✓ Automatic Sweet Spot Row F allocation</li>
                  <li>✓ Invitations to director Q&As and 70mm vault prints</li>
                </ul>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className="stitch-btn-pill stitch-btn-pill-orange text-xs py-2.5 px-6"
                  onClick={() => {
                    setMembershipModalOpen(false);
                    showToast("Patron Guild membership successfully registered!");
                  }}
                >
                  Confirm Enrollment
                </button>
                <button
                  type="button"
                  className="stitch-btn-pill stitch-btn-pill-ghost text-xs"
                  onClick={() => setMembershipModalOpen(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: QUICK AUTHENTICATION                                         */}
      {/* ------------------------------------------------------------------- */}
      {authModalOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-md">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <div className="flex gap-4">
                  <div
                    role="button"
                    tabIndex={0}
                    className={`font-['Space_Grotesk'] text-sm uppercase font-bold tracking-wider pb-1 cursor-pointer ${authMode === "login" ? "text-[#ffb3b2] border-b-2 border-[#d80d35]" : "text-[#ad8887]"}`}
                    onClick={() => setAuthMode("login")}
                  >
                    Sign In
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`font-['Space_Grotesk'] text-sm uppercase font-bold tracking-wider pb-1 cursor-pointer ${authMode === "register" ? "text-[#ffb3b2] border-b-2 border-[#d80d35]" : "text-[#ad8887]"}`}
                    onClick={() => setAuthMode("register")}
                  >
                    Register
                  </div>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#221f23] text-[#e6bdbc] hover:text-white flex items-center justify-center border border-white/[0.08]"
                  onClick={() => setAuthModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              {authError && <div className="alert alert-danger text-xs py-2 bg-red-950/60 border-red-800 text-red-200">{authError}</div>}

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {authMode === "register" && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#ad8887] font-['Space_Grotesk'] mb-1">Your Full Name</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={authName}
                      required
                      onChange={(e) => setAuthName(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#ad8887] font-['Space_Grotesk'] mb-1">Email Address</label>
                  <input
                    type="email"
                    className="custom-input w-full"
                    value={authEmail}
                    required
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#ad8887] font-['Space_Grotesk'] mb-1">Password</label>
                  <input
                    type="password"
                    className="custom-input w-full"
                    value={authPassword}
                    required
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange w-full justify-center py-2.5 mt-2">
                  {authMode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* ADMIN MODAL: ADD / EDIT MOVIE                                       */}
      {/* ------------------------------------------------------------------- */}
      {movieModalOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-lg">
            <div className="p-6 md:p-8 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase m-0">
                  {editingMovie ? "Edit Film Details" : "Register New Film"}
                </h4>
                <button type="button" className="text-[#e6bdbc]" onClick={() => setMovieModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveMovie} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Title</label>
                  <input
                    type="text"
                    className="custom-input w-full"
                    value={movieForm.title}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Description</label>
                  <textarea
                    className="custom-input w-full h-20"
                    value={movieForm.description}
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={movieForm.duration}
                      required
                      onChange={(e) => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Age Rating</label>
                    <select
                      className="custom-select w-full"
                      value={movieForm.rating}
                      onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                    >
                      {RATINGS.filter((r) => r !== "All").map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange justify-center py-2 mt-2">
                  Save Film
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* ADMIN MODAL: ADD / EDIT THEATRE                                     */}
      {/* ------------------------------------------------------------------- */}
      {theatreModalOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-lg">
            <div className="p-6 md:p-8 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase m-0">
                  {editingTheatre ? "Edit Theatre" : "Add New Theatre"}
                </h4>
                <button type="button" className="text-[#e6bdbc]" onClick={() => setTheatreModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveTheatre} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Venue Name</label>
                  <input
                    type="text"
                    className="custom-input w-full"
                    value={theatreForm.name}
                    required
                    onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Metropolis / City</label>
                  <input
                    type="text"
                    className="custom-input w-full"
                    value={theatreForm.city}
                    required
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Address</label>
                  <input
                    type="text"
                    className="custom-input w-full"
                    value={theatreForm.address}
                    onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                  />
                </div>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange justify-center py-2 mt-2">
                  Save Theatre
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* ADMIN MODAL: ADD SCREEN                                             */}
      {/* ------------------------------------------------------------------- */}
      {screenModalOpen && selectedTheatreForScreens && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-md">
            <div className="p-6 md:p-8 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase m-0">
                  Add Screen Layout
                </h4>
                <button type="button" className="text-[#e6bdbc]" onClick={() => setScreenModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveScreen} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Screen Name</label>
                  <input
                    type="text"
                    className="custom-input w-full"
                    value={screenForm.name}
                    required
                    onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Screen #</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={screenForm.screenNumber}
                      required
                      onChange={(e) => setScreenForm({ ...screenForm, screenNumber: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Screen Type</label>
                    <select
                      className="custom-select w-full"
                      value={screenForm.screenType}
                      onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                    >
                      <option value="IMAX">IMAX 70mm</option>
                      <option value="Dolby Cinema">Dolby Cinema</option>
                      <option value="3D">RealD 3D</option>
                      <option value="2D">Standard 2D</option>
                      <option value="4DX">4DX Motion</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Rows (Letters A-Z)</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={screenForm.rows}
                      min="1"
                      max="15"
                      required
                      onChange={(e) => setScreenForm({ ...screenForm, rows: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Seats Per Row</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={screenForm.seatsPerRow}
                      min="1"
                      max="20"
                      required
                      onChange={(e) => setScreenForm({ ...screenForm, seatsPerRow: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange justify-center py-2 mt-2">
                  Create Screen Layout
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* ADMIN MODAL: ADD SHOWTIME                                           */}
      {/* ------------------------------------------------------------------- */}
      {showModalOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom max-w-lg">
            <div className="p-6 md:p-8 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase m-0">
                  Schedule Screening
                </h4>
                <button type="button" className="text-[#e6bdbc]" onClick={() => setShowModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveShow} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Movie</label>
                  <select
                    className="custom-select w-full"
                    value={showForm.movieId}
                    required
                    onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  >
                    {adminMovies.map((m) => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Theatre</label>
                    <select
                      className="custom-select w-full"
                      value={showForm.theatreId}
                      required
                      onChange={(e) => handleShowTheatreChange(e.target.value)}
                    >
                      {adminTheatres.map((t) => (
                        <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Screen</label>
                    <select
                      className="custom-select w-full"
                      value={showForm.screenId}
                      required
                      onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                    >
                      {theatreScreensForShow.map((s) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.screenType})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[#ad8887] uppercase mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="custom-input w-full"
                    value={showForm.startTime}
                    required
                    onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Std Price</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={showForm.standardPrice}
                      required
                      onChange={(e) => setShowForm({ ...showForm, standardPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">Prem Price</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={showForm.premiumPrice}
                      required
                      onChange={(e) => setShowForm({ ...showForm, premiumPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[#ad8887] uppercase mb-1">VIP Price</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={showForm.vipPrice}
                      required
                      onChange={(e) => setShowForm({ ...showForm, vipPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button type="submit" className="stitch-btn-pill stitch-btn-pill-orange justify-center py-2 mt-2">
                  Schedule Screening
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
