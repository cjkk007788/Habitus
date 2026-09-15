const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * 커스텀(수동) 아카이빙 아이템 목록 조회
 * @param {string|null} itemType - 카테고리 필터 (null이면 전체)
 */
export const fetchCustomItems = async (itemType = null) => {
  try {
    const params = new URLSearchParams();
    if (itemType && itemType !== 'all') params.append('item_type', itemType);

    const url = `${BACKEND_URL}/items/custom/${params.toString() ? '?' + params : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching custom items:', error);
    throw error;
  }
};

/**
 * 커스텀 앨범 목록 조회
 * @param {string|null} category - 카테고리 필터 (null이면 전체)
 */
export const fetchCustomAlbums = async (category = null) => {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);

    const url = `${BACKEND_URL}/albums/custom/${params.toString() ? '?' + params : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching custom albums:', error);
    throw error;
  }
};
