import { create } from 'zustand';
import { fetchCustomAlbums } from '../../api/customArchiveApi';
import { createItem, createAlbum, linkItemsToAlbum, deleteAlbumAPI, deleteItemAPI } from '../../api/archiveApi';

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
        media_meta: {
          images: additionalImages || [],
        },
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
            media_meta: {
              images: item.additionalImages || [],
            },
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
    } catch (error) {
      console.error('Failed to delete custom album:', error);
      throw error;
    }
  },
}));
