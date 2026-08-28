import React from 'react';
import './Archive.css';
import useArchiveUIStore from '../store/archive/useArchiveUIStore';
import { useResolvedArchiveAlbums } from '../components/Archive/hooks/useResolvedArchiveAlbums';
import { useGroupedAlbums } from '../components/Archive/hooks/useGroupedAlbums';
import ArchiveEmptyState from '../components/Archive/ArchiveEmptyState';
import ArchiveMixGroup from '../components/Archive/ArchiveMixGroup';
import ArchiveAlbumRow from '../components/ArchiveAlbumRow/ArchiveAlbumRow';

export default function Archive() {
  const { clearArchiveDisplay, removeRowFromArchive, removeGroupFromArchive } = useArchiveUIStore();
  
  const displayedAlbums = useResolvedArchiveAlbums();
  const groupedAlbums = useGroupedAlbums(displayedAlbums);

  if (displayedAlbums.length === 0) {
    return <ArchiveEmptyState />;
  }

  return (
    <div className="archive-container">
      <div className="archive-header">
        <h1 className="archive-title">My Archive</h1>
        <button className="archive-clear-btn" onClick={clearArchiveDisplay}>
          모두 닫기
        </button>
      </div>

      {groupedAlbums.map((groupOrAlbum) => {
        if (groupOrAlbum.type === 'mix_group') {
          return (
            <ArchiveMixGroup
              key={`mix_group_${groupOrAlbum.sourceId}`}
              group={groupOrAlbum}
              onRemove={() => removeGroupFromArchive(groupOrAlbum.sourceId)}
            />
          );
        }

        return (
          <div key={groupOrAlbum.id} className="archive-standalone-album">
            <ArchiveAlbumRow
              album={groupOrAlbum}
              onRemove={() => removeRowFromArchive(groupOrAlbum.sourceId, groupOrAlbum.targetId)}
            />
          </div>
        );
      })}
    </div>
  );
}
