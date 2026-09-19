import { useState, useEffect, useRef } from 'react';
import RecommendationAlbums from '../components/visual/RecommendationAlbums/RecommendationAlbums';
import GenreGrid from '../components/visual/GenreGrid/GenreGrid';
import CuratedRow from '../components/visual/CuratedRow/CuratedRow';
import SearchResultSection from '../components/digging/SearchResults/SearchResultSection';
import useSearchStore from '../store/search/useSearchStore';
import AnimatedText from '../components/common/AnimatedText/AnimatedText';
import BookmarkMenu from '../components/common/BookmarkMenu/BookmarkMenu';
import { searchContent } from '../api/searchApi';
import useDebounce from '../hooks/useDebounce';

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
  const [selectedGenre, setSelectedGenre] = useState(null);

  const {
    searchQuery, searchFilter,
    setSearchResults, setIsSearching, setSearchError,
  } = useSearchStore();

  const [dynamicCurations, setDynamicCurations] = useState([]);
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

  const activeCategory = (searchFilter && searchFilter !== 'all') ? searchFilter : 'music';
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    setSelectedGenre(null); // Reset genre when category changes via Navbar
    const scrollContainer = document.querySelector('.layout-outlet-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    // Fetch dynamic curations for this category
    const fetchDynamicCurations = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/recommend/dynamic-curation?category=${activeCategory}`);
        if (res.ok) {
          const data = await res.json();
          setDynamicCurations(data);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic curations:", err);
      }
    };
    fetchDynamicCurations();

  }, [activeCategory]);

  // ─── 검색어 변경 시 API 호출 (디바운스 적용) ───────────────────────
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const data = await searchContent(debouncedSearchQuery, searchFilter, 12);
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
  }, [debouncedSearchQuery, searchFilter]);





  // If dynamic curations are available, use them. Otherwise fallback to static config.
  // Note: taste_dna is currently a placeholder for a future feature.
  const validCurations = dynamicCurations.filter(c => c.id !== 'taste_dna');
  const curationRows = validCurations.length > 0 
    ? validCurations 
    : (CURATION_CONFIG[activeCategory] || []);

  // Create sections array for the bookmark menu
  const bookmarkSections = [
    ...(searchQuery ? [{ id: 'curation-search', title: searchQuery }] : []),
    ...curationRows.map(row => ({ id: `curation-${row.id}`, title: row.title })),
    { id: 'genre-grid-section', title: 'Browse Genres' }
  ];

  return (
    <div style={{ padding: '0 20px 20px 20px', position: 'relative' }}>
      <BookmarkMenu sections={bookmarkSections} />
      <div className="dig_tab_content active" style={{ marginTop: '30px' }}>
        <h1 className="hover-trigger" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px', textTransform: 'capitalize', cursor: 'default' }}>
          <AnimatedText text={activeCategory} />
        </h1>

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
