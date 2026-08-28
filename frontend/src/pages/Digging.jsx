import { useState, useEffect, useRef } from 'react';
import TabMenu from '../components/digging/TabMenu/TabMenu';
import RecommendationAlbums from '../components/visual/RecommendationAlbums/RecommendationAlbums';
import GenreGrid from '../components/visual/GenreGrid/GenreGrid';
import CuratedRow from '../components/visual/CuratedRow/CuratedRow';
import SearchResultSection from '../components/digging/SearchResults/SearchResultSection';
import useSearchStore from '../store/search/useSearchStore';
import { searchContent } from '../api/searchApi';

// 카테고리별 큐레이션 행 정의
// 나중에 큐레이션 함수, 큐레이션 다양하게 만드어서 파일 분리
const CURATION_CONFIG = {
  music: [
    { id: 'top_artists', title: '🎤 Trending Artists' },
    { id: 'top_tracks', title: '🎧 Top Tracks' },
  ],
  movie: [
    { id: 'trending_persons', title: '🌟 Trending Persons' },
    { id: 'trending', title: '🔥 Trending This Week' },
    { id: 'top_rated', title: '⭐ Top Rated' },
  ],
  book: [
    { id: 'bestseller', title: '📚 Bestsellers' },
    { id: 'award', title: '🏆 Award Winners' },
    { id: 'classic', title: '🕰️ Classics' },
  ],
};

export default function Digging() {
  const [activeCategory, setActiveCategory] = useState('music');
  const [selectedGenre, setSelectedGenre] = useState(null);

  useEffect(() => {
    // 실제 스크롤이 발생하는 컨테이너는 MainLayout에 있는 .layout-outlet-container 입니다.
    const scrollContainer = document.querySelector('.layout-outlet-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [activeCategory]);

  const {
    searchQuery, searchFilter,
    setSearchResults, setIsSearching, setSearchError,
  } = useSearchStore();

  // ─── 검색어 변경 시 API 호출 ───────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const data = await searchContent(searchQuery, searchFilter, 12);
        if (!cancelled) setSearchResults(data.results || []);
      } catch (err) {
        if (!cancelled) {
          setSearchError(err.message || 'Search failed. Please try again.');
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    runSearch();
    return () => { cancelled = true; };
  }, [searchQuery, searchFilter]);



  const handleCategoryChange = (newCategory) => {
    setActiveCategory(newCategory);
    setSelectedGenre(null);
  };

  const curationRows = CURATION_CONFIG[activeCategory] || [];

  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      <TabMenu
        activeCategory={activeCategory}
        setActiveCategory={handleCategoryChange}
      />

      <div className="dig_tab_content active" style={{ marginTop: '30px' }}>

        {/* ▼ 검색 결과: 검색어가 있을 때 맨 위 */}
        <SearchResultSection />

        {/* ─── 큐레이션 rows ───────────────────────────
        큐레이션 Config를 돌면서 api를 순서대로 쏘는 로직 */}
        {curationRows.map(row => (
          <CuratedRow
            key={`${activeCategory}_${row.id}`}
            category={activeCategory}
            curationId={row.id}
            title={row.title}
          />
        ))}

        {/* ─── 장르 그리드 ──────────────── */}
        {!selectedGenre && (
          <GenreGrid category={activeCategory} onGenreSelect={setSelectedGenre} />
        )}

        {/* ─── 선택된 장르의 추천 카드 ─── */}
        {selectedGenre && (
          <RecommendationAlbums
            category={activeCategory}
            genre={selectedGenre}
            onBack={() => setSelectedGenre(null)}
          />
        )}
      </div>
    </div>
  );
}
