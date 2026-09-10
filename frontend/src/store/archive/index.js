import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateMockItems, generateMockAlbums, generateMockMixes } from '../../mocks/mockData';

import { createStagingSlice } from './createStagingSlice';
import { createAlbumItemSlice } from './createAlbumItemSlice';
import { createMixSlice } from './createMixSlice';

export const useArchiveStore = create(
  persist(
    (...a) => ({
      ...createStagingSlice(...a),
      ...createAlbumItemSlice(...a),
      ...createMixSlice(...a),

      // 모든 데이터 삭제
      clearArchive: async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
          const response = await fetch(`${baseUrl}/items/clear_all`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            console.error('Failed to clear backend data');
            return;
          }

          const [set] = a;
          set({ items: [], albums: [], mixes: [], stagedItems: [] });
          console.log('[archiveStore] Backend and local data cleared successfully!');
        } catch (error) {
          console.error('Error clearing archive:', error);
        }
      },

      // Mock 데이터 불러오기 (개발/테스트용)
      loadMockData: () => {
        const [set, get] = a;
        const state = get();
        // 이미 데이터가 있으면 중복 방지
        if (state.items.length > 0 || state.albums.length > 0) {
          console.warn('[archiveStore] 이미 데이터가 존재합니다. clearArchive() 후 다시 시도하세요.');
          return;
        }
        set({
          items: generateMockItems(),
          albums: generateMockAlbums(),
          mixes: generateMockMixes(),
        });
        console.log('[archiveStore] Mock 데이터 로드 완료!');
      },
    }),
    {
      name: 'habitus_archive_storage', // 로컬 스토리지에 저장될 키 이름
    }
  )
);
