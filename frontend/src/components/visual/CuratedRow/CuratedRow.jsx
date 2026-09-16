import React, { useState, useEffect } from 'react';
import { fetchCurationItems } from '../../../api/curationApi';
import MediaAlbum from '../../common/MediaAlbum/MediaAlbum';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import useCacheStore from '../../../store/system/cacheStore';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import './CuratedRow.css';

// TTL 상수 (밀리초)
const CURATION_TTL = 30 * 60 * 1000; // 큐레이션: 30분

// Fallback colors matching RecommendationAlbums
const fallbackColors = [
  '#E05263', '#F2994A', '#27AE60', '#2D9CDB', '#9B51E0',
  '#F2C94C', '#EB5757', '#6FCF97', '#56CCF2', '#BB6BD9',
  '#333333', '#4F4F4F', '#828282', '#BDBDBD', '#E0E0E0'
];

export default function CuratedRow({ category, curationId, title }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openRightSidebar } = useSidebarStore();
  const { getCache, setCache } = useCacheStore();

  useEffect(() => {
    const loadData = async () => {
      const cacheKey = `curated_v2_${category}_${curationId}`;

      // 캐시 hit → 포맷 변환 결과까지 캐시되므로 즉시 렌더링
      const cached = getCache(cacheKey, CURATION_TTL);
      if (cached) {
        setItems(cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      //async await 이게 비동기 방법이다.
      const data = await fetchCurationItems(category, curationId, 1, 20);
      console.log(`[CuratedRow DEBUG] ${category}_${curationId} fetch result length:`, data.length, 'Data:', data);

      if (data.length === 0) {
        console.warn(`[CuratedRow DEBUG] ${category}_${curationId} fetched empty data! This is why it disappears.`);
      }

      // Formatting logic similar to RecommendationAlbums
      let formattedItems = [];
      if (category === 'music') {
        formattedItems = data.map((item, idx) => {
          // Last.fm top tracks vs top artists format check
          const isArtist = curationId === 'top_artists';

          let imgUrl = item.image_url || null;
          // Extract track image from Last.fm's weird image array format ONLY if we didn't get one from iTunes
          if (!imgUrl && !isArtist && item.image && Array.isArray(item.image)) {
            const largeImage = item.image.find(img => img.size === 'extralarge') || item.image[item.image.length - 1];
            if (largeImage && largeImage['#text']) {
              imgUrl = largeImage['#text'];
            }
          }

          const genres = item.genre ? [item.genre] : [];

          return {
            _key: item.mbid || item.name + idx,
            id: item.mbid || item.name,
            mbid: item.mbid || null,
            itemType: isArtist ? 'music_artist' : 'music',
            title: item.name,
            image_url: imgUrl,
            previewUrl: item.preview_url || null,
            coverImages: [],
            bgColor: fallbackColors[idx % fallbackColors.length],
            genres: genres,
            userMeta: {
              genreTags: genres
            },
            mediaMeta: {
              contributors: [{ name: isArtist ? '' : (item.artist?.name || 'Unknown Artist') }],
              playcount: item.playcount,
              trackLinks: {
                apple: item.apple_music_url,
                lastfm: item.url
              }
            }
          };
        });
      } else if (category === 'movie') {
        const TMDB_GENRE_MAP = {
          28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
          80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
          14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
          9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
          10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
        };

        formattedItems = data.map((item, idx) => {
          const isPerson = curationId === 'trending_persons';
          const genres = [];
          if (!isPerson && Array.isArray(item.genre_ids)) {
            item.genre_ids.forEach(id => {
              if (TMDB_GENRE_MAP[id]) genres.push(TMDB_GENRE_MAP[id]);
            });
          }

          return {
            _key: item.id,
            id: item.id,
            external_id: item.external_id || item.id,
            itemType: 'movie',  // 정규화: movie_person → movie
            type: isPerson ? 'Person' : 'Movie',
            title: item.title,
            subtitle: item.subtitle || '',
            image_url: isPerson ? item.image_url : item.poster_path,
            coverImages: [],
            bgColor: fallbackColors[idx % fallbackColors.length],
            genres: genres,
            userMeta: {
              genreTags: genres
            },
            mediaMeta: {
              releaseYear: item.release_date ? item.release_date.substring(0, 4) : 'Unknown',
              overview: item.overview || '',
              vote_average: item.vote_average || 0,
              contributors: [],
              role: isPerson ? 'person' : undefined,  // 정규화: role을 mediaMeta에 보존
              department: item.department || undefined,
            }
          };
        });
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
            bgColor: fallbackColors[idx % fallbackColors.length],
            mediaMeta: {
              releaseYear: volumeInfo.publishedDate ? String(volumeInfo.publishedDate).substring(0, 4) : 'Unknown',
              contributors: volumeInfo.authors && Array.isArray(volumeInfo.authors) ? volumeInfo.authors.map(a => ({ role: 'Author', name: a })) : [{ role: 'Author', name: 'Unknown' }],
              overview: volumeInfo.description,
              publisher: volumeInfo.publisher,
              pageCount: volumeInfo.pageCount,
              previewLink: volumeInfo.previewLink || volumeInfo.infoLink
            }
          };
        });
      }

      // 포맷 변환 결과를 캐시에 저장 (다음에 오면 변환 없이 바로 쓈 수 있음)
      setCache(cacheKey, formattedItems);
      setItems(formattedItems);
      setIsLoading(false);
      console.log(`[CuratedRow DEBUG] ${category}_${curationId} rendered items length:`, formattedItems.length);
    };

    loadData();
  }, [category, curationId]);

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    openRightSidebar(item);
  };

  const handleAlbumClick = (item) => {
    openRightSidebar(item);
  };

  if (isLoading) {
    return (
      <div className="curated-row-container">
        <h2 className="curated-row-title hover-trigger" style={{ cursor: 'default' }}>
          <AnimatedText text={title} />
        </h2>
        <div style={{ padding: '0 20px', color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Do not render the row if no items
  }

  return (
    <div className="curated-row-container" id={`curation-${curationId}`}>
      <h2 className="curated-row-title hover-trigger" style={{ cursor: 'default' }}>
        <AnimatedText text={title} />
      </h2>
      <div className="curated-row-scroll media-album-grid">
        {items.map((item, index) => (
          <div key={item._key + index} className="curated-row-item">
            <MediaAlbum
              item={item}
              onClick={handleAlbumClick}
              onPlayClick={handlePlayClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
