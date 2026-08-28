import React from 'react';

export default function LeftSidebarFooter({
  isStoreEmpty,
  clearArchive
}) {
  if (isStoreEmpty) return null;

  return (
    <div className="sidebar_footer">
      <button
        className="clear_archive_btn"
        onClick={() => {
          if (window.confirm('Are you sure you want to delete all data?')) {
            clearArchive();
          }
        }}
      >
        🗑️ Empty Library
      </button>
    </div>
  );
}
