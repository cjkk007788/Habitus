import { v4 as uuidv4 } from 'uuid';

export const createMixSlice = (set, get) => ({
  mixes: [],

  // 새 Mix(믹스) 생성 - 카드들을 묶는 슈퍼 폴더
  // mixData를 sidebar에서 전달받아서 이 함수를 사용해 구현한다.
  addMix: (mixData) => {
    const timestamp = new Date().toISOString();
    const newMix = {
      id: `mix_${uuidv4()}`,
      mixTitle: mixData.mixTitle || 'Untitled Mix',
      coverImage: mixData.coverImage || '',
      description: mixData.description || '',
      albumIds: Array.isArray(mixData.albumIds) ? mixData.albumIds : [],
      itemIds: Array.isArray(mixData.itemIds) ? mixData.itemIds : [],
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false,
    };

    set((state) => ({
      mixes: [...state.mixes, newMix],
    }));
  },

  // 새 믹스 생성 (백엔드 API 연동)
  addMixWithBlocks: async (mixTitle, stagedMixBlocks, coverImage, description) => {
    try {
      // 1. 블록에서 albumId와 itemId 분리
      const albumIds = [];
      const itemIds = [];
      
      stagedMixBlocks.forEach(block => {
        if (block.type === 'album') {
          albumIds.push(block.sourceId);
        } else if (block.type === 'item') {
          itemIds.push(block.sourceId);
        }
      });

      const payload = {
        title: mixTitle || 'Untitled Mix',
        cover_image: coverImage || '',
        description: description || '',
        album_ids: albumIds,
        item_ids: itemIds,
        is_public: false
      };

      // 2. API 호출
      const { createMixAPI } = await import('../../api/archiveApi');
      const createdMix = await createMixAPI(payload);

      // 3. 로컬 스토어 업데이트
      const localMix = {
        id: createdMix.id,
        mixTitle: createdMix.title,
        coverImage: createdMix.cover_image || '',
        description: createdMix.description || '',
        albumIds: albumIds,
        itemIds: itemIds,
        isPublic: createdMix.is_public,
        createdAt: createdMix.created_at,
        updatedAt: createdMix.updated_at,
        isDeleted: false,
      };

      set((state) => ({
        mixes: [...state.mixes, localMix]
      }));
    } catch (error) {
      console.error("Failed to create Mix:", error);
      alert("믹스 생성에 실패했습니다.");
      throw error;
    }
  },

  // 기존 믹스 업데이트 (백엔드 API 연동)
  updateMixWithBlocks: async (mixId, mixTitle, stagedMixBlocks, coverImage, description) => {
    try {
      const albumIds = [];
      const itemIds = [];
      
      stagedMixBlocks.forEach(block => {
        if (block.type === 'album') {
          albumIds.push(block.sourceId);
        } else if (block.type === 'item') {
          itemIds.push(block.sourceId);
        }
      });

      const payload = {
        title: mixTitle || 'Untitled Mix',
        cover_image: coverImage || '',
        description: description || '',
        album_ids: albumIds,
        item_ids: itemIds
      };

      const { updateMixAPI } = await import('../../api/archiveApi');
      const updatedMix = await updateMixAPI(mixId, payload);

      const localMix = {
        id: updatedMix.id,
        mixTitle: updatedMix.title,
        coverImage: updatedMix.cover_image || '',
        description: updatedMix.description || '',
        albumIds: albumIds,
        itemIds: itemIds,
        isPublic: updatedMix.is_public,
        createdAt: updatedMix.created_at,
        updatedAt: updatedMix.updated_at,
        isDeleted: false,
      };

      set((state) => ({
        mixes: state.mixes.map(m => m.id === mixId ? localMix : m)
      }));
    } catch (error) {
      console.error("Failed to update Mix:", error);
      alert("믹스 수정에 실패했습니다.");
      throw error;
    }
  },

  // Mix 삭제 (Hard Delete)
  removeMix: (mixId) => {
    set((state) => ({
      mixes: state.mixes.filter(mix => mix.id !== mixId)
    }));
  },
});
