import React from 'react';
import ArchiveAlbumRow from '../ArchiveAlbumRow/ArchiveAlbumRow';
import { useArchiveStore } from '../../store/archive';
import useSidebarStore from '../../store/sidebar/useSidebarStore';

export default function ArchiveMixGroup({ group, onRemove }) {
  const openRightSidebar = useSidebarStore((state) => state.openRightSidebar);
  
  const headerItem = group.items.find(i => i.type === 'mix_header');
  const childItems = group.items.filter(i => i.type !== 'mix_header');
  
  if (!headerItem) return null; // 만약 헤더가 없다면 안전하게 렌더링 스킵
  
  const handleEditClick = () => {
    const mix = useArchiveStore.getState().mixes.find(m => m.id === headerItem.targetId);
    if (mix) {
      useArchiveStore.getState().loadMixForEditing(mix);
      openRightSidebar({ id: 'mix_edit', _viewType: 'mix' });
    }
  };

  return (
    <div className="archive-mix-group">
      {/* 헤더 타이틀 영역 */}
      <div className="archive-mix-group-header">
        <h2 className="archive-mix-group-title" onClick={handleEditClick}>
          <span className="archive-mix-group-icon">📦</span> {headerItem.albumTitle}
        </h2>
        <button
          onClick={onRemove}
          title="믹스 전체 닫기"
          className="archive-mix-group-close-btn"
        >
          ✕
        </button>
      </div>

      {/* 자식 앨범 렌더링 영역 */}
      <div className="archive-mix-group-children">
        {childItems.map(child => (
          <ArchiveAlbumRow
            key={child.id}
            album={child}
            onRemove={null} // 믹스 안에 감싸진 자식들은 개별 X버튼 제거
          />
        ))}
      </div>
    </div>
  );
}
