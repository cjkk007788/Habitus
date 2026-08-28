const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * 통합 검색 API
 *
 * @param {string} query  검색어
 * @param {string} type   'music' | 'movie' | 'book' | 'all'
 * @param {number} limit  최대 결과 수 (기본 10)
 * @returns {Promise<{query: string, type: string, count: number, results: Array}>}
 */
export const searchContent = async (query, type = 'music', limit = 20) => {
  if (!query || !query.trim()) {
    return { query: '', type, count: 0, results: [] };
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      type,
      limit: String(limit),
    });

    const response = await fetch(`${BACKEND_URL}/search?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[searchApi] 검색 실패:', error);
    throw error;
  }
};
