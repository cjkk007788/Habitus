import React from "react";
import { X } from "lucide-react";
import MediaAlbum from "../common/MediaAlbum/MediaAlbum";
import useSidebarStore from "../../store/sidebar/useSidebarStore";
import { useArchiveStore } from "../../store/archive";
import "./ArchiveAlbumRow.css";

const fallbackColors = [
  "#E05263", "#F2994A", "#27AE60", "#2D9CDB", "#9B51E0",
  "#F2C94C", "#EB5757", "#6FCF97", "#56CCF2", "#BB6BD9",
];

/**
 * Archive 페이지에서 카드 1개를 가로 스크롤 행으로 렌더링합니다.
 * - 카드 제목 = 행 헤더
 * - 카드에 속한 아이템들 = MediaAlbum 가로 나열
 */
export default function ArchiveAlbumRow({ album, onRemove }) {
  const openRightSidebar = useSidebarStore((state) => state.openRightSidebar);

  const { albumTitle, category, resolvedItems = [] } = album;

  // 실제 아이템 기반 동적 카테고리 계산
  const uniqueCategories = [...new Set(resolvedItems.map(item => {
    const rawType = (item.mediaMeta?.rawFrontendData?.itemType || item.itemType || item.item_type || item.category || "").toLowerCase();
    
    // 명시적인 타입이 있으면 우선 사용 (예: music_artist, movie_person)
    if (rawType) return rawType;

    // 타입 필드가 아예 비어있는 옛날/망가진 데이터의 경우 출처로 대체
    const provider = (item.apiMeta?.provider || item.mediaMeta?.rawFrontendData?.apiMeta?.provider || item.external_source || '').toLowerCase();
    if (provider.includes('spotify') || provider.includes('lastfm') || provider.includes('musicbrainz')) return 'music';
    if (provider.includes('tmdb')) return 'movie';
    if (provider.includes('google') || provider.includes('book')) return 'book';

    return 'fusion'; // fall-back
  }).filter(Boolean))];

  console.log("🛠️ [DEBUG] ArchiveAlbumRow:", { albumTitle, resolvedItems, uniqueCategories });

  let displayCategory = category?.toLowerCase();
  
  if (uniqueCategories.length > 1) {
    displayCategory = 'fusion';
  } else if (uniqueCategories.length === 1) {
    displayCategory = uniqueCategories[0];
  }

  // archive item → MediaAlbum가 기대하는 포맷으로 변환
  const mediaItems = resolvedItems.map((item, idx) => ({
    ...item,
    image_url:
      item.coverImages?.[0] ||
      item.cover_image_url ||
      null,
    bgColor: fallbackColors[idx % fallbackColors.length],
    // mediaMeta.contributors가 없으면 artists 배열로 보완
    mediaMeta: {
      ...(item.mediaMeta || {}),
      contributors:
        item.mediaMeta?.contributors?.length > 0
          ? item.mediaMeta.contributors
          : (item.artists || []).map((a) => ({ name: a })),
    },
  }));

  // 카테고리 배지 색상
  const CATEGORY_COLORS = {
    music: "#9B51E0",
    movie: "#2D9CDB",
    book:  "#27AE60",
    fusion:"#F2994A",
  };
  const badgeColor = CATEGORY_COLORS[displayCategory] || "#555";

  const handleAlbumHeaderClick = (e) => {
    e.stopPropagation();
    
    // Mix items 가상 앨범일 경우엔 편집을 막거나 그냥 Mix 보기로 넘길 수도 있지만,
    // 일단 일반 앨범 수정 로직과 동일하게 처리 (단, targetId가 실제 앨범 ID여야 함)
    // 현재 targetId는 믹스인 경우 mix.id일 수 있음.
    // 타입이 'album'인 경우에만 편집 허용
    if (album.type !== 'album') return;

    const itemsForAlbum = resolvedItems;
    const stagedData = itemsForAlbum.map(i => ({
      itemData: i,
      formState: { rating: i.rating || 0, isPublic: i.isPublic, review: i.impression || '', tags: i.userMeta?.tags || [] }
    }));
    
    useArchiveStore.getState().setStagedItems(stagedData);
    useArchiveStore.getState().setStagedAlbumTitle(albumTitle);
    useArchiveStore.getState().setEditingAlbumId(album.targetId); // DB ID
    
    openRightSidebar({ 
      ...album, 
      id: album.targetId, // 원본 ID로 교체해서 Sidebar에 전달
      _viewType: 'album' 
    });
  };

  return (
    <div className="archive-album-row">
      {/* 행 헤더 */}
      <div className="archive-album-row__header">
        <span
          className="archive-album-row__badge"
          style={{ backgroundColor: badgeColor }}
        >
          {displayCategory}
        </span>
        <h2 
          className="archive-album-row__title"
          style={{ cursor: album.type === 'album' ? 'pointer' : 'default' }}
          onClick={handleAlbumHeaderClick}
          title={album.type === 'album' ? "앨범 편집하기" : ""}
        >
          {albumTitle || "Untitled Album"}
        </h2>
        <span className="archive-album-row__count">{resolvedItems.length} items</span>
        
        {/* X 버튼 */}
        {onRemove && (
          <button
            className="archive-album-row__remove"
            onClick={onRemove}
            title="이 행 닫기"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 아이템이 없을 때 */}
      {mediaItems.length === 0 && (
        <p className="archive-album-row__empty">이 카드에 아이템이 없습니다.</p>
      )}

      {/* 가로 스크롤 컨텐츠 행 */}
      {mediaItems.length > 0 && (
        <div className="archive-album-row__scroll">
          {mediaItems.map((item, index) => (
            <div 
              key={item.id || index} 
              className="archive-album-row__item"
              style={{
                "--album-index": index,
                animationDelay: `${index * 0.05}s`
              }}
            >
              <MediaAlbum
                item={item}
                onClick={(clickedItem) => openRightSidebar(clickedItem)}
                onPlayClick={(e, clickedItem) => {
                  e.stopPropagation();
                  openRightSidebar(clickedItem);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
