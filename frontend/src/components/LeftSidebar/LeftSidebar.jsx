import React from 'react';
import './LeftSidebar.css';
import useLeftSidebarLogic from './hooks/useLeftSidebarLogic';
import LeftSidebarHeader from './components/LeftSidebarHeader';
import LeftSidebarViewModes from './components/LeftSidebarViewModes';
import LeftSidebarFilters from './components/LeftSidebarFilters';
import LeftSidebarList from './components/LeftSidebarList';
import LeftSidebarFooter from './components/LeftSidebarFooter';

export default function LeftSidebar() {
  const {
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
  } = useLeftSidebarLogic();

  return (
    <aside className={`sidebar_container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar_inner">
        <LeftSidebarHeader
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isAddMenuOpen={isAddMenuOpen}
          setIsAddMenuOpen={setIsAddMenuOpen}
          handleCreate={handleCreate}
        />
        
        <LeftSidebarViewModes
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <LeftSidebarFilters
          sortOption={sortOption}
          setSortOption={setSortOption}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />

        <LeftSidebarList
          processedList={processedList}
          isSelectionMode={isSelectionMode}
          isStoreEmpty={isStoreEmpty}
        />

        <LeftSidebarFooter
          isStoreEmpty={isStoreEmpty}
          clearArchive={clearArchive}
        />
      </div>
    </aside>
  );
}
