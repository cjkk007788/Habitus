const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Fetch all movie genres from the backend (which proxies TMDB).
 * @returns {Promise<Array>} Array of genre objects e.g., [{id: "28", name: "Action"}, ...]
 */
export const fetchMovieGenres = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/genres/movie`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching TMDB movie genres from backend:", error);
    return [];
  }
};

/**
 * Fetch movies by genre ID from the backend.
 * @param {string|number} genreId TMDB genre ID
 * @param {number} page Page number for pagination
 * @param {number} limit Items per page (TMDB max 20)
 * @returns {Promise<Array>} Array of movie objects
 */
export const fetchMoviesByGenre = async (genreId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`${BACKEND_URL}/genres/movie/${genreId}/items?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching movies for genre ID ${genreId}:`, error);
    return [];
  }
};

/**
 * Fetch YouTube trailer key for a movie.
 * @param {string|number} movieId TMDB movie ID
 * @returns {Promise<string|null>} YouTube video URL or null
 */
export const fetchMovieTrailer = async (movieId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/genres/movie/${movieId}/trailer`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.trailer_key) {
      return `https://www.youtube.com/embed/${data.trailer_key}`;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching trailer for movie ID ${movieId}:`, error);
    return null;
  }
};
