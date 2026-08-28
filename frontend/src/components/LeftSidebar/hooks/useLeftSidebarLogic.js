import { useState } from 'react';
import { useArchiveStore } from '../../../store/archive';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import useSidebarFilter from '../useSidebarFilter';

export default function useLeftSidebarLogic() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('albums');
  const [sortOption, setSortOption] = useState('date');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const {
    albums, items, mixes, clearArchive,
    clearStagedItems, isSelectionMode, setIsSelectionMode
  } = useArchiveStore();
  const { toggleSidebar, openRightSidebar } = useSidebarStore();

  const handleCreate = (type) => {
    setIsAddMenuOpen(false);
    clearStagedItems();

    if (type === 'album') {
      openRightSidebar();
      //openRightSidebar({ id: 'album_new', _viewType: 'album', albumTitle: '' });
    } else if (type === 'mix') {
      setIsSelectionMode(true);
      openRightSidebar({ id: 'mix_new', _viewType: 'mix', mixTitle: '' });
    }
  };

  const processedList = useSidebarFilter(viewMode, typeFilter, sortOption, albums, items, mixes);
  const isStoreEmpty = (!items || items.length === 0) && (!albums || albums.length === 0);

  return {
    isCollapsed,
    setIsCollapsed,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
    typeFilter,
    setTypeFilter,
    isAddMenuOpen,
    setIsAddMenuOpen,
    handleCreate,
    processedList,
    isStoreEmpty,
    clearArchive,
    isSelectionMode
  };
}
