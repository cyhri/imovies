const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Movies
export async function fetchMovies(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.q) query.set('q', params.q);
  if (params.genre) query.set('genre', params.genre);
  if (params.rating) query.set('rating', params.rating);
  if (params.language) query.set('language', params.language);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.order) query.set('order', params.order);

  const qs = query.toString();
  return request(`/movies${qs ? `?${qs}` : ''}`);
}

export async function fetchMovieById(id) {
  return request(`/movies/${id}`);
}

// Theatres
export async function fetchTheatres(params = {}) {
  const query = new URLSearchParams();
  if (params.city) query.set('city', params.city);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  return request(`/theatres${qs ? `?${qs}` : ''}`);
}

// Shows
export async function fetchShows(params = {}) {
  const query = new URLSearchParams();
  if (params.movie) query.set('movie', params.movie);
  if (params.theatre) query.set('theatre', params.theatre);
  if (params.screen) query.set('screen', params.screen);
  if (params.city) query.set('city', params.city);
  if (params.date) query.set('date', params.date);

  const qs = query.toString();
  return request(`/shows${qs ? `?${qs}` : ''}`);
}

export async function fetchShowById(id) {
  return request(`/shows/${id}`);
}

// Authentication
export async function registerUser({ name, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(token) {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Bookings
export async function createBooking({ showId, seatNumbers }, token) {
  return request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ showId, seatNumbers }),
  });
}

export async function fetchMyBookings(token) {
  return request('/bookings/my-bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchBookingById(id, token) {
  return request(`/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cancelBooking(id, token) {
  return request(`/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default {
  fetchMovies,
  fetchMovieById,
  fetchTheatres,
  fetchShows,
  fetchShowById,
  registerUser,
  loginUser,
  fetchMe,
  createBooking,
  fetchMyBookings,
  fetchBookingById,
  cancelBooking,
};