import React from 'react';
import { X } from 'lucide-react';
import { useArchiveStore } from '../../../store/archive';

export default function StagedItemsList({ viewingStagedIndex, setViewingStagedIndex }) {
  const { stagedItems, removeStagedItem } = useArchiveStore();

  if (stagedItems.length === 0) return null;

  return (
    <div className="rs-staged-list">
      {stagedItems.map((staged, idx) => (
        <div key={idx} className="rs-staged-item">
          {staged.itemData.coverImages?.[0] ? (
            <img src={staged.itemData.coverImages[0]} alt="cover" className="rs-staged-thumb" />
          ) : (
            <div className="rs-staged-thumb" style={{ backgroundColor: '#333' }}></div>
          )}
          <div className="rs-staged-info">
            <div className="rs-staged-title">{staged.itemData.title}</div>
            <div className="rs-staged-tags">
              {staged.formState.tags?.map((t, i) => (
                <span key={i} className="rs-staged-tag">#{t}</span>
              ))}
            </div>
          </div>
          <button
            className="rs-staged-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              removeStagedItem(idx);
              if (viewingStagedIndex === idx) {
                setViewingStagedIndex(null);
              } else if (viewingStagedIndex !== null && viewingStagedIndex > idx) {
                setViewingStagedIndex(viewingStagedIndex - 1);
              }
            }}
            title="Remove item"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
