import React from 'react';
import LibraryItem from '../LibraryItem/LibraryItem';

export default function LeftSidebarList({
  processedList,
  isSelectionMode,
  isStoreEmpty
}) {
  return (
    <div className={`sidebar_list ${isSelectionMode ? 'selection-mode' : ''}`}>
      {/* 데이터가 있을 때: 리스트 렌더링 */}
      {processedList.length > 0 && (
        processedList.map(entry => (
          <LibraryItem key={entry.id} data={entry} isSelectionMode={isSelectionMode} />
        ))
      )}

      {/* 데이터가 없을 때: Empty State */}
      {processedList.length === 0 && (
        <div className="sidebar_empty_state">
          <p>📭</p>
          <p>No items saved yet</p>
          {isStoreEmpty && (
            <button className="mock_data_btn"></button>
          )}
        </div>
      )}
    </div>
  );
}
