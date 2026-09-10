const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

//백엔드에 아이템 생성 저장 하는 파일
/**
 * 아이템 단건 생성
 * @param {Object} itemData
 * @returns {Promise<Object>} 생성된 아이템 응답
 */
export const createItem = async (itemData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/items/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      throw new Error(`Item HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

/**
 * 아이템 수정
 * @param {string} itemId
 * @param {Object} updateData
 */
export const updateItem = async (itemId, updateData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Item HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

/**
 * 카드 생성
 * @param {Object} albumData
 * @returns {Promise<Object>} 생성된 카드 응답
 */
export const createAlbum = async (albumData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(albumData),
    });

    if (!response.ok) {
      throw new Error(`Album HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating album:', error);
    throw error;
  }
};

/**
 * 카드에 아이템 연결
 * @param {string} albumId
 * @param {Array<string>} itemIds
 */
export const linkItemsToAlbum = async (albumId, itemIds) => {
  try {
    console.log('[linkItemsToAlbum] albumId:', albumId, 'itemIds:', itemIds, 'body:', JSON.stringify(itemIds));
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemIds),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[linkItemsToAlbum] Error response body:', errorBody);
      throw new Error(`Link Items HTTP error! status: ${response.status} body: ${errorBody}`);
    }
    return await response.json();
    } catch (error) {
      console.error('Error linking items to album:', error);
      throw error;
    }
  };
  
  /**
   * 카드 아이템 전체 동기화 (순서 포함 덮어쓰기)
   * @param {string} albumId
   * @param {Array<string>} itemIds
   */
  export const syncItemsToAlbum = async (albumId, itemIds) => {
    try {
      console.log('[syncItemsToAlbum] albumId:', albumId, 'itemIds:', itemIds);
      const response = await fetch(`${BACKEND_URL}/albums/${albumId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemIds),
      });
  
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[syncItemsToAlbum] Error response body:', errorBody);
        throw new Error(`Sync Items HTTP error! status: ${response.status} body: ${errorBody}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error syncing items to album:', error);
      throw error;
    }
  };

/**
 * 카드 수정
 * @param {string} albumId
 * @param {Object} updateData
 */
export const updateAlbum = async (albumId, updateData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Album update HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating album:', error);
    throw error;
  }
};

/**
 * 믹스 생성 (앨범 및 아이템 포함)
 * @param {Object} mixData 
 * @returns {Promise<Object>} 생성된 믹스 응답
 */
export const createMixAPI = async (mixData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/mixes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mixData),
    });

    if (!response.ok) {
      throw new Error(`Mix HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating mix:', error);
    throw error;
  }
};

/**
 * 믹스 업데이트
 * @param {string} mixId
 * @param {Object} mixData
 * @returns {Promise<Object>} 업데이트된 믹스 응답
 */
export const updateMixAPI = async (mixId, mixData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/mixes/${mixId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mixData),
    });

    if (!response.ok) {
      throw new Error(`Mix HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating mix:', error);
    throw error;
  }
};

export const deleteItemAPI = async (itemId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Item delete HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

export const deleteAlbumAPI = async (albumId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/albums/${albumId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Album delete HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting album:', error);
    throw error;
  }
};

export const deleteMixAPI = async (mixId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/mixes/${mixId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Mix delete HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting mix:', error);
    throw error;
  }
};
