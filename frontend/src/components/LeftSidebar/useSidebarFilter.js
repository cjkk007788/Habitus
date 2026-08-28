import { useMemo } from 'react';

export default function useSidebarFilter(viewMode, typeFilter, sortOption, albums, items, mixes) {
  const processedList = useMemo(() => {
    // ─ 1단계: viewMode에 따라 소스 배열 결정 ─
    let sourceList = [];

    switch (viewMode) {
      case 'albums':
        sourceList = (albums || []).map(album => {
          let derivedCoverImage = '';
          let derivedArtist = 'Unknown Artist';
          if (album.itemIds && album.itemIds.length > 0) {
            const randomIndex = Math.floor(Math.random() * album.itemIds.length);
            const randomItemId = album.itemIds[randomIndex];
            const randomItem = items.find(i => i.id === randomItemId);
            if (randomItem) {
              derivedCoverImage = randomItem.coverImages?.[0] || '';
              derivedArtist = randomItem.artists?.[0]
                || randomItem.mediaMeta?.contributors?.[0]?.name
                || 'Unknown Artist';
            }
          }
          return {
            ...album,
            _viewType: 'album',
            derivedCoverImage,
            derivedArtist
          };
        });
        break;
      case 'items':
        sourceList = (items || []).map(item => ({ ...item, _viewType: 'item' }));
        break;
      case 'mixes':
        sourceList = (mixes || []).map(mix => ({ ...mix, _viewType: 'mix' }));
        break;
      case 'artists': {
        // 아이템의 카테고리나 타입 문자열에 'artist' 또는 'person'이 포함되어 있거나 'movie_person'인 아이템 필터링
        sourceList = (items || [])
          .filter(item => {
            const typeStr = (item.category || '') + ' ' + (item.itemType || '') + ' ' + (item.type || '');
            const lowerType = typeStr.toLowerCase();
            return lowerType.includes('artist') || lowerType.includes('person') || item.itemType === 'movie_person';
          })
          .map(item => ({ ...item, _viewType: 'item' }));
        break;
      }
      default:
        sourceList = [];
    }

    // ─ 2단계: 타입 필터링 ─
    if (typeFilter !== 'all') {
      sourceList = sourceList.filter(entry => {
        if (entry._viewType === 'album') return entry.category === typeFilter;
        if (entry._viewType === 'item') return entry.itemType === typeFilter;
        // mixes는 타입 필터 해당 없음
        return true;
      });
    }

    // ─ 3단계: 정렬 ─
    sourceList = [...sourceList].sort((a, b) => {
      switch (sortOption) {
        case 'date': {
          const dateA = a.createdAt || a.date || '';
          const dateB = b.createdAt || b.date || '';
          return dateB.localeCompare(dateA); // 최신순 (내림차순)
        }
        case 'title': {
          const titleA = (a.albumTitle || a.mixTitle || a.title || '').toLowerCase();
          const titleB = (b.albumTitle || b.mixTitle || b.title || '').toLowerCase();
          return titleA.localeCompare(titleB); // 가나다/ABC순 (오름차순)
        }
        case 'rating': {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA; // 높은 별점 먼저
        }
        case 'releaseYear': {
          const yearA = a.mediaMeta?.releaseYear || 0;
          const yearB = b.mediaMeta?.releaseYear || 0;
          return yearB - yearA; // 최근 발매 먼저
        }
        case 'artist': {
          const artistA = (a.artists?.[0] || '').toLowerCase();
          const artistB = (b.artists?.[0] || '').toLowerCase();
          return artistA.localeCompare(artistB);
        }
        default:
          return 0;
      }
    });

    return sourceList;
  }, [viewMode, typeFilter, sortOption, albums, items, mixes]);

  return processedList;
}
