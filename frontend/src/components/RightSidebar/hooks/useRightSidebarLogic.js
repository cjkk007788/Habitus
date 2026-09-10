import { useState, useEffect, useRef } from 'react';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import { useArchiveStore } from '../../../store/archive';

export default function useRightSidebarLogic() {
  const { activeSidebarItem } = useSidebarStore();
  const {
    items,
    stagedItems, clearStagedItems,
    draftForm, setDraftForm, clearDraftForm, updateStagedItemForm,
    stagedAlbumTitle, setStagedAlbumTitle, setStagedItems,
    setEditingAlbumId
  } = useArchiveStore();

  const scrollRef = useRef(null);
  const prevItemIdRef = useRef(null);
  const [viewingStagedIndex, setViewingStagedIndex] = useState(null);

  const formState = viewingStagedIndex !== null && stagedItems[viewingStagedIndex]
    ? stagedItems[viewingStagedIndex].formState
    : draftForm;

  const handleSetFormState = (updater) => {
    if (viewingStagedIndex !== null) {
      updateStagedItemForm(viewingStagedIndex, updater);
    } else {
      setDraftForm(updater);
    }
  };

  useEffect(() => {
    const currentId = activeSidebarItem?.id || activeSidebarItem?.mbid || activeSidebarItem?.title;

    // 타겟 아이템이 바뀌지 않았다면 (배경에서 items 배열만 업데이트된 경우)
    // 폼 상태를 날리거나 0번으로 튕기는 현상을 방지하기 위해 일찍 종료합니다.
    if (currentId === prevItemIdRef.current) {
      return;
    }

    prevItemIdRef.current = currentId;
    setViewingStagedIndex(null);

    if (activeSidebarItem) {
      if (activeSidebarItem._viewType === 'album' || (activeSidebarItem.id && String(activeSidebarItem.id).startsWith('album_'))) {
        // 가상 앨범(리포트)인 경우 실제 DB 저장을 방지하기 위해 editingAlbumId를 설정하지 않음
        if (activeSidebarItem.id && String(activeSidebarItem.id).startsWith('report-virtual-')) {
          setEditingAlbumId(null);
        } else {
          setEditingAlbumId(activeSidebarItem.id);
        }
        setStagedAlbumTitle(activeSidebarItem.albumTitle || '');
        const albumItems = (activeSidebarItem.itemIds || [])
          .map(id => items.find(i => i.id === id))
          .filter(Boolean);

        const mappedStaged = albumItems.map(albumItem => ({
          itemData: albumItem,
          formState: {
            rating: albumItem.rating || 0,
            isPublic: albumItem.isPublic ?? true,
            review: albumItem.impression || '',
            tags: Array.isArray(albumItem.userMeta?.tags) ? albumItem.userMeta.tags : (albumItem.tags || []),
          }
        }));
        setStagedItems(mappedStaged);

        if (mappedStaged.length > 0) {
          setViewingStagedIndex(0);
        }
      } else if (activeSidebarItem._viewType === 'item') {
        setDraftForm({
          rating: activeSidebarItem.rating || 0,
          isPublic: activeSidebarItem.isPublic ?? true,
          review: activeSidebarItem.impression || '',
          tags: Array.isArray(activeSidebarItem.userMeta?.tags) ? activeSidebarItem.userMeta.tags : [],
        });
        clearStagedItems();
      } else {
        clearDraftForm();
      }
    } else {
      clearDraftForm();
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeSidebarItem, items]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [viewingStagedIndex]);

  const item = viewingStagedIndex !== null && stagedItems[viewingStagedIndex]
    ? stagedItems[viewingStagedIndex].itemData
    : activeSidebarItem;

  const isMusic = item?.itemType === 'music' || item?.itemType === 'music_artist';
  const isMovie = item?.itemType === 'movie';
  const isMoviePerson = item?.itemType === 'movie_person';
  const isBook = item?.itemType === 'book';

  const categoryLabel = isMusic ? '🎵 Music' : isMovie ? '🎬 Movie' : isMoviePerson ? '👤 Movie Person' : isBook ? '📚 Book' : item?.mixTitle ? '📦 Mix' : 'Content';

  const getCreatorName = (it) => {
    if (!it) return 'Unknown';
    if (it.itemType === 'music_artist') return 'Artist';
    if (it.itemType === 'movie_person') return it.mediaMeta?.department || 'Movie Person';
    if (it.itemType === 'movie') return 'Movie';
    if (it.itemType === 'book') {
      const contributors = it.mediaMeta?.contributors;
      if (contributors && contributors.length > 0) {
        return contributors[0].name || 'Author';
      }
      return 'Unknown Author';
    }
    const contributors = it.mediaMeta?.contributors;
    if (contributors && contributors.length > 0) {
      return contributors[0].name || 'Unknown Artist';
    }
    return 'Unknown Artist';
  };

  const year = item?.releaseDate ? item.releaseDate.substring(0, 4) : (item?.mediaMeta?.releaseYear || 'Unknown Year');
  const creatorName = getCreatorName(item);

  return {
    activeSidebarItem,
    stagedItems,
    stagedAlbumTitle,
    setStagedAlbumTitle,
    scrollRef,
    viewingStagedIndex,
    setViewingStagedIndex,
    formState,
    handleSetFormState,
    item,
    isMusic,
    isMovie,
    isMoviePerson,
    isBook,
    categoryLabel,
    year,
    creatorName
  };
}
