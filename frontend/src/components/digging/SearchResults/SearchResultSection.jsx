import React, { useState, useEffect } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MediaAlbum from '../../common/MediaAlbum/MediaAlbum';
import useSearchStore from '../../../store/search/useSearchStore';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import CustomPinCard from '../../../pages/Archive/Custom/components/Display/CustomPinCard';
import { fetchCommunityAlbums } from '../../../api/customArchiveApi';
import './SearchResults.css';

import { toMediaAlbumItem } from '../../../utils/mediaAdapters';


export default function SearchResultSection({ onItemClick }) {
  const {
    searchQuery, searchResults, isSearching, searchError, clearSearch,
  } = useSearchStore();
  const { openRightSidebar } = useSidebarStore();
  const navigate = useNavigate();

  const [communityAlbums, setCommunityAlbums] = useState([]);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      const loadCommunity = async () => {
        setIsCommunityLoading(true);
        try {
          const data = await fetchCommunityAlbums({ q: searchQuery, limit: 10 });
          setCommunityAlbums(data);
        } catch (e) {
          console.error("Failed to load community search", e);
        } finally {
          setIsCommunityLoading(false);
        }
      };
      loadCommunity();
    }
  }, [searchQuery]);

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
                onAddClick={onItemClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Community Curations 섹션 */}
      {(!isSearching && !isCommunityLoading && communityAlbums.length > 0) && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <Users size={20} color="#a78bfa" />
            Community Curations
            <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'rgba(255,255,255,0.5)' }}>({communityAlbums.length})</span>
          </h3>
          <div className="curated-row-scroll" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
            {communityAlbums.map((album, idx) => (
              <div key={album.id} style={{ minWidth: '240px', flexShrink: 0 }}>
                <CustomPinCard 
                  album={album} 
                  onClick={() => navigate(`/archive/custom/${album.id}?public=true`)} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
