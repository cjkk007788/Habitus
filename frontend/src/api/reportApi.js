const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const fetchTasteAnalysis = async (userId = null) => {
  try {
    const url = userId 
      ? `${BACKEND_URL}/report/taste-analysis?user_id=${userId}`
      : `${BACKEND_URL}/report/taste-analysis`;
      
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch taste analysis:', error);
    return { topArtists: [], topGenres: [] };
  }
};
