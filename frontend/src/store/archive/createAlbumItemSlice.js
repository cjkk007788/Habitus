import { v4 as uuidv4 } from 'uuid';
import { createItem, createAlbum, linkItemsToAlbum, updateItem, updateAlbum, syncItemsToAlbum } from '../../api/archiveApi';

// 카드 내부 아이템들의 타입을 분석하여 최종 카드의 카테고리를 결정하는 유틸 함수
const calculateAlbumCategory = (itemTypes) => {
  if (!itemTypes || itemTypes.length === 0) return 'fusion';
  
  // 중복 제거 로직
  const uniqueCategories = [...new Set(itemTypes.filter(Boolean))];
  
  if (uniqueCategories.length > 1) {
    return 'fusion';
  } else if (uniqueCategories.length === 1) {
    return uniqueCategories[0]; // 음악만 있으면 음악, 아티스트만 있으면 아티스트
  }
  return 'fusion';
};

export const createAlbumItemSlice = (set, get) => ({
  items: [],
  albums: [],

  // 단일 아이템만 저장 (앨범 없이)
  addSingleItem: async (itemData) => {
    try {
      const timestamp = new Date().toISOString();
      const payload = {
        title: itemData.title || itemData.name || 'Untitled Item',
        item_type: itemData.itemType || itemData.category || 'music',
        external_id: itemData.apiMeta?.rawId || itemData.mbid || String(itemData.id || ''),
        external_source: itemData.apiMeta?.provider || '',
        rating: Number(itemData.rating) || 0,
        impression: itemData.impression || itemData.review || '',
        description: itemData.review || '',
        cover_image_url: Array.isArray(itemData.coverImages) && itemData.coverImages.length > 0
          ? itemData.coverImages[0]
          : (itemData.coverImageUrl || itemData.coverImage || itemData.image_url || ''),
        genres: itemData.userMeta?.genreTags || [],
        media_meta: {
          ...itemData.mediaMeta,
          artists: Array.isArray(itemData.artists) ? itemData.artists : (typeof itemData.artists === 'string' ? [itemData.artists] : []),
          rawFrontendData: itemData
        },
        user_meta: {
          tags: Array.isArray(itemData.tags) ? itemData.tags : (itemData.userMeta?.tags || []),
          mood: itemData.mood || itemData.userMeta?.mood || '',
          context: itemData.userMeta?.context || []
        },
        links: []
      };

      const createdItem = await createItem(payload);

      const localItem = {
        ...itemData,
        id: createdItem.id,
        itemType: createdItem.item_type,
        title: createdItem.title,
        coverImages: [createdItem.cover_image_url],
        rating: createdItem.rating,
        impression: createdItem.impression,
        isPublic: createdItem.is_public,
        date: createdItem.created_at || timestamp,
      };

      set((state) => ({
        items: [...state.items, localItem]
      }));

    } catch (error) {
      console.error("Failed to save single item to backend DB:", error);
      alert("아이템 저장에 실패했습니다.");
    }
  },

  //핵심 트랜잭션 함수: 여러 개의 아이템을 받아 저장하고, 이를 묶는 카드 생성
  //이 함수를 사용하기전, albumData와 itemsArray를 먼저 채우고 전달한다.
  addAlbumWithItems: async (albumData, itemsArray) => {
    try {
      const timestamp = new Date().toISOString();
      const localItemsToInsert = [];
      const savedItemIds = [];
      const backendTypes = [];

      // 1. 백엔드에 개별 아이템 생성 (SQLite 저장) 및 중복 체크
      for (const item of itemsArray) {
        const externalId = item.apiMeta?.rawId || item.mbid || String(item.id || '');
        
        // 중복 체크 로직
        const existingItem = get().items.find(i => 
          externalId && (
            (i.apiMeta?.rawId === externalId) || 
            (i.mbid === externalId) ||
            (i.external_id === externalId) ||
            (i.id === externalId)
          )
        );

        if (existingItem && !existingItem.isTemp) {
          // 이미 백엔드에 저장된 경우 새로 생성하지 않고 기존 ID 활용
          savedItemIds.push(existingItem.id);
          backendTypes.push(existingItem.itemType || existingItem.item_type || 'music');
        } else {
          // 존재하지 않는 경우 새롭게 생성
          const payload = {
            title: item.title || item.name || 'Untitled Item',
            item_type: item.itemType || item.category || 'music', // 카드의 껍데기 카테고리가 아닌 본연의 타입 보존
            external_id: externalId,
            external_source: item.apiMeta?.provider || '',
            rating: Number(item.rating) || 0,
            impression: item.impression || item.review || '',
            description: item.review || '',
            cover_image_url: Array.isArray(item.coverImages) && item.coverImages.length > 0
              ? item.coverImages[0]
              : (item.coverImageUrl || item.coverImage || item.image_url || ''),
            genres: item.userMeta?.genreTags || [],
            media_meta: {
              ...item.mediaMeta,
              artists: Array.isArray(item.artists) ? item.artists : (typeof item.artists === 'string' ? [item.artists] : []),
              rawFrontendData: item // 원본 데이터 보존
            },
            user_meta: {
              tags: Array.isArray(item.tags) ? item.tags : (item.userMeta?.tags || []),
              mood: item.mood || item.userMeta?.mood || '',
              context: item.userMeta?.context || []
            },
            links: [] // TODO: links array mapping
          };

          const createdItem = await createItem(payload);
          savedItemIds.push(createdItem.id);
          backendTypes.push(createdItem.item_type);

          localItemsToInsert.push({
            ...item,
            id: createdItem.id,
            itemType: createdItem.item_type,
            title: createdItem.title,
            coverImages: [createdItem.cover_image_url],
            rating: createdItem.rating,
            impression: createdItem.impression,
            isPublic: createdItem.is_public,
            date: createdItem.created_at || timestamp,
          });
        }
      }

      const finalCategory = calculateAlbumCategory(backendTypes);

      // 2. 백엔드에 카드 생성 (SQLite 저장)
      const albumPayload = {
        title: albumData.albumTitle || 'Untitled Album',
        category: finalCategory,
        is_public: false
      };
      //카드를 생성하는 API 백앤드에 전달 후 카드의 아이디를 받음
      const createdAlbum = await createAlbum(albumPayload);

      // 3. 카드에 아이템 연결
      if (savedItemIds.length > 0) {
        console.log("[addAlbumWithItems] linking items to album:", createdAlbum.id, "itemIds:", savedItemIds);
        //백엔드에 카드와 아이탬들의 아이디를 연결함.
        await linkItemsToAlbum(createdAlbum.id, savedItemIds);
      }

      const localAlbum = {
        id: createdAlbum.id,
        albumTitle: createdAlbum.title,
        category: finalCategory,
        itemIds: savedItemIds,
        isPublic: createdAlbum.is_public,
        createdAt: createdAlbum.created_at || timestamp,
        updatedAt: createdAlbum.updated_at || timestamp,
        isDeleted: false,
      };
      //zustand DB저장이 끝난 후 새로 생성된 아이탬들만 로컬에 추가 (기존 임시 아이템 교체 로직 포함)
      set((state) => {
        const newItems = state.items.filter(item => {
          // 만약 이번에 새로 백엔드에 저장된 아이템이 기존 로컬의 임시 아이템(isTemp)이었다면 
          // 중복을 방지하기 위해 기존 임시 아이템을 목록에서 제거합니다.
          const isReplacedTempItem = localItemsToInsert.some(
            inserted => (inserted.external_id === item.external_id || inserted.id === item.id) && item.isTemp
          );
          return !isReplacedTempItem;
        });

        return {
          items: [...newItems, ...localItemsToInsert],
          albums: [...state.albums, localAlbum]
        };
      });

    } catch (error) {
      console.error("Failed to save to backend DB:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      throw error;  // 호출부에서 처리할 수 있도록 re-throw
    }
  },

  // 편집 중인 카드 전체 업데이트 로직 (기존 아이템은 수정, 새 아이템은 생성)
  updateAlbumWithStagedItems: (albumId, albumTitle, stagedItemsArray) => {
    const timestamp = new Date().toISOString();
    set((state) => {
      let newItems = [...state.items];
      let updatedItemIds = [];

      stagedItemsArray.forEach(st => {
        const d = st.itemData;
        const coverImages = Array.isArray(d.coverImages) && d.coverImages.length > 0 ? d.coverImages : (d.image_url ? [d.image_url] : []);

        const existingItemIndex = newItems.findIndex(i => i.id === d.id);
        
        if (existingItemIndex !== -1) {
          // 1. 기존에 스토어에 존재하는 아이템인 경우 (업데이트)
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            coverImages,
            rating: st.formState.rating,
            impression: st.formState.review,
            userMeta: { ...(newItems[existingItemIndex].userMeta || {}), tags: st.formState.tags },
            isPublic: st.formState.isPublic
          };
          updatedItemIds.push(d.id);
        } else {
          // 2. 스테이징 과정에서 새로 추가된 아이템인 경우 (신규 생성)
          const newItemId = uuidv4();
          newItems.push({
            ...d, // 모든 메타데이터 보존
            id: newItemId,
            isTemp: true, // 아직 백엔드에 저장되지 않은 임시 아이템임을 표시
            itemType: d.itemType || d.category || 'music', // 본연의 타입 보존
            title: d.title || 'Untitled Item',
            coverImages,
            artists: Array.isArray(d.artists) ? d.artists : (typeof d.artists === 'string' ? [d.artists] : []),
            rating: Number(st.formState.rating) || 0,
            status: 'want',
            impression: st.formState.review || '',
            date: timestamp,
            isDeleted: false,
            userMeta: { tags: st.formState.tags || [], genreTags: [], mood: '', context: [] },
            isPublic: st.formState.isPublic
          });
          updatedItemIds.push(newItemId);
        }
      });

      // 3. 카드의 정보를 새로운 itemIds 리스트와 타이틀로 갱신
      const updatedItemTypes = updatedItemIds.map(id => {
        const item = newItems.find(i => i.id === id);
        return item ? item.itemType : 'music';
      });
      const finalCategory = calculateAlbumCategory(updatedItemTypes);

      const newAlbums = state.albums.map(c => c.id === albumId ? {
        ...c,
        albumTitle: albumTitle,
        category: finalCategory,
        itemIds: updatedItemIds,
        updatedAt: timestamp
      } : c);

      return { items: newItems, albums: newAlbums };
    });
  },

  // 기존 카드에 새로운 아이템 단일 추가
  addItemToAlbum: (albumId, item) => {
    set((state) => {
      const targetAlbum = state.albums.find(c => c.id === albumId);
      if (!targetAlbum) return state; // 카드가 존재하지 않으면 무시

      const timestamp = new Date().toISOString();
      const itemId = uuidv4();

      // 데이터 정규화 및 객체 생성
      const newItem = {
        id: itemId,
        isTemp: true, // 로컬 임시 데이터 표시
        itemType: item.itemType || item.category || 'music',
        title: item.title || 'Untitled Item',
        coverImages: Array.isArray(item.coverImages) ? item.coverImages : (item.coverImageUrl ? [item.coverImageUrl] : (item.coverImage ? [item.coverImage] : [])),
        artists: Array.isArray(item.artists) ? item.artists : (typeof item.artists === 'string' ? [item.artists] : []),
        rating: Number(item.rating) || 0,
        status: item.status || 'want',
        impression: item.impression || '',
        date: timestamp,
        isDeleted: false,
        userMeta: {
          tags: Array.isArray(item.tags) ? item.tags : (item.userMeta?.tags || []),
          genreTags: item.userMeta?.genreTags || [],
          mood: item.mood || item.userMeta?.mood || '',
          context: item.userMeta?.context || []
        },
        mediaMeta: {
          originalOrder: item.mediaMeta?.originalOrder || null,
          releaseYear: item.releaseYear ? Number(item.releaseYear) : (item.mediaMeta?.releaseYear || null),
          duration: item.mediaMeta?.duration || '',
          language: item.mediaMeta?.language || '',
          contributors: item.mediaMeta?.contributors || [],
          genre: item.mediaMeta?.genre || ''
        },
        linkMeta: {
          urls: item.url ? [item.url] : (item.linkMeta?.urls || [])
        },
        apiMeta: item.apiMeta || {
          provider: '',
          rawId: '',
          metrics: {}
        }
      };

      return {
        items: [...state.items, newItem],
        albums: state.albums.map(album => {
          if (album.id === albumId) {
            const updatedItemIds = [...album.itemIds, itemId];
            const updatedItemTypes = updatedItemIds.map(id => {
              if (id === itemId) return newItem.itemType;
              const existingItem = state.items.find(i => i.id === id);
              return existingItem ? existingItem.itemType : 'music';
            });
            return {
              ...album,
              category: calculateAlbumCategory(updatedItemTypes),
              itemIds: updatedItemIds,
              updatedAt: timestamp
            };
          }
          return album;
        })
      };
    });
  },

  // Album 삭제 (Hard Delete: 카드와 연관된 아이템 일괄 삭제)
  removeAlbum: (albumId) => {
    set((state) => {
      const albumToDelete = state.albums.find(album => album.id === albumId);
      if (!albumToDelete) return state;

      const itemIdsToDelete = new Set(albumToDelete.itemIds || []);

      return {
        albums: state.albums.filter(album => album.id !== albumId),
        items: state.items.filter(item => !itemIdsToDelete.has(item.id))
      };
    });
  },

  // 개별 Item 삭제 (Hard Delete: 아이템 삭제 및 부모 카드의 명단에서도 제거)
  removeItem: (itemId) => {
    set((state) => {
      const newItems = state.items.filter(item => item.id !== itemId);
      const newAlbums = state.albums.map(album => ({
        ...album,
        itemIds: album.itemIds.filter(id => id !== itemId)
      }));

      return { items: newItems, albums: newAlbums };
    });
  },

  // Album 데이터 수정
  updateAlbum: (albumId, updatedData) => {
    set((state) => ({
      albums: state.albums.map(album =>
        album.id === albumId ? { ...album, ...updatedData, updatedAt: new Date().toISOString() } : album
      )
    }));
  },

  // Item 데이터 수정
  updateItem: (itemId, updatedData) => {
    set((state) => ({
      items: state.items.map(item =>
        item.id === itemId ? { ...item, ...updatedData } : item
      )
    }));
  },
});
