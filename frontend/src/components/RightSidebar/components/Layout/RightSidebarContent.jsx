import React from 'react';
import MixStagingArea from '../Staging/MixStagingArea';
import AlbumTitleEditor from '../Staging/AlbumTitleEditor';
import RightSidebarMeta from './RightSidebarMeta';
import StagedImageCarousel from '../Staging/StagedImageCarousel';
import MusicDetails from '../Details/MusicDetails';
import BookDetails from '../Details/BookDetails';
import MovieDetails from '../Details/MovieDetails';
import MoviePersonDetails from '../Details/MoviePersonDetails';
import ArchivingForm from '../Form/ArchivingForm';
import StagedItemsList from '../Staging/StagedItemsList';

export default function RightSidebarContent({
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
}) {
  return (
    <>
      {activeSidebarItem._viewType === 'mix' && (activeSidebarItem.id === 'mix_new' || activeSidebarItem.id === 'mix_edit') ? (
        <MixStagingArea />
      ) : (
        <>
          {stagedItems.length > 0 && (
            <AlbumTitleEditor
              value={stagedAlbumTitle}
              onChange={setStagedAlbumTitle}
            />
          )}

          <div className="rs-scroll-area" ref={scrollRef}>
            <RightSidebarMeta
              categoryLabel={categoryLabel}
              year={year}
              item={item}
              creatorName={creatorName}
            />

            <StagedImageCarousel
              stagedItems={stagedItems}
              currentItem={item}
              viewingStagedIndex={viewingStagedIndex}
              setViewingStagedIndex={setViewingStagedIndex}
            />

            {isMusic && <MusicDetails item={item} />}
            {isBook && <BookDetails item={item} />}
            {isMovie && <MovieDetails item={item} />}
            {isMoviePerson && <MoviePersonDetails item={item} />}

            <div className="rs-divider" />

            <ArchivingForm formState={formState} setFormState={handleSetFormState} />

            <StagedItemsList
              viewingStagedIndex={viewingStagedIndex}
              setViewingStagedIndex={setViewingStagedIndex}
            />
          </div>
        </>
      )}
    </>
  );
}
