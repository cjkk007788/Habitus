import { create } from 'zustand';

const useSearchStore = create((set) => ({
  searchQuery: '',          // 현재 검색어
  searchFilter: 'music',   // 'music' | 'movie' | 'book' | 'all'
  searchResults: [],        // 검색 결과 배열
  isSearching: false,       // 로딩 중 여부
  searchError: null,        // 에러 메시지

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchFilter: (f) => set({ searchFilter: f }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (bool) => set({ isSearching: bool }),
  setSearchError: (err) => set({ searchError: err }),
  clearSearch: () => set({ searchQuery: '', searchResults: [], searchError: null }),
}));

export default useSearchStore;
