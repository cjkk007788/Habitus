import React from 'react';
import ArchivingForm from './components/Form/ArchivingForm';
import useRightSidebarLogic from './hooks/useRightSidebarLogic';
import RightSidebarHeader from './components/Layout/RightSidebarHeader';
import RightSidebarContent from './components/Layout/RightSidebarContent';
import RightSidebarFooter from './components/Layout/RightSidebarFooter';

import './RightSidebar.css';

export default function RightSidebar() {
  const {
    activeSidebarItem,
    stagedItems,
    stagedAlbumTitle,
    setStagedAlbumTitle,
    stagedAlbumCover,
    setStagedAlbumCover,
    stagedAlbumDescription,
    setStagedAlbumDescription,
    stagedAlbumLayout,
    setStagedAlbumLayout,
    scrollRef,
    viewingStagedIndex,
    setViewingStagedIndex,
    formState,
    handleSetFormState,
    item,
    isMusic,
    isMovie,
    isBook,
    categoryLabel,
    year,
    creatorName
  } = useRightSidebarLogic();

  // state of Rightsidebar Open
  if (!activeSidebarItem) {
    return (
      <div className="right-sidebar">
        <RightSidebarHeader />
        <div className="rs-scroll-area" style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
            No content selected.<br /><br />
            Click albums.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="right-sidebar">
      {/* 1. Header */}
      <RightSidebarHeader />
      <RightSidebarContent
        activeSidebarItem={activeSidebarItem}
        stagedItems={stagedItems}
        stagedAlbumTitle={stagedAlbumTitle}
        setStagedAlbumTitle={setStagedAlbumTitle}
        stagedAlbumCover={stagedAlbumCover}
        setStagedAlbumCover={setStagedAlbumCover}
        stagedAlbumDescription={stagedAlbumDescription}
        setStagedAlbumDescription={setStagedAlbumDescription}
        stagedAlbumLayout={stagedAlbumLayout}
        setStagedAlbumLayout={setStagedAlbumLayout}
        scrollRef={scrollRef}
        viewingStagedIndex={viewingStagedIndex}
        setViewingStagedIndex={setViewingStagedIndex}
        formState={formState}
        handleSetFormState={handleSetFormState}
        item={item}
        isMusic={isMusic}
        isMovie={isMovie}
        isBook={isBook}
        categoryLabel={categoryLabel}
        year={year}
        creatorName={creatorName}
      />

      {/* Sticky Bottom Action */}
      <RightSidebarFooter
        viewingStagedIndex={viewingStagedIndex}
        setViewingStagedIndex={setViewingStagedIndex}
        clearDraftForm={() => handleSetFormState({ rating: 0, isPublic: true, review: '', tags: [] })}
        scrollRef={scrollRef}
      />
    </div>
  );
}
