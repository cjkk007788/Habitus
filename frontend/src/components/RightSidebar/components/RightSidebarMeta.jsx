import React from 'react';

export default function RightSidebarMeta({ categoryLabel, year, item, creatorName }) {
  return (
    <div className="rs-meta-info">
      <div className="rs-meta-badge">
        {categoryLabel} · {year}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="rs-item-title">{item.title || item.albumTitle || item.artistName}</h2>
          <p className="rs-item-creator">{creatorName}</p>
        </div>
      </div>
    </div>
  );
}
