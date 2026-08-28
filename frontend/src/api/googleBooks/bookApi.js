const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const fetchBookGenres = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/genres/book`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Google Books genres from backend:", error);
    return [];
  }
};

export const fetchBooksByGenre = async (genreName, page = 1, limit = 10) => {
  try {
    const encodedGenre = encodeURIComponent(genreName);
    const response = await fetch(`${BACKEND_URL}/genres/book/${encodedGenre}/items?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching books for genre ${genreName}:`, error);
    return [];
  }
};
