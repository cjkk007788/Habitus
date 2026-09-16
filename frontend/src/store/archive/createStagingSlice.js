export const createStagingSlice = (set, get) => ({
  stagedItems: [], // Items added to the staging area (for Album creation)
  stagedAlbumTitle: '', // Album title being drafted
  stagedAlbumCover: '',
  stagedAlbumDescription: '',
  stagedAlbumLayout: 'classic',
  draftForm: { rating: 0, isPublic: true, review: '', tags: [] }, // Persists user input before adding
  editingAlbumId: null,

  // --- Mix Creation States ---
  isSelectionMode: false, // UI 플래그: 믹스 생성을 위한 라이브러리 항목 선택 모드 여부
  stagedMixBlocks: [], // 믹스 생성을 위해 담은 그룹화된 블록 배열 [{ id, type, sourceId, title, items: [] }]
  stagedMixCoverImage: '', // 믹스 커버 이미지 URL
  stagedMixDescription: '', // 믹스 설명
  editingMixId: null, // 편집 중인 믹스 ID

  // Staging Actions
  setEditingAlbumId: (id) => set({ editingAlbumId: id }),
  setEditingMixId: (id) => set({ editingMixId: id }),
  setStagedAlbumTitle: (title) => set({ stagedAlbumTitle: title }),
  setStagedAlbumCover: (cover) => set({ stagedAlbumCover: cover }),
  setStagedAlbumDescription: (desc) => set({ stagedAlbumDescription: desc }),
  setStagedAlbumLayout: (layout) => set({ stagedAlbumLayout: layout }),
  setStagedMixCoverImage: (url) => set({ stagedMixCoverImage: url }),
  setStagedMixDescription: (desc) => set({ stagedMixDescription: desc }),
  addStagedItem: (item) => set((state) => {
    // 중복 체크: 고유 ID(id 또는 mbid)가 같은 아이템이 이미 스토어에 있는지 확인
    const isDuplicate = state.stagedItems.some(staged => {
      const existingId = staged.itemData?.id || staged.itemData?.mbid;
      const newId = item.itemData?.id || item.itemData?.mbid;
      // 둘 다 ID가 존재하고 그 값이 같으면 중복으로 간주
      return existingId && newId && existingId === newId;
    });

    if (isDuplicate) {
      alert('이미 추가된 항목입니다!');
      return state; // 상태 변경 안 함 (중복 방지)
    }

    return { stagedItems: [...state.stagedItems, item] };
  }),
  clearStagedItems: () => set({ 
    stagedItems: [], 
    stagedAlbumTitle: '', 
    stagedAlbumCover: '',
    stagedAlbumDescription: '',
    stagedAlbumLayout: 'classic',
    editingAlbumId: null,
    stagedMixBlocks: [],
    stagedMixCoverImage: '',
    stagedMixDescription: '',
    editingMixId: null,
    isSelectionMode: false
  }),
  removeStagedItem: (index) => set((state) => ({ stagedItems: state.stagedItems.filter((_, i) => i !== index) })),
  setStagedItems: (items) => set({ stagedItems: items }),
  updateStagedItemForm: (index, formUpdater) => set((state) => {
    const newStaged = [...state.stagedItems];
    const oldForm = newStaged[index].formState;
    newStaged[index] = {
      ...newStaged[index],
      //updater라는 파라미터가 함수면 updater함수를 써서 업데이트하고, 데이터면 그냥 데이터를 반환해라
      formState: typeof formUpdater === 'function' ? formUpdater(oldForm) : formUpdater
    };
    return { stagedItems: newStaged };
  }),

  // Draft Actions
  setDraftForm: (updater) => set((state) => ({
    //updater라는 파라미터가 함수면 updater함수를 써서 업데이트하고, 데이터면 그냥 데이터를 반환해라
    draftForm: typeof updater === 'function' ? updater(state.draftForm) : updater
  })),
  clearDraftForm: () => set({ draftForm: { rating: 0, isPublic: true, review: '', tags: [] } }),

  loadMixForEditing: (mixData) => set((state) => {
    const { albums, items } = get();
    const blocks = [];

    // albumIds 파싱
    if (mixData.albumIds && mixData.albumIds.length > 0) {
      mixData.albumIds.forEach(id => {
        const foundAlbum = albums.find(a => a.id === id);
        if (foundAlbum) {
          const childItems = items.filter(i => foundAlbum.itemIds?.includes(i.id));
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'album',
            sourceId: foundAlbum.id,
            title: foundAlbum.albumTitle || 'Untitled',
            items: childItems
          });
        }
      });
    }

    // itemIds 파싱
    if (mixData.itemIds && mixData.itemIds.length > 0) {
      mixData.itemIds.forEach(id => {
        const foundItem = items.find(i => i.id === id);
        if (foundItem) {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'item',
            sourceId: foundItem.id,
            title: foundItem.title || 'Untitled',
            items: [foundItem]
          });
        }
      });
    }

    return {
      editingMixId: mixData.id,
      stagedAlbumTitle: mixData.mixTitle || '',
      stagedMixCoverImage: mixData.coverImage || '',
      stagedMixDescription: mixData.description || '',
      stagedMixBlocks: blocks,
      isSelectionMode: true
    };
  }),

  // --- Mix Creation Actions ---
  setIsSelectionMode: (isMode) => set({ isSelectionMode: isMode }),
  
  addMixBlock: (blockType, sourceItem, childItems = []) => set((state) => {
    // 중복 체크: 이미 동일한 블록(sourceId 기준)이 추가되어 있는지 확인
    const sourceId = sourceItem.id;
    const isDuplicate = state.stagedMixBlocks.some(block => block.sourceId === sourceId);
    
    if (isDuplicate) {
      alert('이미 믹스에 추가된 항목입니다!');
      return state;
    }

    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: blockType, // 'album' or 'item'
      sourceId: sourceId,
      title: sourceItem.title || sourceItem.albumTitle || 'Untitled',
      items: childItems.length > 0 ? childItems : [sourceItem] // 앨범이면 속한 아이템들, 단일 아이템이면 자기 자신
    };

    return { stagedMixBlocks: [...state.stagedMixBlocks, newBlock] };
  }),

  removeMixBlock: (blockId) => set((state) => ({
    stagedMixBlocks: state.stagedMixBlocks.filter(block => block.id !== blockId)
  })),
});
