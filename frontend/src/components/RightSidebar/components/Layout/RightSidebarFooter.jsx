import React from 'react';
import useSidebarStore from '../../../../store/sidebar/useSidebarStore';
import { useArchiveStore } from '../../../../store/archive';

export default function RightSidebarFooter({
  viewingStagedIndex,
  setViewingStagedIndex,
  clearDraftForm,
  scrollRef
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const { activeSidebarItem, closeRightSidebar } = useSidebarStore();
  const {
    stagedItems,
    clearStagedItems,
    addStagedItem,
    draftForm,
    editingAlbumId,
    updateAlbumWithStagedItems,
    stagedAlbumTitle,
    updateItem,
    addAlbumWithItems,
    stagedMixBlocks,
    addMixWithBlocks,
    updateMixWithBlocks,
    stagedMixCoverImage,
    stagedMixDescription,
    editingMixId
  } = useArchiveStore();

  if (activeSidebarItem?._viewType === 'mix') {
    return (
      <div className="rs-footer">
        <div className="rs-footer-buttons">
          <button
            className="rs-clear-btn"
            disabled={isSaving}
            onClick={() => {
              if (stagedMixBlocks.length > 0) {
                if (window.confirm('추가한 믹스 항목들을 모두 지우시겠습니까?')) {
                  clearStagedItems(); // clears everything including blocks and selection mode
                }
              }
            }}
          >
            Clear
          </button>

          <button
            className="rs-save-btn"
            disabled={stagedMixBlocks.length === 0 || isSaving}
            onClick={async () => {
              if (isSaving) return;
              setIsSaving(true);
              try {
                if (editingMixId) {
                  await updateMixWithBlocks(editingMixId, stagedAlbumTitle, stagedMixBlocks, stagedMixCoverImage, stagedMixDescription);
                  alert('Mix updated successfully!');
                } else {
                  await addMixWithBlocks(stagedAlbumTitle, stagedMixBlocks, stagedMixCoverImage, stagedMixDescription);
                  alert('Mix saved to Archive!');
                }
                clearStagedItems();
                closeRightSidebar();
              } catch (error) {
                console.error(error);
                alert('믹스 저장 중 오류가 발생했습니다.');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? 'Saving...' : (editingMixId ? 'Update' : 'Add')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rs-footer">
      <div className="rs-footer-buttons">
        <button
          className="rs-clear-btn"
          onClick={() => {
            if (stagedItems.length > 0) {
              if (window.confirm('Are you sure you want to clear all staged items?')) {
                clearStagedItems();
                setViewingStagedIndex(null);
              }
            } else {
              clearDraftForm();
            }
          }}
        >
          Clear
        </button>

        <button
          className="rs-add-btn"
          onClick={() => {
            if (viewingStagedIndex !== null) {
              alert('This item is already added! Changes are auto-saved.');
              return;
            }
            addStagedItem({ itemData: activeSidebarItem, formState: draftForm });
            clearDraftForm();
            if (scrollRef.current) {
              scrollRef.current.scrollTop = 0;
            }
          }}
        >
          Add item
        </button>

        <button
          className="rs-save-btn"
          disabled={
            stagedItems.length === 0 &&
            (!activeSidebarItem || (activeSidebarItem._viewType !== 'item' && activeSidebarItem._viewType !== undefined))
          }
          onClick={async () => {
            console.log("[RightSidebarFooter] Save button clicked!");
            console.log("[RightSidebarFooter] stagedItems length:", stagedItems.length);
            console.log("[RightSidebarFooter] activeSidebarItem:", activeSidebarItem);
            console.log("[RightSidebarFooter] editingAlbumId:", editingAlbumId);

            // 1. 기존 카드를 편집(Update) 중인 경우
            if (editingAlbumId) {
              console.log("[RightSidebarFooter] Case 1: editingAlbumId");
              try {
                await updateAlbumWithStagedItems(editingAlbumId, stagedAlbumTitle, stagedItems);
                clearStagedItems();
                alert('Saved to Archive!');
                closeRightSidebar();
              } catch (err) {
                console.error("[RightSidebarFooter] Error calling updateAlbumWithStagedItems:", err);
                alert(`저장에 실패했습니다: ${err?.message || err}`);
              }
              return;
            }

            // 2. 스테이징된 항목은 없고, 기존 단일 아이템을 띄워놓고 바로 수정한 경우
            if (stagedItems.length === 0 && activeSidebarItem && activeSidebarItem._viewType === 'item') {
              console.log("[RightSidebarFooter] Case 2: update single item");
              try {
                await updateItem(activeSidebarItem.id, {
                  rating: draftForm.rating,
                  impression: draftForm.review,
                  userMeta: {
                    ...(activeSidebarItem.userMeta || {}),
                    tags: draftForm.tags
                  },
                  isPublic: draftForm.isPublic
                });
                alert('Saved to Archive!');
              } catch (err) {
                console.error("[RightSidebarFooter] Error calling updateItem:", err);
                alert(`저장에 실패했습니다: ${err?.message || err}`);
              }
              closeRightSidebar();
              return;
            }

            // 2.5. Digging 탭에서 가져온 완전히 새로운 단일 아이템을 바로 저장(Create)하는 경우
            if (stagedItems.length === 0 && activeSidebarItem && !activeSidebarItem._viewType) {
              console.log("[RightSidebarFooter] Case 2.5: create single item");
              const d = activeSidebarItem;
              
              // 중복 체크 로직
              const externalId = d.apiMeta?.rawId || d.mbid || String(d.id || '');
              console.log("[RightSidebarFooter] externalId:", externalId);
              
              const items = useArchiveStore.getState().items;
              console.log("[RightSidebarFooter] store items length:", items.length);

              const isDuplicate = externalId && items.some(i => 
                (i.apiMeta?.rawId === externalId) || 
                (i.mbid === externalId) || 
                (i.external_id === externalId) ||
                (i.id === externalId)
              );
              console.log("[RightSidebarFooter] isDuplicate:", isDuplicate);
              
              if (isDuplicate) {
                alert('이미 보관함에 존재하는 아이템입니다!');
                return;
              }

              const coverImages = Array.isArray(d.coverImages) && d.coverImages.length > 0 ? d.coverImages : (d.image_url ? [d.image_url] : []);
              
              const singleItem = {
                ...d,
                coverImages,
                rating: draftForm.rating,
                impression: draftForm.review,
                isPublic: draftForm.isPublic,
                userMeta: { tags: draftForm.tags || [] }
              };
              console.log("[RightSidebarFooter] singleItem to add:", singleItem);

              try {
                // 이제 앨범을 씌우지 않고 순수 아이템으로만 저장합니다.
                await useArchiveStore.getState().addSingleItem(singleItem);
                console.log("[RightSidebarFooter] addSingleItem called successfully");
                alert('Successfully saved to Archive!');
                closeRightSidebar();
              } catch (err) {
                console.error("[RightSidebarFooter] Error calling addSingleItem:", err);
              }
              return;
            }

            // 3. 완전히 새로운 항목들을 모아서 새 카드로 저장(Create)하는 경우
            if (stagedItems.length > 0) {
              console.log("[RightSidebarFooter] Case 3: create group album");
              
              const albumData = {
                albumTitle: stagedAlbumTitle.trim() !== ''
                  ? stagedAlbumTitle.trim()
                  : (stagedItems[0].itemData.title + (stagedItems.length > 1 ? ` and ${stagedItems.length - 1} more` : '')),
                category: stagedItems[0].itemData.itemType
              };
              console.log("[RightSidebarFooter] albumData:", albumData);

              const itemsArray = stagedItems.map(st => {
                const d = st.itemData;
                const coverImages = Array.isArray(d.coverImages) && d.coverImages.length > 0 ? d.coverImages : (d.image_url ? [d.image_url] : []);
                return {
                  ...d,
                  coverImages,
                  rating: st.formState.rating,
                  impression: st.formState.review,
                  tags: st.formState.tags,
                  isPublic: st.formState.isPublic
                };
              });
              console.log("[RightSidebarFooter] itemsArray:", itemsArray);

              try {
                await addAlbumWithItems(albumData, itemsArray);
                console.log("[RightSidebarFooter] addAlbumWithItems completed successfully");
                clearStagedItems();
                alert('Successfully saved to Archive!');
                closeRightSidebar();
              } catch (err) {
                console.error("[RightSidebarFooter] Error calling addAlbumWithItems:", err);
                alert(`저장에 실패했습니다: ${err?.message || err}`);
              }
            }
          }}
        >
          Save to Archive
        </button>
      </div>
    </div>
  );
}
