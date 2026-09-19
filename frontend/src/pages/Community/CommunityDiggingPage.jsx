import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, Loader2, RefreshCw, Music, Film, BookOpen } from 'lucide-react';
import CustomPinCard from '../Archive/Custom/components/Display/CustomPinCard';
import { fetchCommunityAlbums } from '../../api/customArchiveApi';
import useSearchStore from '../../store/search/useSearchStore';
import './CommunityDiggingPage.css';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All', icon: Globe },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'movie', label: 'Movie', icon: Film },
  { key: 'book', label: 'Book', icon: BookOpen },
];

export default function CommunityDiggingPage() {
  const navigate = useNavigate();

  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const { searchQuery, clearSearch } = useSearchStore();

  const loadAlbums = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCommunityAlbums({
        q: searchQuery || null,
        sort,
        category,
        limit: 40,
      });
      setAlbums(data);
    } catch (e) {
      setError('커뮤니티 앨범을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [category, sort, searchQuery]);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  const handleAlbumClick = (album) => {
    // 퍼블릭 앨범 상세로 이동
    navigate(`/archive/custom/${album.id}?public=true`);
  };

  return (
    <div className="community-page">
      {/* 헤더 */}
      <div className="community-header">
        <div className="community-header-left">
          <Globe size={28} className="community-icon" />
          <div>
            <h1 className="community-title">Curation</h1>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="community-filters">
        <div className="community-category-tabs">
          {CATEGORY_FILTERS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`community-cat-tab ${category === key ? 'active' : ''}`}
              onClick={() => setCategory(key)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="community-sort-tabs">
          <button
            className={`community-sort-btn ${sort === 'latest' ? 'active' : ''}`}
            onClick={() => setSort('latest')}
          >최신순</button>
          <button
            className={`community-sort-btn ${sort === 'popular' ? 'active' : ''}`}
            onClick={() => setSort('popular')}
          >인기순</button>
          <button className="community-refresh-btn" onClick={loadAlbums} title="새로고침">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 검색어 배너 */}
      {searchQuery && (
        <div className="community-search-banner">
          <span>
            <strong>"{searchQuery}"</strong>와 유사한 큐레이션 {albums.length}개
          </span>
          <button onClick={clearSearch}>✕ 검색 초기화</button>
        </div>
      )}

      {/* 컨텐츠 */}
      {isLoading ? (
        <div className="community-loading">
          <Loader2 size={32} className="community-spinner" />
          <span>큐레이션을 불러오는 중...</span>
        </div>
      ) : error ? (
        <div className="community-error">⚠️ {error}</div>
      ) : albums.length === 0 ? (
        <div className="community-empty">
          <div className="community-empty-icon">🌱</div>
          <h3>아직 공개된 큐레이션이 없습니다.</h3>
          <p className="community-empty-hint">먼저 Custom 아카이빙 후 Curation에 공개해 보세요!</p>
        </div>
      ) : (
        /* Masonry 핀터레스트 그리드 */
        <div className="community-masonry-grid">
          {albums.map((album) => (
            <div key={album.id} className="community-pin-wrapper">
              {/* 유사도 배지 */}
              {album.similarity_score != null && (
                <div className="community-similarity-badge">
                  {Math.round(album.similarity_score * 100)}% match
                </div>
              )}
              <CustomPinCard
                album={album}
                onClick={() => handleAlbumClick(album)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
