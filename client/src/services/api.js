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

export async function fetchTheatres(params = {}) {
  const query = new URLSearchParams();
  if (params.city) query.set('city', params.city);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  return request(`/theatres${qs ? `?${qs}` : ''}`);
}

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

export default {
  fetchMovies,
  fetchMovieById,
  fetchTheatres,
  fetchShows,
  fetchShowById,
};