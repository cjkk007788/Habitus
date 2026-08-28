import React from 'react';

export default function ArchiveEmptyState() {
  return (
    <div className="archive-empty-state">
      <span className="archive-empty-state-icon">📂</span>
      <p className="archive-empty-state-title">
        왼쪽 My Library에서 카드를 클릭하면 여기에 펼쳐집니다.
      </p>
      <p className="archive-empty-state-desc">
        클릭할수록 위에 쌓입니다.
      </p>
    </div>
  );
}
