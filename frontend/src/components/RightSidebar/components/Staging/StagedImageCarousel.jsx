import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StagedImageCarousel({
  stagedItems,
  currentItem,
  viewingStagedIndex,
  setViewingStagedIndex
}) {
  const stagedList = (Array.isArray(stagedItems) ? stagedItems : [])
    .map(s => s?.itemData ?? s)
    .filter(Boolean);

  const isViewingNew = viewingStagedIndex == null;
  const allItems = isViewingNew && currentItem
    ? [...stagedList, currentItem]
    : stagedList;

  if (!allItems.length) return null;

  const activeIndex = isViewingNew
    ? allItems.length - 1
    : Math.min(viewingStagedIndex, allItems.length - 1);

  const go = (newIdx) => {
    if (newIdx < 0 || newIdx >= allItems.length) return;
    setViewingStagedIndex(newIdx >= stagedList.length ? null : newIdx);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: '100%',
      height: '340px',
      margin: '16px 0',
    }}>
      {/* Left arrow */}
      <button
        onClick={() => go(activeIndex - 1)}
        disabled={activeIndex === 0}
        style={{
          position: 'absolute', left: 0, top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200, background: 'rgba(0,0,0,0.5)',
          border: 'none', color: 'white', width: 36, height: 36,
          borderRadius: '50%', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          opacity: activeIndex === 0 ? 0.2 : 1,
        }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Track */}
      <div style={{
        position: 'relative',
        width: '260px',
        height: '260px',
        perspective: '800px',
        perspectiveOrigin: 'center center',
      }}>
        {allItems.map((it, idx) => {
          const offset = idx - activeIndex;
          const abs = Math.abs(offset);
          if (abs > 4) return null;

          const zIndex = 100 - abs;
          const scale = offset === 0 ? 1 : Math.max(0.55, 1 - abs * 0.18);
          const tx = offset * 120;
          const ry = offset === 0 ? 0 : offset < 0 ? 40 : -40;
          const opacity = abs > 3 ? 0 : 1 - abs * 0.25;
          const brightness = offset === 0 ? 1 : Math.max(0.4, 1 - abs * 0.2);

          const imgUrl =
            it?.coverImages?.[0] ||
            it?.cover_image_url ||
            it?.image_url ||
            it?.poster_path ||
            null;
          const fallbackBg = `hsl(${(idx * 60) % 360}, 45%, 38%)`;
          const label = it?.title ? String(it.title).slice(0, 2).toUpperCase() : '?';

          return (
            <div
              key={it?.id ?? idx}
              onClick={() => go(idx)}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '260px',
                height: '260px',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: offset === 0 ? 'default' : 'pointer',
                boxShadow: offset === 0
                  ? '0 16px 40px rgba(0,0,0,0.7)'
                  : '0 6px 20px rgba(0,0,0,0.5)',
                zIndex,
                opacity,
                transform: `translateX(${tx}px) scale(${scale}) rotateY(${ry}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.4s ease, box-shadow 0.4s ease',
                filter: `brightness(${brightness})`,
                background: fallbackBg,
              }}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={it?.title ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.2rem', fontWeight: 800,
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  {label}
                </div>
              )}
              {/* New badge */}
              {isViewingNew && idx === allItems.length - 1 && stagedList.length > 0 && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'var(--accent-color, #f97316)',
                  color: 'white', fontSize: '0.7rem', fontWeight: 800,
                  padding: '3px 8px', borderRadius: '10px',
                }}>New</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => go(activeIndex + 1)}
        disabled={activeIndex === allItems.length - 1}
        style={{
          position: 'absolute', right: 0, top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200, background: 'rgba(0,0,0,0.5)',
          border: 'none', color: 'white', width: 36, height: 36,
          borderRadius: '50%', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          opacity: activeIndex === allItems.length - 1 ? 0.2 : 1,
        }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
