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

export const fetchCustomAlbumById = async (albumId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching album by id:', error);
    throw error;
  }
};

export const fetchComments = async (albumId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}/comments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const createCommentAPI = async (albumId, content) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const deleteCommentAPI = async (albumId, commentId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * 커뮤니티 공개 앨범 목록 조회 (인증 불필요)
 * @param {string|null} q - 검색어 (코사인 유사도 검색)
 * @param {string} sort - 정렬 방식 (latest | popular)
 * @param {string|null} category - 카테고리 필터
 */
export const fetchCommunityAlbums = async ({ q = null, sort = 'latest', category = null, limit = 30 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (sort) params.append('sort', sort);
    if (category && category !== 'all') params.append('category', category);
    params.append('limit', limit);

    const url = `${BACKEND_URL}/albums/community/?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.map(album => ({
      id: album.id,
      title: album.title,
      category: album.category,
      isPublic: album.is_public,
      createdAt: album.created_at,
      updatedAt: album.updated_at,
      similarityScore: album.similarity_score,
      ownerUsername: album.owner_username,
      likesCount: album.likes_count || 0,
      isLiked: album.is_liked || false,
      items: (album.items || []).map(item => ({
        id: item.id,
        title: item.title,
        itemType: item.item_type,
        coverImageUrl: item.cover_image_url,
        rating: item.rating,
        impression: item.impression,
        description: item.description,
        genres: item.genres || [],
        dominantColor: item.dominant_color,
        mediaMeta: item.media_meta || {},
        userMeta: item.user_meta || {},
        links: item.links || [],
      })),
    }));
  } catch (error) {
    console.error('Error fetching community albums:', error);
    throw error;
  }
};

/**
 * 퍼블릭 앨범 상세 조회 (비인증, Read-only)
 */
export const fetchPublicAlbumById = async (albumId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}/public`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const rawAlbum = await response.json();
    return {
      id: rawAlbum.id,
      title: rawAlbum.title,
      category: rawAlbum.category,
      isPublic: rawAlbum.is_public,
      createdAt: rawAlbum.created_at,
      updatedAt: rawAlbum.updated_at,
      ownerUsername: rawAlbum.owner_username,
      likesCount: rawAlbum.likes_count || 0,
      isLiked: rawAlbum.is_liked || false,
      items: (rawAlbum.items || []).map(item => ({
        id: item.id,
        title: item.title,
        itemType: item.item_type,
        coverImageUrl: item.cover_image_url,
        rating: item.rating,
        impression: item.impression,
        description: item.description,
        genres: item.genres || [],
        dominantColor: item.dominant_color,
        mediaMeta: item.media_meta || {},
        userMeta: item.user_meta || {},
        links: item.links || [],
      })),
    };
  } catch (error) {
    console.error('Error fetching public album:', error);
    throw error;
  }
};

/**
 * 퍼블릭 앨범을 내 아카이브로 복제
 */
export const cloneAlbum = async (albumId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}/clone`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error cloning album:', error);
    throw error;
  }
};

/**
 * 앨범 좋아요 토글
 */
export const toggleAlbumLike = async (albumId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const rawAlbum = await response.json();
    return {
      likesCount: rawAlbum.likes_count || 0,
      isLiked: rawAlbum.is_liked || false,
    };
  } catch (error) {
    console.error('Error toggling album like:', error);
    throw error;
  }
};
