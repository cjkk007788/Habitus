import React from 'react';
import ArchivingForm from './components/ArchivingForm';
import MusicDetails from './details/MusicDetails';
import BookDetails from './details/BookDetails';
import MovieDetails from './details/MovieDetails';
import MoviePersonDetails from './details/MoviePersonDetails';

import useRightSidebarLogic from './hooks/useRightSidebarLogic';
import RightSidebarHeader from './components/RightSidebarHeader';
import RightSidebarMeta from './components/RightSidebarMeta';
import StagedItemsList from './components/StagedItemsList';
import MixStagingArea from './components/MixStagingArea';
import RightSidebarFooter from './components/RightSidebarFooter';

import './RightSidebar.css';

export default function RightSidebar() {
  const {
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

      {activeSidebarItem._viewType === 'mix' ? (
        //분기로직 activeSidebarItem.viewtype을 확인하는 로직
        <MixStagingArea />
      ) : (
        <>
          {/* Top Indicators for Staging */}
          {stagedItems.length > 0 && (
            <div className="rs-top-indicators">
              {stagedItems.map((_, idx) => (
                <div
                  key={idx}
                  className={`rs-staged-indicator ${viewingStagedIndex === idx ? 'active' : ''}`}
                  onClick={() => setViewingStagedIndex(idx)}
                >
                  {idx + 1}
                </div>
              ))}
              <div
                className={`rs-staged-indicator ${viewingStagedIndex === null ? 'active' : ''}`}
                onClick={() => setViewingStagedIndex(null)}
                title="Current Selection"
              >
                +
              </div>
            </div>
          )}

          {/* Album Title Input */}
          {stagedItems.length > 0 && (
            <div className="rs-album-title-input-container">
              <input
                type="text"
                className="rs-album-title-input"
                placeholder="Enter Album Title..."
                value={stagedAlbumTitle}
                onChange={(e) => setStagedAlbumTitle(e.target.value)}
              />
            </div>
          )}

          <div className="rs-scroll-area" ref={scrollRef}>
            {/* 3. Meta Info Area */}
            <RightSidebarMeta
              categoryLabel={categoryLabel}
              year={year}
              item={item}
              creatorName={creatorName}
            />

            {isMusic && <MusicDetails item={item} />}
            {isBook && <BookDetails item={item} />}
            {isMovie && <MovieDetails item={item} />}
            {isMoviePerson && <MoviePersonDetails item={item} />}

            <div className="rs-divider" />

            {/* 5. Archiving Form Area */}
            <ArchivingForm formState={formState} setFormState={handleSetFormState} />

            {/* Bottom Staged Items List */}
            <StagedItemsList
              viewingStagedIndex={viewingStagedIndex}
              setViewingStagedIndex={setViewingStagedIndex}
            />
          </div>
        </>
      )}

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
