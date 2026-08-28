const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Fetch available curation lists for a category
 * @param {string} category 'music', 'movie', or 'book'
 * @returns {Promise<Array>} Array of {id, title}
 */
export const fetchCurationLists = async (category) => {
  try {
    const response = await fetch(`${BACKEND_URL}/curation/${category}/lists`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${category} curation lists:`, error);
    return [];
  }
};

/**
 * Fetch items for a specific curation list
 * @param {string} category 'music', 'movie', or 'book'
 * @param {string} curationId e.g., 'trending', 'top_rated'
 * @param {number} page Pagination
 * @param {number} limit Items per page
 * @returns {Promise<Array>} Array of curated items
 */
export const fetchCurationItems = async (category, curationId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`${BACKEND_URL}/curation/${category}/${curationId}?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching items for curation ${curationId}:`, error);
    return [];
  }
};
