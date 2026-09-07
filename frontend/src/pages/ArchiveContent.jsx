import React from 'react';
import './Archive.css';
import useArchiveUIStore from '../store/archive/useArchiveUIStore';
import { useResolvedArchiveAlbums } from '../components/Archive/hooks/useResolvedArchiveAlbums';
import { useGroupedAlbums } from '../components/Archive/hooks/useGroupedAlbums';
import ArchiveMixGroup from '../components/Archive/ArchiveMixGroup';
import ArchiveAlbumRow from '../components/ArchiveAlbumRow/ArchiveAlbumRow';

export default function ArchiveContent() {
  const { clearArchiveDisplay, removeRowFromArchive, removeGroupFromArchive } = useArchiveUIStore();

  const displayedAlbums = useResolvedArchiveAlbums();
  const groupedAlbums = useGroupedAlbums(displayedAlbums);

  return (
    <div className="archive-content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
