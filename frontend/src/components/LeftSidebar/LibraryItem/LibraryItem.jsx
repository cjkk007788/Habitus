import './LibraryItem.css';
import { useLocation } from 'react-router-dom';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import useArchiveUIStore from '../../../store/archive/useArchiveUIStore';
import { useArchiveStore } from '../../../store/archive';
import { Trash2 } from 'lucide-react';
import useRightSidebarLogic from '../../RightSidebar/hooks/useRightSidebarLogic';

// ── 타입별 이모지 fallback (이미지 없을 때 사용) ──
const TYPE_EMOJI = {
  music: '🎵',
  movie: '🎬',
  book: '📚',
  fusion: '🔀',
  mix: '📦',
};

// ── 타입별 라벨 (subtitle에 표시) ──
const TYPE_LABEL = {
  music: 'Music',
  movie: 'Movie',
  book: 'Book',
  fusion: 'Fusion',
};

/**
 * LibraryItem - 사이드바 리스트의 개별 행 컴포넌트
 *
 * Sidebar.jsx에서 _viewType 태그를 붙여서 넘겨줌:
 *   - _viewType === 'album'  → Album 데이터 (albumTitle, category, itemIds[])
 *   - _viewType === 'item'  → Item 데이터 (title, artists[], coverImages[])
 *   - _viewType === 'mix'   → Mix 데이터 (mixTitle, albumIds[])
 */
export default function LibraryItem({ data, isSelectionMode }) {
  const viewType = data._viewType || 'item';
  const location = useLocation();
  const isArchivePage = location.pathname === '/archive';

  const openRightSidebar = useSidebarStore((state) => state.openRightSidebar);
  const pushAlbumToArchive = useArchiveUIStore((state) => state.pushAlbumToArchive);
  const { items, removeAlbum, removeItem, removeMix, addMixBlock } = useArchiveStore();

  const { activeSidebarItem } = useRightSidebarLogic;

  const handleRemove = (e) => {
    e.stopPropagation(); // 카드 클릭(우측 사이드바 열기) 이벤트 버블링 방지
    if (window.confirm('정말 삭제하시겠습니까?')) {
      if (viewType === 'album') removeAlbum(data.id);
      else if (viewType === 'item') removeItem(data.id);
      else if (viewType === 'mix') removeMix(data.id);
    }
  };

  const handleAddBlock = (e) => {
    e.stopPropagation();
    if (viewType === 'album') {
      const childItems = items.filter(i => data.itemIds?.includes(i.id));
      addMixBlock('album', data, childItems);
    } else if (viewType === 'item') {
      addMixBlock('item', data, []);
    } else if (viewType === 'mix') {
      isSelectionMode = false;
      activeSidebarItem.viewType = 'mix';
      openRightSidebar(data);
      return;
    }
  };

  // ── 데이터 구조에 따라 title / subtitle / imageUrl 파싱 ──
  let title = '';
  let subtitle = '';
  let imageUrl = '';

  switch (viewType) {
    case 'album': {
      title = data.albumTitle || 'Untitled Album';
      const typeLabel = TYPE_LABEL[data.category] || data.category || '';
      const itemCount = data.itemIds?.length || 0;
      const artistText = data.derivedArtist && data.derivedArtist !== 'Unknown Artist'
        ? `${data.derivedArtist} · `
        : '';
      subtitle = `${typeLabel} · ${artistText}${itemCount} items`;
      imageUrl = data.coverImage || data.derivedCoverImage || '';
      break;
    }
    case 'item': {
      title = data.title || 'Untitled Item';

      let artistsText = '';
      if (Array.isArray(data.artists) && data.artists.length > 0) {
        artistsText = data.artists.join(', ');
      } else if (data.mediaMeta?.contributors && data.mediaMeta.contributors.length > 0) {
        artistsText = data.mediaMeta.contributors.map(c => c.name).join(', ');
      }

      const typeLabel = TYPE_LABEL[data.itemType] || data.itemType || '';
      subtitle = artistsText ? `${typeLabel} · ${artistsText}` : typeLabel;
      imageUrl = Array.isArray(data.coverImages) && data.coverImages.length > 0
        ? data.coverImages[0]
        : '';
      break;
    }
    case 'mix': {
      title = data.mixTitle || 'Untitled Mix';
      const albumCount = data.albumIds?.length || 0;
      subtitle = `Mix · ${albumCount}개 카드`;
      imageUrl = data.coverImage || '';
      break;
    }
    case 'artist': {
      title = data.artistName || data.title || 'Unknown Artist';
      const itemCount = data.items?.length || 0;
      subtitle = `Artist · ${itemCount} items`;
      imageUrl = Array.isArray(data.coverImages) && data.coverImages.length > 0
        ? data.coverImages[0]
        : '';
      break;
    }
    default:
      title = data.title || 'Unknown';
      subtitle = '';
  }

  // 이미지 없을 때 이모지 fallback 결정
  const fallbackEmoji = TYPE_EMOJI[data.category || data.itemType || viewType] || '📄';
  const isClickable = true

  return (
    <div
      className={`library_item ${isClickable ? 'clickable' : ''} ${isSelectionMode && viewType !== 'mix' ? 'selection_mode_active' : ''}`}
      title={title}
      onClick={(e) => {
        if (!isClickable) return;

        // 믹스 선택 모드일 때는 카드 어디를 누르든 믹스에 추가되도록 처리
        if (isSelectionMode && !isArchivePage) {
          //새로운 믹스를 만들기 눌렀을때 나타나는 모드
          handleAddBlock(e);
          return;
        }
        // Archive 페이지에서 카드를 클릭하면 → Archive 행에 추가
        if (isArchivePage) {
          if (viewType === 'album') {
            pushAlbumToArchive(data.id);
          } else if (viewType === 'mix') {
            useArchiveUIStore.getState().pushMixToArchive(data.id);
          } else {
            openRightSidebar(data);
          }
        } else {
          // 그 외 → 기존 RightSidebar 열기

          openRightSidebar(data);
        }
      }}
    >
      {/* 썸네일 영역 */}
      <div className="item_image">
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div className="icon_placeholder">
            {fallbackEmoji}
          </div>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div className="item_info">
        <h4 className="item_title">{title}</h4>
        <p className="item_subtitle">{subtitle}</p>
      </div>

      {isSelectionMode && data._viewType !== 'mix' ? (
        <button className="btn_add_mix" onClick={handleAddBlock} title="Add to Mix">
          +
        </button>
      ) : (
        <button className="btn_remove" onClick={handleRemove} title="Delete">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
