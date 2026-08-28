import { create } from 'zustand';
import { useArchiveStore } from '../archive';

const useSidebarStore = create((set) => ({
  isRightSidebarOpen: false,
  activeSidebarItem: null,

  openRightSidebar: (item) => set({ isRightSidebarOpen: true, activeSidebarItem: item }),
  closeRightSidebar: () => {
    useArchiveStore.getState().clearStagedItems();
    set({ isRightSidebarOpen: false, activeSidebarItem: null });
  },
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),

  // 현재 보고 있는 사이드바 아이템에 새로운 상세 메타데이터(API 응답 결과 등)를 병합하는 함수
  updateActiveSidebarItem: (updates) => set((state) => ({
    activeSidebarItem: state.activeSidebarItem
      ? { ...state.activeSidebarItem, ...updates }
      : null
  })),
}));

export default useSidebarStore;
