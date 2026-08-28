import { useMemo } from 'react';

export function useGroupedAlbums(displayedAlbums) {
  return useMemo(() => {
    const groupedAlbums = [];
    displayedAlbums.forEach(album => {
      if (album.sourceId !== 'standalone') {
        let group = groupedAlbums.find(g => g.type === 'mix_group' && g.sourceId === album.sourceId);
        if (!group) {
          group = { type: 'mix_group', sourceId: album.sourceId, items: [] };
          groupedAlbums.push(group);
        }
        group.items.push(album);
      } else {
        groupedAlbums.push(album);
      }
    });
    return groupedAlbums;
  }, [displayedAlbums]);
}
