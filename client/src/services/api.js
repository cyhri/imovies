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
  if (params.all) query.set('all', params.all);

  const qs = query.toString();
  return request(`/movies${qs ? `?${qs}` : ''}`);
}

export async function fetchMovieById(id) {
  return request(`/movies/${id}`);
}

export async function createMovie(data, token) {
  return request('/movies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function updateMovie(id, data, token) {
  return request(`/movies/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function deleteMovie(id, token) {
  return request(`/movies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Theatres
export async function fetchTheatres(params = {}) {
  const query = new URLSearchParams();
  if (params.city) query.set('city', params.city);
  if (params.search) query.set('search', params.search);
  if (params.all) query.set('all', params.all);

  const qs = query.toString();
  return request(`/theatres${qs ? `?${qs}` : ''}`);
}

export async function fetchTheatreById(id) {
  return request(`/theatres/${id}`);
}

export async function createTheatre(data, token) {
  return request('/theatres', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function updateTheatre(id, data, token) {
  return request(`/theatres/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function deleteTheatre(id, token) {
  return request(`/theatres/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Screens
export async function fetchScreensByTheatre(theatreId) {
  return request(`/theatres/${theatreId}/screens`);
}

export async function createScreen(theatreId, data, token) {
  return request(`/theatres/${theatreId}/screens`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function deleteScreen(screenId, token) {
  return request(`/theatres/screens/${screenId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Shows
export async function fetchShows(params = {}) {
  const query = new URLSearchParams();
  if (params.movie) query.set('movie', params.movie);
  if (params.theatre) query.set('theatre', params.theatre);
  if (params.screen) query.set('screen', params.screen);
  if (params.city) query.set('city', params.city);
  if (params.date) query.set('date', params.date);
  if (params.includePast) query.set('includePast', params.includePast);
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  return request(`/shows${qs ? `?${qs}` : ''}`);
}

export async function fetchShowById(id) {
  return request(`/shows/${id}`);
}

export async function createShow(data, token) {
  return request('/shows', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function cancelShow(id, token) {
  return request(`/shows/${id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
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
export async function createBooking({ showId, seatNumbers, holdToken }, token) {
  return request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ showId, seatNumbers, holdToken }),
  });
}

// Seat Holds
export async function createSeatHold(showId, seatNumbers, token, durationSeconds = 300) {
  return request(`/shows/${showId}/holds`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ seatNumbers, durationSeconds }),
  });
}

export async function releaseSeatHold(showId, holdToken, token) {
  return request(`/shows/${showId}/holds/${holdToken}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchSeatHold(showId, holdToken, token) {
  return request(`/shows/${showId}/holds/${holdToken}`, {
    headers: { Authorization: `Bearer ${token}` },
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

// Admin Portal APIs
export async function fetchAdminOverview(token) {
  return request('/admin/overview', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchAdminBookings(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  return request(`/admin/bookings${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default {
  fetchMovies,
  fetchMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  fetchTheatres,
  fetchTheatreById,
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
  registerUser,
  loginUser,
  fetchMe,
  createBooking,
  fetchMyBookings,
  fetchBookingById,
  cancelBooking,
  createSeatHold,
  releaseSeatHold,
  fetchSeatHold,
  fetchAdminOverview,
  fetchAdminBookings,
};