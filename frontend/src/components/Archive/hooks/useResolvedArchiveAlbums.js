import { useArchiveStore } from '../../../store/archive';
import useArchiveUIStore from '../../../store/archive/useArchiveUIStore';

export function useResolvedArchiveAlbums() {
  const { albums, items } = useArchiveStore();
  const archiveDisplayItems = useArchiveUIStore((state) => state.archiveDisplayItems);

  return archiveDisplayItems
    .map((item) => {
      // 0. 믹스 헤더 처리
      if (item.type === 'mix_header') {
        const mix = useArchiveStore.getState().mixes.find((m) => m.id === item.targetId);
        if (mix) {
          return {
            id: `mix_header_${item.sourceId}`,
            sourceId: item.sourceId,
            targetId: item.targetId,
            type: 'mix_header',
            albumTitle: mix.mixTitle,
          };
        }
      }
      
      // 1. 단일 아이템들을 묶은 가상 앨범 처리
      if (item.type === 'mix_items') {
        const mix = useArchiveStore.getState().mixes.find((m) => m.id === item.targetId);
        if (mix) {
          return {
            id: `mix_items_${item.sourceId}_${item.targetId}`,
            sourceId: item.sourceId,
            targetId: item.targetId,
            type: 'mix_items',
            albumTitle: `${mix.mixTitle} (단일 아이템 모음)`,
            category: 'mix',
            itemIds: mix.itemIds,
          };
        }
      }
      
      // 2. 일반 앨범 처리
      if (item.type === 'album') {
        const album = albums.find((c) => c.id === item.targetId);
        if (album) {
          return {
            ...album,
            id: `album_${item.sourceId}_${item.targetId}`, // React key를 위해 유니크하게 만듦
            sourceId: item.sourceId,
            targetId: item.targetId,
            type: 'album',
          };
        }
      }
      return null;
    })
    .filter(Boolean)
    .map((album) => {
      if (album.type === 'mix_header') return album;
      
      return {
        ...album,
        resolvedItems: (album.itemIds || [])
          .map((itemId) => items.find((i) => i.id === itemId))
          .filter(Boolean),
      };
    });
}
