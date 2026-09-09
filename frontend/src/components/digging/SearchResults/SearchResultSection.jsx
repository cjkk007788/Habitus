import React from 'react';
import { X, Loader2 } from 'lucide-react';
import MediaAlbum from '../../common/MediaAlbum/MediaAlbum';
import useSearchStore from '../../../store/search/useSearchStore';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
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
    <div className="curated-row-container" id="curation-search">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 className="curated-row-title hover-trigger" style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AnimatedText text={searchQuery} />
        </h2>
        <button className="sr-close-btn" onClick={clearSearch} title="Close search results" style={{ marginTop: '-8px' }}>
          <X size={20} />
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
        <div className="curated-row-scroll media-album-grid">
          {searchResults.map((item, idx) => (
            <div 
              key={`${item.external_id}_${idx}`}
              className="curated-item-wrapper"
              style={{
                "--album-index": idx,
                animationDelay: `${idx * 0.05}s`
              }}
            >
              <MediaAlbum
                item={toMediaAlbumItem(item)}
                onClick={handleAlbumClick}
                onPlayClick={handlePlayClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
