import React, { useState, useEffect, useMemo } from 'react';
import { generateMockItems } from '../../../mocks/mockData';
import MediaAlbum from '../../common/MediaAlbum/MediaAlbum';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import useCacheStore from '../../../store/system/cacheStore';
import './RecommendationAlbums.css';

import { fetchArtistsByGenre } from '../../../api/musicbrainz/genreApi';
import { fetchBooksByGenre } from '../../../api/googlebooks/bookApi';
import { fetchMoviesByGenre } from '../../../api/tmdb/movieApi';
import AnimatedText from '../../common/AnimatedText/AnimatedText';

// TTL 상수 (밀리초)
const GENRE_ITEMS_TTL = 15 * 60 * 1000; // 장르별 아이템: 15분

const fallbackColors = [
  '#E05263', '#F2994A', '#27AE60', '#2D9CDB', '#9B51E0',
  '#F2C94C', '#EB5757', '#6FCF97', '#56CCF2', '#BB6BD9',
  '#333333', '#4F4F4F', '#828282', '#BDBDBD', '#E0E0E0'
];

export default function RecommendationAlbums({ category, genre, onBack }) {
  // genre can be a string (fallback) or an object {id, name}
  const genreId = typeof genre === 'object' ? genre.id : genre;
  const genreName = typeof genre === 'object' ? genre.name : genre;

  const { openRightSidebar } = useSidebarStore();
  const { getCache, setCache } = useCacheStore();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const observerTarget = React.useRef(null);
  const isLoadingRef = React.useRef(false); 
  
  const genreRef = React.useRef(genreId);
  useEffect(() => {
    genreRef.current = genreId;
  }, [genreId]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    isLoadingRef.current = false;
  }, [genreId, category]);

  useEffect(() => {
    if (hasMore) {
      const loadItems = async () => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setIsLoading(true);
        
        const requestedGenre = genreId;
        const cacheKey = `genre_items_${category}_${genreId}_${page}`;

        // 캐시 확인 → hit이면 이전 데이터에 추가만 하면 됨
        const cached = getCache(cacheKey, GENRE_ITEMS_TTL);
        if (cached) {
          if (genreRef.current !== requestedGenre) {
            isLoadingRef.current = false;
            setIsLoading(false);
            return;
          }
          setItems(prev => [...prev, ...cached]);
          if (cached.length < 10) setHasMore(false);
          setIsLoading(false);
          isLoadingRef.current = false;
          return;
        }

        let data = [];
        
        if (category === 'music') {
          data = await fetchArtistsByGenre(genreId, page, 10);
        } else if (category === 'book') {
          data = await fetchBooksByGenre(genreId, page, 10);
        } else if (category === 'movie') {
          data = await fetchMoviesByGenre(genreId, page, 10);
        }

        if (genreRef.current !== requestedGenre) {
          console.log('[STALE RESPONSE] Genre changed during fetch, disalbuming results');
          isLoadingRef.current = false;
          setIsLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setHasMore(false);
        } else {
          let formattedItems = [];
          if (category === 'music') {
            formattedItems = data.map((artist, idx) => ({
              _key: artist.id || artist.name + idx,
              id: artist.id || artist.name,
              mbid: artist.id || null,
              itemType: 'music_artist',
              title: artist.name,
              image_url: artist.image_url,
              coverImages: [],
              bgColor: fallbackColors[(items.length + idx) % fallbackColors.length],
              mediaMeta: { contributors: [{ name: artist.country || 'Artist' }] }
            }));
          } else if (category === 'book') {
            formattedItems = data.map((book, idx) => {
              const volumeInfo = book.volumeInfo || {};
              return {
                _key: book.id,
                id: book.id,
                itemType: 'book',
                title: volumeInfo.title || 'Unknown Title',
                image_url: volumeInfo.imageLinks?.thumbnail || null,
                coverImages: [],
                bgColor: fallbackColors[(items.length + idx) % fallbackColors.length],
                mediaMeta: {
                  releaseYear: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : 'Unknown',
                  contributors: volumeInfo.authors ? volumeInfo.authors.map(a => ({ role: 'Author', name: a })) : [{ role: 'Author', name: 'Unknown' }],
                  overview: volumeInfo.description,
                  publisher: volumeInfo.publisher,
                  pageCount: volumeInfo.pageCount,
                  previewLink: volumeInfo.previewLink || volumeInfo.infoLink
                }
              };
            });
          } else if (category === 'movie') {
            formattedItems = data.map((movie, idx) => ({
              _key: movie.id,
              id: movie.id,
              itemType: 'movie',
              title: movie.title,
              image_url: movie.poster_path,
              coverImages: [],
              bgColor: fallbackColors[(items.length + idx) % fallbackColors.length],
              mediaMeta: {
                releaseYear: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
                overview: movie.overview,
                vote_average: movie.vote_average,
                contributors: []
              }
            }));
          }

          // 페이지별로 버제트 컨텐츠 캐싱
          setCache(cacheKey, formattedItems);
          setItems(prev => [...prev, ...formattedItems]);
          if (data.length < 10) setHasMore(false);
        }
        setIsLoading(false);
        isLoadingRef.current = false;
      };
      loadItems();
    }
  }, [category, genreId, page]); 

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingRef.current && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, isLoading, hasMore]);

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    console.log('[Play Button Clicked] Item clicked:', item.title, item);
    openRightSidebar(item);
  };

  const handleAlbumClick = (item) => {
    console.log('[Detail]', item.title);
    openRightSidebar(item);
  };

  const getEmoji = () => {
    if (category === 'music') return '🎤';
    if (category === 'movie') return '🍿';
    if (category === 'book') return '📚';
    return '✨';
  };

  return (
    <div className="uhd-albums-container">
      <div className="uhd-albums-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'block', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #555', color: 'white', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', marginBottom: '15px' }}>
              ← Back
            </button>
          )}
          <div>
            <h1 className="hover-trigger" style={{ textTransform: 'capitalize', cursor: 'default' }}>
              <AnimatedText text={`${genreName} ${category}s`} />
            </h1>
            <p>Top {category}s for {genreName}.</p>
          </div>
        </div>
      </div>
      {
        items.length > 0 && (
          <div className="uhd-albums-grid media-album-grid">
            {items.map((item, index) => (
              <MediaAlbum
                key={item._key + index} 
                item={item}
                onClick={handleAlbumClick}
                onPlayClick={handlePlayClick}
              />
            ))}
          </div>
        )}

      {/* Loading Indicator & Observer Target */}
      <div
        ref={observerTarget}
        style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}
      >
        {isLoading ? <h2>{getEmoji()} Fetching {category}s... Please wait.</h2> : (!hasMore && items.length > 0 ? "No more items to load." : "")}
      </div>
    </div>
  );
}
