import { v4 as uuidv4 } from 'uuid';
import { createItem, createAlbum, linkItemsToAlbum, updateItem, updateAlbum, syncItemsToAlbum, deleteItemAPI, deleteAlbumAPI, deleteMixAPI } from '../../api/archiveApi';

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
        external_id: itemData.apiMeta?.rawId || itemData.mbid || itemData.external_id || itemData.externalId || String(itemData.id || ''),
        external_source: itemData.external_source || itemData.externalSource || itemData.apiMeta?.provider || '',
        rating: Number(itemData.rating) || 0,
        impression: itemData.impression || itemData.review || '',
        description: itemData.review || '',
        cover_image_url: Array.isArray(itemData.coverImages) && itemData.coverImages.length > 0
          ? itemData.coverImages[0]
          : (itemData.coverImageUrl || itemData.coverImage || itemData.image_url || ''),
        genres: [
          ...(Array.isArray(itemData.genres) ? itemData.genres : []),
          ...(Array.isArray(itemData.userMeta?.genreTags) ? itemData.userMeta.genreTags : []),
        ].filter(Boolean),
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
            external_id: item.apiMeta?.rawId || item.mbid || item.external_id || item.externalId || String(item.id || ''),
            external_source: item.external_source || item.externalSource || item.apiMeta?.provider || '',
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

      // --- Create Meta Item (앨범 껍데기 디자인용 아이템) ---
      const metaItemPayload = {
        title: albumData.albumTitle || 'Untitled Album',
        item_type: finalCategory,
        external_source: 'custom',
        cover_image_url: albumData.coverImage || localItemsToInsert[0]?.coverImages?.[0] || '',
        rating: 0,
        impression: '',
        description: albumData.description || '',
        genres: [],
        media_meta: {},
        user_meta: {
          is_meta_item: true,
          pin_layout: albumData.layout || 'classic',
          pin_style: {}
        },
        links: []
      };
      
      const createdMetaItem = await createItem(metaItemPayload);
      savedItemIds.unshift(createdMetaItem.id);
      localItemsToInsert.unshift({
        id: createdMetaItem.id,
        itemType: createdMetaItem.item_type,
        title: createdMetaItem.title,
        coverImages: [createdMetaItem.cover_image_url],
        rating: createdMetaItem.rating,
        impression: createdMetaItem.impression,
        isPublic: createdMetaItem.is_public,
        date: createdMetaItem.created_at || timestamp,
        userMeta: createdMetaItem.user_meta
      });
      // ----------------------------------------------------

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
  updateAlbumWithStagedItems: async (albumId, albumData, stagedItemsArray) => {
    try {
      const timestamp = new Date().toISOString();
      const localItemsToInsert = [];
      const updatedItemIds = [];
      const backendTypes = [];
      
      const albumTitle = albumData.albumTitle || 'Untitled Album';

      // 1. 개별 아이템 처리 (생성 또는 수정)
      for (const st of stagedItemsArray) {
        const item = st.itemData;
        const externalId = item.apiMeta?.rawId || item.mbid || String(item.id || '');
        
        const existingItem = get().items.find(i => i.id === item.id);
        
        if (existingItem) {
          // 1-A. 기존에 스토어에 존재하는 아이템인 경우 (업데이트)
          const updatePayload = {
            rating: Number(st.formState.rating) || 0,
            impression: st.formState.review || '',
            user_meta: { ...(existingItem.userMeta || {}), tags: st.formState.tags || [] },
            is_public: st.formState.isPublic || false
          };
          
          await updateItem(existingItem.id, updatePayload);
          
          updatedItemIds.push(existingItem.id);
          backendTypes.push(existingItem.itemType || existingItem.item_type || 'music');
          
          localItemsToInsert.push({
            ...existingItem,
            rating: updatePayload.rating,
            impression: updatePayload.impression,
            userMeta: updatePayload.user_meta,
            isPublic: updatePayload.is_public,
            coverImages: Array.isArray(item.coverImages) && item.coverImages.length > 0 ? item.coverImages : (item.image_url ? [item.image_url] : existingItem.coverImages),
          });
        } else {
          // 1-B. 스테이징 과정에서 새로 추가된 아이템인 경우 (신규 생성)
          const payload = {
            title: item.title || item.name || 'Untitled Item',
            item_type: item.itemType || item.category || 'music',
            external_id: item.apiMeta?.rawId || item.mbid || item.external_id || item.externalId || String(item.id || ''),
            external_source: item.external_source || item.externalSource || item.apiMeta?.provider || '',
            rating: Number(st.formState.rating) || 0,
            impression: st.formState.review || '',
            description: st.formState.review || '',
            cover_image_url: Array.isArray(item.coverImages) && item.coverImages.length > 0
              ? item.coverImages[0]
              : (item.coverImageUrl || item.coverImage || item.image_url || ''),
            genres: item.userMeta?.genreTags || [],
            media_meta: {
              ...item.mediaMeta,
              artists: Array.isArray(item.artists) ? item.artists : (typeof item.artists === 'string' ? [item.artists] : []),
              rawFrontendData: item
            },
            user_meta: {
              tags: Array.isArray(st.formState.tags) ? st.formState.tags : [],
              mood: item.mood || item.userMeta?.mood || '',
              context: item.userMeta?.context || []
            },
            links: []
          };

          const createdItem = await createItem(payload);
          updatedItemIds.push(createdItem.id);
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

      // 2. 카드의 정보(타이틀 및 카테고리) 백엔드 갱신
      const finalCategory = calculateAlbumCategory(backendTypes);
      const albumPayload = {
        title: albumTitle,
        category: finalCategory
      };
      await updateAlbum(albumId, albumPayload);

      // 3. Meta Item 업데이트 로직
      // stagedItemsArray의 첫 번째 항목이나 혹은 백엔드의 기존 Meta Item을 찾아서 업데이트
      // 하지만 여기서는 스토어의 기존 items를 검사해서 업데이트 해야함
      const existingAlbum = get().albums.find(a => a.id === albumId);
      if (existingAlbum) {
         const firstItemId = existingAlbum.itemIds[0];
         if (firstItemId) {
            const firstItem = get().items.find(i => i.id === firstItemId);
            if (firstItem && firstItem.userMeta?.is_meta_item) {
               // Update existing meta item
               await updateItem(firstItemId, {
                  title: albumTitle,
                  cover_image_url: albumData.coverImage || firstItem.coverImages?.[0] || '',
                  description: albumData.description || '',
                  user_meta: {
                    ...(firstItem.userMeta || {}),
                    pin_layout: albumData.layout || 'classic'
                  }
               });
            }
         }
      }

      // 4. 카드에 포함된 아이템 목록 백엔드 동기화 (순서/삭제 포함)
      await syncItemsToAlbum(albumId, updatedItemIds);

      // 4. 로컬 스토어 갱신
      set((state) => {
        let newItems = [...state.items];
        
        localItemsToInsert.forEach(localItem => {
          const idx = newItems.findIndex(i => i.id === localItem.id);
          if (idx !== -1) {
            newItems[idx] = localItem;
          } else {
            newItems.push(localItem);
          }
        });

        const newAlbums = state.albums.map(c => c.id === albumId ? {
          ...c,
          albumTitle: albumTitle,
          category: finalCategory,
          itemIds: updatedItemIds,
          updatedAt: timestamp
        } : c);

        return { items: newItems, albums: newAlbums };
      });
      
    } catch (error) {
      console.error("Failed to update album with staged items:", error);
      throw error;
    }
  },

  // 기존 카드에 새로운 아이템 단일 추가
  addItemToAlbum: async (albumId, item) => {
    try {
      const targetAlbum = get().albums.find(c => c.id === albumId);
      if (!targetAlbum) return; // 카드가 존재하지 않으면 무시

      const timestamp = new Date().toISOString();
      const externalId = item.apiMeta?.rawId || item.mbid || String(item.id || '');

      const payload = {
        title: item.title || item.name || 'Untitled Item',
        item_type: item.itemType || item.category || 'music',
        external_id: item.apiMeta?.rawId || item.mbid || item.external_id || item.externalId || String(item.id || ''),
        external_source: item.external_source || item.externalSource || item.apiMeta?.provider || '',
        rating: Number(item.rating) || 0,
        impression: item.impression || '',
        description: item.impression || '',
        cover_image_url: Array.isArray(item.coverImages) && item.coverImages.length > 0
          ? item.coverImages[0]
          : (item.coverImageUrl || item.coverImage || item.image_url || ''),
        genres: item.userMeta?.genreTags || [],
        media_meta: {
          ...item.mediaMeta,
          artists: Array.isArray(item.artists) ? item.artists : (typeof item.artists === 'string' ? [item.artists] : []),
          rawFrontendData: item
        },
        user_meta: {
          tags: Array.isArray(item.tags) ? item.tags : (item.userMeta?.tags || []),
          mood: item.mood || item.userMeta?.mood || '',
          context: item.userMeta?.context || []
        },
        links: []
      };

      const createdItem = await createItem(payload);
      
      const newItem = {
        ...item,
        id: createdItem.id,
        itemType: createdItem.item_type,
        title: createdItem.title,
        coverImages: [createdItem.cover_image_url],
        rating: createdItem.rating,
        impression: createdItem.impression,
        isPublic: createdItem.is_public,
        date: createdItem.created_at || timestamp,
      };

      await linkItemsToAlbum(albumId, [createdItem.id]);

      const updatedItemIds = [...targetAlbum.itemIds, createdItem.id];
      const updatedItemTypes = updatedItemIds.map(id => {
        if (id === createdItem.id) return newItem.itemType;
        const existingItem = get().items.find(i => i.id === id);
        return existingItem ? existingItem.itemType : 'music';
      });
      const finalCategory = calculateAlbumCategory(updatedItemTypes);

      await updateAlbum(albumId, { category: finalCategory });

      set((state) => {
        return {
          items: [...state.items, newItem],
          albums: state.albums.map(album => {
            if (album.id === albumId) {
              return {
                ...album,
                category: finalCategory,
                itemIds: updatedItemIds,
                updatedAt: timestamp
              };
            }
            return album;
          })
        };
      });
    } catch (error) {
      console.error("Failed to add item to album:", error);
      throw error;
    }
  },

  // Album 삭제 (Hard Delete: 카드와 연관된 아이템 일괄 삭제)
  removeAlbum: async (albumId) => {
    try {
      await deleteAlbumAPI(albumId);
      set((state) => {
        const albumToDelete = state.albums.find(album => album.id === albumId);
        if (!albumToDelete) return state;

        const itemIdsToDelete = new Set(albumToDelete.itemIds || []);

        return {
          albums: state.albums.filter(album => album.id !== albumId),
          items: state.items.filter(item => !itemIdsToDelete.has(item.id))
        };
      });
    } catch (error) {
      console.error("Failed to delete album API:", error);
    }
  },

  // 개별 Item 삭제 (Hard Delete: 아이템 삭제 및 부모 카드의 명단에서도 제거)
  removeItem: async (itemId) => {
    try {
      await deleteItemAPI(itemId);
      set((state) => {
        const newItems = state.items.filter(item => item.id !== itemId);
        const newAlbums = state.albums.map(album => ({
          ...album,
          itemIds: album.itemIds.filter(id => id !== itemId)
        }));

        return { items: newItems, albums: newAlbums };
      });
    } catch (error) {
      console.error("Failed to delete item API:", error);
    }
  },

  // Album 데이터 수정
  updateAlbum: async (albumId, updatedData) => {
    try {
      // 1. Backend API 호출 (이름 충돌 방지를 위해 archiveApi.js에서 가져온 updateAlbum 함수는 상단에서 apiUpdateAlbum 등으로 alias 하는 것이 좋으나,
      //    여기서는 화살표 함수 내부이므로 상위 스코프의 updateAlbum(API)를 호출하게 됩니다.
      //    명확성을 위해 API 호출은 생략하고 상위 함수에서 직접 호출하는 패턴을 쓰거나 alias를 쓸 수 있습니다.
      //    안전을 위해 fetch를 직접 쓰거나 상단의 import를 사용합니다.)
      //    위 코드들에서 이미 import한 updateAlbum을 씁니다.
      await updateAlbum(albumId, updatedData);
      
      // 2. 로컬 스토어 갱신
      set((state) => ({
        albums: state.albums.map(album =>
          album.id === albumId ? { ...album, ...updatedData, updatedAt: new Date().toISOString() } : album
        )
      }));
    } catch (error) {
      console.error("Failed to update album:", error);
      throw error;
    }
  },

  // Item 데이터 수정
  updateItem: async (itemId, updatedData) => {
    try {
      // 1. Backend API 호출
      // 서버에서 기대하는 스키마(rating, impression, user_meta, is_public 등)에 맞게 맵핑
      const apiPayload = {
        rating: updatedData.rating !== undefined ? Number(updatedData.rating) : undefined,
        impression: updatedData.impression !== undefined ? updatedData.impression : undefined,
        is_public: updatedData.isPublic !== undefined ? updatedData.isPublic : undefined,
      };
      
      if (updatedData.userMeta) {
        apiPayload.user_meta = updatedData.userMeta;
      }
      
      // undefined 값 제거
      Object.keys(apiPayload).forEach(key => apiPayload[key] === undefined && delete apiPayload[key]);
      
      await updateItem(itemId, apiPayload);

      // 2. 로컬 스토어 갱신
      set((state) => ({
        items: state.items.map(item =>
          item.id === itemId ? { ...item, ...updatedData } : item
        )
      }));
    } catch (error) {
      console.error("Failed to update item:", error);
      throw error;
    }
  },
});
