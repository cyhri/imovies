import React from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

function App() {
  return (
    <div className="app">
      <nav className="navbar navbar-dark border-bottom border-secondary px-4">
        <a className="navbar-brand fw-bold fs-3" href="/">
          IMOVIES<span className="accent">.</span>
        </a>
        <span className="text-secondary small">YOUR CINEMA EXPERIENCE</span>
      </nav>

      <main className="hero container py-5">
        <p className="accent fw-semibold">YOUR NEXT MOVIE NIGHT STARTS HERE</p>
        <h1 className="display-2 fw-bold">
          STORIES THAT
          <br />
          <span className="accent">MOVE YOU.</span>
        </h1>
        <p className="lead text-secondary mt-4">
          Discover movies. Explore showtimes. Book your perfect seat.
        </p>
        <button className="btn btn-danger btn-lg mt-3" disabled>
          Explore Movies — Coming Soon
        </button>
      </main>

      <footer className="container py-4 text-secondary border-top border-secondary">
        IMovies · A MERN Stack Cinema Booking Project
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
