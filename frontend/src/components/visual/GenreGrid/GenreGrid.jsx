import React, { useEffect, useState, useMemo } from 'react';
import { fetchAllGenres } from '../../../api/musicbrainz/genreApi';
import { fetchBookGenres } from '../../../api/googlebooks/bookApi';
import { fetchMovieGenres } from '../../../api/tmdb/movieApi';
import { generateGradient } from '../../../utils/colorUtils';
import { ChevronDown } from 'lucide-react';
import useCacheStore from '../../../store/system/cacheStore';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import './GenreGrid.css';

// TTL 상수 (밀리초)
const GENRE_TTL = 60 * 60 * 1000; // 장르 목록: 60분

export default function GenreGrid({ category = 'music', onGenreSelect }) {
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const { getCache, setCache } = useCacheStore();

  useEffect(() => {
    const loadGenres = async () => {
      const cacheKey = `genres_${category}`;

      // 캐시 확인 → hit이면 즉시 렌더링
      const cached = getCache(cacheKey, GENRE_TTL);
      if (cached) {
        setGenres(cached);
        setIsLoading(false);
        return;
      }

      // 캐시 miss → API 호출 후 저장
      setIsLoading(true);
      let data = [];
      if (category === 'music') {
        data = await fetchAllGenres();
      } else if (category === 'book') {
        data = await fetchBookGenres();
      } else if (category === 'movie') {
        data = await fetchMovieGenres();
      }
      setCache(cacheKey, data);
      setGenres(data);
      setIsLoading(false);
    };
    loadGenres();
  }, [category]);

  const sortedGenres = useMemo(() => {
    if (!genres || genres.length === 0) return [];
    
    // Hardcoded popular genres to show first
    const POPULAR_GENRES = [
      'pop', 'rock', 'hip hop', 'electronic', 'jazz', 'r&b', 'classical', 
      'k-pop', 'metal', 'indie', 'country', 'soul', 'folk', 'blues', 'alternative'
    ];
    
    return [...genres].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aIdx = POPULAR_GENRES.indexOf(aName);
      const bIdx = POPULAR_GENRES.indexOf(bName);
      
      // Both are popular: sort by popularity array order
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      // Only A is popular: A comes first
      if (aIdx !== -1) return -1;
      // Only B is popular: B comes first
      if (bIdx !== -1) return 1;
      
      // Neither are popular: alphabetical
      return aName.localeCompare(bName);
    });
  }, [genres]);



  if (isLoading) {
    return (
      <div className="genre-grid-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>Loading {category} Genres...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Fetching the complete list of genres...</p>
      </div>
    );
  }

  return (
    <div className="genre-grid-container" id="genre-grid-section">
      <div className="genre-grid-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="hover-trigger" style={{ cursor: 'default' }}>
              <AnimatedText text="Browse Genres" />
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Discover tracks by selecting a genre below.</p>
          </div>
          <button
            className="genre-toggle-btn"
            onClick={() => setIsOpen(prev => !prev)}
            title={isOpen ? 'Collapse genres' : 'Expand genres'}
          >
            <ChevronDown
              size={22}
              className={`genre-toggle-icon${isOpen ? '' : ' rotated'}`}
            />
          </button>
        </div>
      </div>

      {/* Animated wrapper for smooth expand/collapse */}
      <div className={`genre-grid-wrapper${isOpen ? ' genre-grid-wrapper--open' : ' genre-grid-wrapper--closed'}`}>
        <div className="genre-grid">
          {sortedGenres.map((genre) => {
            const bgGradient = generateGradient(genre.name);
            return (
              <div
                key={genre.id}
                className="genre-album"
                style={{ background: bgGradient }}
                onClick={() => onGenreSelect(genre)}
              >
                <span className="genre-name" style={{ textTransform: 'capitalize' }}>{genre.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
