import { create } from 'zustand';
import { fetchCustomAlbums, fetchCustomAlbumById, fetchComments, createCommentAPI, deleteCommentAPI } from '../../api/customArchiveApi';
import { createItem, createAlbum, linkItemsToAlbum, syncItemsToAlbum, deleteAlbumAPI, deleteItemAPI, updateItem, updateAlbum } from '../../api/archiveApi';
import { useArchiveStore } from '../archive';

/**
 * 커스텀 입력 필드를 `media_meta` 형식에 맞게 변환하는 헬퍼 함수
 */
const buildMediaMeta = (images, formData) => {
  const meta = { images: images || [] };
  
  if (formData.releaseYear) {
    meta.releaseYear = formData.releaseYear;
  }
  
  if (formData.category === 'music' && formData.artists) {
    meta.artists = formData.artists.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  const contributors = [];
  if (formData.category === 'movie' && formData.director) {
    contributors.push({ name: formData.director.trim(), role: 'director' });
  }
  if (formData.category === 'book' && formData.author) {
    contributors.push({ name: formData.author.trim(), role: 'author' });
  }
  if (contributors.length > 0) {
    meta.contributors = contributors;
  }
  
  if (formData.relatedArtists) {
    meta.related_artists = formData.relatedArtists.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  return meta;
};

/**
 * 커스텀 아카이빙 전용 Zustand 스토어
 * - 커스텀 앨범(핀) 목록 관리
 * - 카테고리 필터링
 * - CRUD 액션
 */
export const useCustomArchiveStore = create((set, get) => ({
  // 상태
  customAlbums: [],
  activeFilter: 'all',
  isLoading: false,
  error: null,

  // 커스텀 앨범 목록 조회
  loadCustomAlbums: async (filter = null) => {
    set({ isLoading: true, error: null });
    try {
      const category = filter || get().activeFilter;
      const albums = await fetchCustomAlbums(category === 'all' ? null : category);

      // 백엔드 응답을 프론트엔드 형태로 변환
      const mapped = albums.map(album => ({
        id: album.id,
        title: album.title,
        category: album.category,
        isPublic: album.is_public,
        createdAt: album.created_at,
        updatedAt: album.updated_at,
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

      set({ customAlbums: mapped, isLoading: false });
    } catch (error) {
      console.error('Failed to load custom albums:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // 카테고리 필터 변경
  setActiveFilter: (filter) => {
    set({ activeFilter: filter });
    get().loadCustomAlbums(filter);
  },

  // 커스텀 앨범(핀) 생성
  createCustomAlbum: async (formData) => {
    try {
      const {
        title, category, coverImageUrl, additionalImages,
        hashtags, rating, impression, description,
        links, pinLayout, pinStyle, additionalItems
      } = formData;

      // 1. 메타 아이템 생성 (앨범의 대표 정보)
      const metaItemPayload = {
        title: title || 'Untitled',
        item_type: category || 'custom',
        external_source: 'custom',
        cover_image_url: coverImageUrl || '',
        rating: Number(rating) || 0,
        impression: impression || '',
        description: description || '',
        genres: hashtags || [],
        media_meta: buildMediaMeta(additionalImages, formData),
        user_meta: {
          pin_layout: pinLayout || 'classic',
          pin_style: pinStyle || {},
          is_meta_item: true,
        },
        links: (links || []).map(l => ({
          platform: l.platform || 'link',
          url: l.url,
        })),
      };

      const createdMetaItem = await createItem(metaItemPayload);
      const allItemIds = [createdMetaItem.id];

      // 2. 추가 아이템 생성 (선택적)
      if (additionalItems && additionalItems.length > 0) {
        for (const item of additionalItems) {
          const itemPayload = {
            title: item.title || 'Untitled Item',
            item_type: item.category || category || 'custom',
            external_source: 'custom',
            cover_image_url: item.imageUrl || '',
            rating: Number(item.rating) || 0,
            impression: item.impression || '',
            description: item.description || '',
            genres: item.hashtags || [],
            media_meta: buildMediaMeta(item.additionalImages, item),
            user_meta: {},
            links: (item.links || []).map(l => ({
              platform: l.platform || 'link',
              url: l.url,
            })),
          };
          const createdItem = await createItem(itemPayload);
          allItemIds.push(createdItem.id);
        }
      }

      // 3. 앨범 생성
      const albumPayload = {
        title: title || 'Untitled',
        category: category || 'custom',
        is_public: false,
      };
      const createdAlbum = await createAlbum(albumPayload);

      // 4. 앨범에 아이템 연결
      if (allItemIds.length > 0) {
        await linkItemsToAlbum(createdAlbum.id, allItemIds);
      }

      // 5. 로컬 스토어 업데이트
      await get().loadCustomAlbums();

      // 일반 아카이브 스토어(왼쪽 사이드바)에도 추가
      useArchiveStore.setState((state) => {
        const newItems = allItemIds.map(id => ({
          id,
          coverImages: [coverImageUrl || ''],
          title: title || 'Untitled',
          itemType: category || 'custom'
        }));
        
        return {
          items: [...state.items, ...newItems],
          albums: [...state.albums, {
            id: createdAlbum.id,
            albumTitle: createdAlbum.title,
            category: createdAlbum.category,
            itemIds: allItemIds,
            isPublic: createdAlbum.is_public,
            createdAt: createdAlbum.created_at,
            updatedAt: createdAlbum.updated_at,
            isDeleted: false,
          }]
        };
      });

      return createdAlbum;
    } catch (error) {
      console.error('Failed to create custom album:', error);
      throw error;
    }
  },

  // 커스텀 앨범 삭제
  deleteCustomAlbum: async (albumId) => {
    try {
      // 앨범에 속한 아이템들도 삭제
      const album = get().customAlbums.find(a => a.id === albumId);
      if (album) {
        for (const item of album.items) {
          try {
            await deleteItemAPI(item.id);
          } catch (e) {
            console.warn('Failed to delete item:', item.id, e);
          }
        }
      }
      await deleteAlbumAPI(albumId);

      set((state) => ({
        customAlbums: state.customAlbums.filter(a => a.id !== albumId),
      }));

      // 일반 아카이브 스토어(왼쪽 사이드바)에서도 제거
      useArchiveStore.setState((state) => {
        const albumToDelete = state.albums.find(a => a.id === albumId);
        const itemIdsToDelete = new Set(albumToDelete?.itemIds || []);
        return {
          albums: state.albums.filter(a => a.id !== albumId),
          items: state.items.filter(item => !itemIdsToDelete.has(item.id))
        };
      });
    } catch (error) {
      console.error('Failed to delete custom album:', error);
      throw error;
    }
  },

  // 앨범 단건 조회
  getAlbumById: async (albumId) => {
    let album = get().customAlbums.find(a => a.id === albumId);
    if (!album) {
      try {
        const rawAlbum = await fetchCustomAlbumById(albumId);
        album = {
          id: rawAlbum.id,
          title: rawAlbum.title,
          category: rawAlbum.category,
          isPublic: rawAlbum.is_public,
          createdAt: rawAlbum.created_at,
          updatedAt: rawAlbum.updated_at,
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
        console.error('Failed to fetch album by id:', error);
        return null;
      }
    }
    return album;
  },

  // 댓글 관련
  fetchCommentsForAlbum: async (albumId) => {
    try {
      return await fetchComments(albumId);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  },

  addComment: async (albumId, content) => {
    try {
      return await createCommentAPI(albumId, content);
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  },

  removeComment: async (albumId, commentId) => {
    try {
      await deleteCommentAPI(albumId, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  },

  // 커스텀 앨범 업데이트 (수정 시)
  updateCustomAlbum: async (albumId, formData) => {
    try {
      const {
        title, category, coverImageUrl, additionalImages,
        hashtags, rating, impression, description,
        links, pinLayout, pinStyle, additionalItems
      } = formData;

      const album = await get().getAlbumById(albumId);
      if (!album) throw new Error("Album not found");

      // 1. 메타 아이템 업데이트 (또는 없으면 새로 생성)
      const existingMetaItem = album.items.find(i => i.userMeta?.is_meta_item);
      
      const metaItemPayload = {
        title: title || 'Untitled',
        item_type: category || 'custom',
        external_source: 'custom',
        cover_image_url: coverImageUrl || '',
        rating: Number(rating) || 0,
        impression: impression || '',
        description: description || '',
        genres: hashtags || [],
        media_meta: buildMediaMeta(additionalImages, formData),
        user_meta: {
          pin_layout: pinLayout || 'classic',
          pin_style: pinStyle || {},
          is_meta_item: true,
        },
        links: (links || []).map(l => ({
          platform: l.platform || 'link',
          url: l.url,
        })),
      };

      let metaItemId;
      if (existingMetaItem) {
        await updateItem(existingMetaItem.id, metaItemPayload);
        metaItemId = existingMetaItem.id;
      } else {
        const createdMetaItem = await createItem(metaItemPayload);
        metaItemId = createdMetaItem.id;
      }

      // 2. 추가 아이템 업데이트 / 재생성
      // 복잡도를 줄이기 위해 기존 non-meta 아이템 삭제 후 새로 생성하거나, sync 로직 사용
      const allItemIds = [metaItemId];

      if (additionalItems && additionalItems.length > 0) {
        for (const item of additionalItems) {
          const itemPayload = {
            title: item.title || 'Untitled Item',
            item_type: item.category || category || 'custom',
            external_source: 'custom',
            cover_image_url: item.imageUrl || '',
            rating: Number(item.rating) || 0,
            impression: item.impression || '',
            description: item.description || '',
            genres: item.hashtags || [],
            media_meta: buildMediaMeta(item.additionalImages, item),
            user_meta: {},
            links: (item.links || []).map(l => ({
              platform: l.platform || 'link',
              url: l.url,
            })),
          };
          if (item.id && album.items.find(i => i.id === item.id)) {
             await updateItem(item.id, itemPayload);
             allItemIds.push(item.id);
          } else {
             const createdItem = await createItem(itemPayload);
             allItemIds.push(createdItem.id);
          }
        }
      }

      // 3. 앨범 정보 업데이트
      await updateAlbum(albumId, {
        title: title || 'Untitled',
        category: category || 'custom',
      });

      // 4. 아이템 싱크 (제거된 아이템은 연결 해제/삭제)
      await syncItemsToAlbum(albumId, allItemIds);

      // 스토어 갱신
      await get().loadCustomAlbums();

      // 일반 아카이브 스토어(왼쪽 사이드바)에도 업데이트
      useArchiveStore.setState((state) => ({
        albums: state.albums.map(a => a.id === albumId ? {
          ...a,
          albumTitle: title || 'Untitled',
          category: category || 'custom',
          itemIds: allItemIds,
          updatedAt: new Date().toISOString(),
        } : a)
      }));

    } catch (error) {
      console.error('Failed to update custom album:', error);
      throw error;
    }
  },
}));
