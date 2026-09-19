import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings, Trash2 } from 'lucide-react';

//Create Custom album page 맨위에 있는 캐러셀

export default function CustomCarouselNav({ items, activeTab, setActiveTab, onAdd, onRemove }) {
  // 1. 모든 카드 배열 구성
  // items 배열 뒤에 '추가 버튼' 카드만 붙입니다.
  const cards = [
    ...items,
    { id: 'add', isAction: true, label: 'Add Item', icon: <Plus size={32} /> }
  ];

  // 2. 현재 활성화된 카드의 숫자 인덱스 계산
  let activeIndex = 0;
  if (typeof activeTab === 'number') {
    activeIndex = activeTab;
  }

  const go = (newIdx) => {
    if (newIdx < 0 || newIdx >= cards.length) return;
    const targetCard = cards[newIdx];
    if (targetCard.isAction) {
      onAdd();
      return;
    }
    setActiveTab(newIdx);
  };

  const handleRemove = (e, index) => {
    e.stopPropagation();
    onRemove(index, e);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center', // 트랙을 중앙에 두기 위해 중앙정렬은 유지하되 width를 제한
      position: 'relative',
      width: '320px', // 여백 축소 및 고정 너비
      height: '180px',
      margin: '0',
      userSelect: 'none'
    }}>
      {/* 왼쪽 화살표 */}
      <button
        onClick={() => go(activeIndex - 1)}
        disabled={activeIndex === 0}
        style={{
          position: 'absolute', left: -16, top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200, background: 'rgba(0,0,0,0.5)',
          border: 'none', color: 'white', width: 40, height: 40,
          borderRadius: '50%', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          opacity: activeIndex === 0 ? 0.2 : 1,
          transition: 'all 0.2s'
        }}
      >
        <ChevronLeft size={24} />
      </button>

      {/* 3D 회전 트랙 */}
      <div style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        perspective: '1000px',
        perspectiveOrigin: 'center center',
      }}>
        {cards.map((card, idx) => {
          const offset = idx - activeIndex;
          const abs = Math.abs(offset);
          if (abs > 4) return null; // 너무 멀리 있는 카드는 렌더링 안 함

          const zIndex = 100 - abs;
          const scale = offset === 0 ? 1 : Math.max(0.6, 1 - abs * 0.15);
          const tx = offset * 90; // 카드 간격
          const ry = offset === 0 ? 0 : offset < 0 ? 35 : -35;
          const opacity = abs > 3 ? 0 : 1 - abs * 0.2;
          const brightness = offset === 0 ? 1 : Math.max(0.3, 1 - abs * 0.25);

          // 배경색 및 이미지 처리
          let fallbackBg = `hsl(${(idx * 40) % 360}, 45%, 30%)`;
          if (card.isAction) fallbackBg = 'rgba(255, 255, 255, 0.05)';

          const isCurrent = offset === 0;

          return (
            <div
              key={card.id || idx}
              onClick={() => go(idx)}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '160px',
                height: '160px',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: isCurrent ? 'default' : 'pointer',
                boxShadow: isCurrent
                  ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 2px var(--accent-color)'
                  : '0 8px 20px rgba(0,0,0,0.4)',
                zIndex,
                opacity,
                transform: `translateX(${tx}px) scale(${scale}) rotateY(${ry}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.4s ease, box-shadow 0.4s ease, filter 0.4s ease',
                filter: `brightness(${brightness})`,
                background: fallbackBg,
                border: card.isAction ? '2px dashed rgba(255,255,255,0.3)' : 'none'
              }}
            >
              {/* 이미지 렌더링 */}
              {(card.imageUrls?.[0] || card.imageUrl) ? (
                <img
                  src={card.imageUrls?.[0] || card.imageUrl}
                  alt={card.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  color: card.isAction ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)'
                }}>
                  {card.icon ? card.icon : <div style={{ fontSize: '2.5rem', fontWeight: 800, opacity: 0.3 }}>{idx + 1}</div>}
                  {card.label && <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{card.label}</div>}
                  {!card.isAction && card.title && (
                    <div style={{ fontSize: '1rem', fontWeight: 700, textAlign: 'center', padding: '0 8px' }}>{card.title}</div>
                  )}
                </div>
              )}

              {/* 삭제 버튼 (일반 아이템 탭이고 현재 활성화된 상태일 때만 표시) */}
              {!card.isAction && isCurrent && items.length > 1 && (
                <button
                  onClick={(e) => handleRemove(e, idx)}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    background: '#ff4d4f', color: '#fff', border: 'none',
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 10
                  }}
                  title="Remove Item"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 오른쪽 화살표 */}
      <button
        onClick={() => go(activeIndex + 1)}
        disabled={activeIndex === cards.length - 1}
        style={{
          position: 'absolute', right: -16, top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200, background: 'rgba(0,0,0,0.5)',
          border: 'none', color: 'white', width: 40, height: 40,
          borderRadius: '50%', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          opacity: activeIndex === cards.length - 1 ? 0.2 : 1,
          transition: 'all 0.2s'
        }}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
