import React from 'react';
import { X, Loader2 } from 'lucide-react';
import MediaAlbum from '../../common/MediaAlbum/MediaAlbum';
import useSearchStore from '../../../store/search/useSearchStore';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import './SearchResults.css';

import { toMediaAlbumItem } from '../../../utils/mediaAdapters';


export default function SearchResultSection() {
  const {
    searchQuery, searchResults, isSearching, searchError, clearSearch,
  } = useSearchStore();
  const { openRightSidebar } = useSidebarStore();

  // 검색어 없으면 렌더링 안 함
  if (!searchQuery) return null;

  const handleAlbumClick = (item) => {
    openRightSidebar(item);
  };

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    openRightSidebar(item);
  };

  return (
    <div className="sr-section">
      {/* 헤더 */}
      <div className="sr-header">
        <div className="sr-header-left">
          <span className="sr-header-icon">🔍</span>
          <span className="sr-header-title">Search Results</span>
          <span className="sr-header-query">"{searchQuery}"</span>
          {!isSearching && (
            <span className="sr-header-count">{searchResults.length} results</span>
          )}
        </div>
        <button className="sr-close-btn" onClick={clearSearch} title="Close search results">
          <X size={16} />
        </button>
      </div>

      {/* 로딩 */}
      {isSearching && (
        <div className="sr-loading">
          <Loader2 size={20} className="sr-spinner" />
          <span>Searching...</span>
        </div>
      )}

      {/* 에러 */}
      {!isSearching && searchError && (
        <div className="sr-error">⚠️ {searchError}</div>
      )}

      {/* 결과 없음 */}
      {!isSearching && !searchError && searchResults.length === 0 && (
        <div className="sr-empty">No results found for "{searchQuery}"</div>
      )}

      {/* 결과 카드 그리드 — MediaAlbum 재사용 */}
      {!isSearching && searchResults.length > 0 && (
        <div className="uhd-albums-grid media-album-grid">
          {searchResults.map((item, idx) => (
            <MediaAlbum
              key={`${item.external_id}_${idx}`}
              item={toMediaAlbumItem(item)}
              onClick={handleAlbumClick}
              onPlayClick={handlePlayClick}
            />
          ))}
        </div>
      )}

      {/* 구분선 */}
      <div className="sr-divider" />
    </div>
  );
}
