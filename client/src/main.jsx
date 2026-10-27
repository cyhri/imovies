import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import { fetchMovies, fetchMovieById, fetchShows } from "./services/api.js";

const GENRES = ["All", "Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller"];
const RATINGS = ["All", "G", "PG", "PG-13", "R", "NC-17", "U", "UA", "A"];

function App() {
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

  // Load detailed movie info & showtimes when a movie is selected
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

  return (
    <div className="app">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark border-bottom border-secondary px-4 py-3 sticky-top bg-black">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <a className="navbar-brand fw-bold fs-3 text-white text-decoration-none" href="/">
            IMOVIES<span className="accent">.</span>
          </a>
          <span className="text-secondary small fw-semibold d-none d-md-inline">
            CINEMA TICKETING & SCHEDULE PLATFORM
          </span>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => loadMovies()}
            title="Refresh movie catalog"
          >
            Refresh
          </button>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="hero container text-center">
        <p className="accent fw-bold text-uppercase tracking-wider small mb-2">
          Real-time cinema discovery
        </p>
        <h1 className="display-4 fw-black">
          EXPLORE MOVIES.
          <br />
          <span className="accent">DISCOVER SHOWTIMES.</span>
        </h1>
        <p className="lead text-secondary mt-3 mx-auto" style={{ maxWidth: "600px" }}>
          Browse current theatrical releases, discover venues in your city, and check showtimes.
        </p>
      </header>

      {/* Catalog & Filter Bar */}
      <section className="container mb-5">
        <div className="p-3 rounded-3 mb-4" style={{ background: "#14141e", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-5">
              <input
                type="text"
                className="form-control custom-input"
                placeholder="Search movies by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Genre Filter */}
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

            {/* Rating Filter */}
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

            {/* Sort Order */}
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

        {/* Status / Loading / Error Views */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading movies...</span>
            </div>
            <p className="text-secondary mt-3">Connecting to movie catalog...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
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
            <p className="text-secondary">
              Try adjusting your search query, genre selection, or rating filter.
            </p>
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

        {/* Movies Grid */}
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

      {/* Movie Details & Showtimes Modal */}
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
              <button
                className="btn btn-sm btn-outline-secondary text-white"
                onClick={closeDetails}
                aria-label="Close"
              >
                âœ•
              </button>
            </div>

            {detailsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-danger spinner-border-sm" role="status" />
                <p className="text-secondary small mt-2">Loading movie details & showtimes...</p>
              </div>
            ) : detailsError ? (
              <div className="alert alert-warning small">{detailsError}</div>
            ) : (
              <div>
                <p className="text-light" style={{ lineHeight: "1.6" }}>
                  {movieDetails?.description || selectedMovie.description}
                </p>

                <div className="mb-4">
                  {(movieDetails?.genres || selectedMovie.genres || []).map((g) => (
                    <span key={g} className="genre-badge">
                      {g}
                    </span>
                  ))}
                </div>

                <h5 className="fw-bold text-white border-bottom border-secondary pb-2 mb-3">
                  Upcoming Showtimes
                </h5>

                {movieShows.length === 0 ? (
                  <p className="text-secondary small">
                    No active screenings currently scheduled for this release. Check back soon.
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

                      return (
                        <div key={show._id} className="showtime-pill">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <strong className="text-white">
                                {show.theatre?.name || "Cinema"}
                              </strong>
                              <span className="text-secondary small ms-2">
                                ({show.theatre?.city || "Local"})
                              </span>
                              <div className="text-secondary small">
                                {show.screen?.name || `Screen ${show.screen?.screenNumber}`} Â· {show.screen?.screenType || "2D"}
                              </div>
                            </div>
                            <span className="badge bg-danger text-white">
                              {formattedDate} Â· {formattedTime}
                            </span>
                          </div>

                          <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25 small">
                            <span className="text-secondary">
                              Available Seats:{" "}
                              <strong className="text-white">
                                {show.seatsAvailableCount ?? show.seats?.filter((s) => s.status === "available").length ?? 0}
                              </strong>
                            </span>
                            <div className="d-flex gap-2">
                              {(show.pricing || []).map((p) => (
                                <span key={p.tier} className="text-light">
                                  {p.tier}: <strong className="accent">${p.price}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-3 rounded-2 small text-secondary mt-3" style={{ background: "#111118", border: "1px dashed rgba(255,255,255,0.15)" }}>
                  â„¹ <em>Seat reservation and online ticket checkout will be enabled in the upcoming booking phase.</em>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto container py-4 text-secondary border-top border-secondary small d-flex justify-content-between align-items-center">
        <span>IMovies Â· Full-Stack MERN Cinema Management</span>
        <span className="text-secondary">v1.1.0</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);