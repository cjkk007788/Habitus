import { create } from 'zustand';
import { useArchiveStore } from './index';

const useArchiveUIStore = create((set) => ({
  // Archive 페이지 카드 표시 순서 (객체 배열로 관리)
  // { sourceId: 'standalone' | 'mix_id', type: 'album' | 'mix_items' | 'item', targetId: 'album_id' | 'mix_id' | 'item_id' }
  archiveDisplayItems: [],

  pushMixToArchive: (mixId) => set((state) => {
    const { mixes } = useArchiveStore.getState();
    const mix = mixes.find(m => m.id === mixId);
    if (!mix) return state;

    const newItems = [];
    
    // 믹스 그룹 제목(헤더) 추가
    newItems.push({ sourceId: mix.id, type: 'mix_header', targetId: mix.id });

    // 믹스에 속한 앨범들 추가
    if (mix.albumIds) {
      mix.albumIds.forEach(albumId => {
        newItems.push({ sourceId: mix.id, type: 'album', targetId: albumId });
      });
    }
    
    // 믹스에 속한 단일 아이템들(있다면 가상 앨범으로 추가)
    if (mix.itemIds && mix.itemIds.length > 0) {
      newItems.push({ sourceId: mix.id, type: 'mix_items', targetId: mix.id });
    }

    // 중복 제거: 같은 믹스를 연속해서 누를 경우 기존에 띄워둔 믹스 그룹을 화면에서 삭제하고 맨 위로 끌어올림
    const filteredOldItems = state.archiveDisplayItems.filter(item => item.sourceId !== mix.id);

    return {
      archiveDisplayItems: [...newItems, ...filteredOldItems]
    };
  }),

  pushAlbumToArchive: (albumId) => set((state) => {
    //standalone은 믹스로 저장하는 게 아니라 앨범 단독으로 아카이브에 띄우는 경우세 사용
    
    const newItem = { sourceId: 'standalone', type: 'album', targetId: albumId };
    // 기존에 독립적으로 띄워둔 동일한 앨범이 있다면 제거하고 위로 올림
    const filteredOldItems = state.archiveDisplayItems.filter(
      item => !(item.sourceId === 'standalone' && item.type === 'album' && item.targetId === albumId)
    );
    return {
      archiveDisplayItems: [newItem, ...filteredOldItems]
    };
  }),

  // 개별 행 하나만 제거 (X 버튼)
  removeRowFromArchive: (sourceId, targetId) => set((state) => ({
    archiveDisplayItems: state.archiveDisplayItems.filter(
      item => !(item.sourceId === sourceId && item.targetId === targetId)
    )
  })),

  // 특정 믹스 그룹 전체 제거 (전체 닫기 버튼)
  removeGroupFromArchive: (sourceId) => set((state) => ({
    archiveDisplayItems: state.archiveDisplayItems.filter(
      item => item.sourceId !== sourceId
    )
  })),

  // Archive 표시 목록 전체 초기화
  clearArchiveDisplay: () => set({ archiveDisplayItems: [] }),
}));

export default useArchiveUIStore;
