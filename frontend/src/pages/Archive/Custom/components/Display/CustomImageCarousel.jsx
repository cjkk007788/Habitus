import React from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';

//Create album page edit 중앙에 있는 item에 들어가는 여러 이미지들의 캐러셀
export default function CustomImageCarousel({ images, activeIndex, setActiveIndex, onRemove, onImageClick, onAddClick }) {
  const cards = [...(images || []), 'add-action'];

  const go = (newIdx) => {
    if (newIdx < 0 || newIdx >= cards.length) return;
    setActiveIndex(newIdx);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '800px',
      userSelect: 'none'
    }}>
      {/* 3D Track */}
      <div style={{ position: 'relative', width: '200px', height: '200px', transformStyle: 'preserve-3d' }}>
        {cards.map((item, idx) => {
          const isAction = item === 'add-action';
          const url = isAction ? null : item;

          const offset = idx - activeIndex;
          const abs = Math.abs(offset);
          if (abs > 3) return null;

          const zIndex = 100 - abs;
          const scale = offset === 0 ? 1 : Math.max(0.7, 1 - abs * 0.15);
          const tx = offset * 110;
          const ry = offset === 0 ? 0 : offset < 0 ? 30 : -30;
          const opacity = abs > 2 ? 0 : 1 - abs * 0.3;
          const isCurrent = offset === 0;

          return (
            <div
              key={idx}
              onClick={() => {
                if (isAction) {
                  if (onAddClick) onAddClick();
                } else {
                  isCurrent ? (onImageClick && onImageClick(url)) : go(idx);
                }
              }}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '200px',
                height: '200px',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: isCurrent ? '0 12px 24px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.4)',
                zIndex,
                opacity,
                transform: `translateX(${tx}px) scale(${scale}) rotateY(${ry}deg)`,
                transition: 'transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.4s ease, box-shadow 0.4s ease',
                background: isAction ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.05)',
                border: isCurrent ? (isAction ? '1px dashed rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.3)') : '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: isAction ? 'rgba(255,255,255,0.5)' : '#fff'
              }}
            >
              {!isAction && (
                <img
                  src={url}
                  alt={`preview-${idx}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                  onError={(e) => e.target.src = ''}
                />
              )}

              {isAction && (
                <>
                  <Plus size={48} />
                  <div style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: 600 }}>Add Image</div>
                </>
              )}

              {!isAction && isCurrent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(idx);
                  }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Remove Image"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 카운터 (이미지가 있을 때만) */}
      {(images && images.length > 0) && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, zIndex: 200 }}>
          {activeIndex < images.length ? `${activeIndex + 1} / ${images.length}` : 'New'}
        </div>
      )}

      {/* 화살표 */}
      {cards.length > 1 && (
        <>
          <button
            onClick={() => go(activeIndex > 0 ? activeIndex - 1 : cards.length - 1)}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => go(activeIndex < cards.length - 1 ? activeIndex + 1 : 0)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
