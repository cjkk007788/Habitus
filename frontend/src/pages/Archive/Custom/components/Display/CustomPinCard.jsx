import React from 'react';
import { Star, Music, Film, BookOpen, Palette, Pin, Globe } from 'lucide-react';
import './CustomPinCard.css';

const CATEGORY_CONFIG = {
  music:   { icon: Music,    label: 'Music',   color: '#9B51E0' },
  movie:   { icon: Film,     label: 'Movie',   color: '#2D9CDB' },
  book:    { icon: BookOpen,  label: 'Book',    color: '#27AE60' },
  art:     { icon: Palette,   label: 'Art',     color: '#F2994A' },
  custom:  { icon: Pin,       label: 'Custom',  color: '#EB5757' },
  place:   { icon: Pin,       label: 'Place',   color: '#56CCF2' },
  food:    { icon: Pin,       label: 'Food',    color: '#F2C94C' },
  fashion: { icon: Pin,       label: 'Fashion', color: '#BB6BD9' },
  moment:  { icon: Pin,       label: 'Moment',  color: '#6FCF97' },
  quote:   { icon: Pin,       label: 'Quote',   color: '#E05263' },
};

/**
 * 핀 카드에 표시할 대표(메타) 아이템을 추출
 */

//album id를 받아서 album

function getMetaItem(album) {
  
  if (!album.items || album.items.length === 0) return null;
  // user_meta.is_meta_item이 true인 아이템을 찾고, 없으면 첫 번째 아이템 사용
  return album.items.find(i => i.userMeta?.is_meta_item) || album.items[0];
}

/**
 * 별점 렌더링
 */

function RatingDisplay({ rating }) {
  if (!rating || rating <= 0) return null;
  return (
    <div className="pin-card__rating">
      <Star size={12} fill="#F2C94C" stroke="#F2C94C" />
      <span>{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function ShareButton({ album, onTogglePublic }) {
  if (!onTogglePublic) return null;
  return (
    <button 
      className={`pin-card__share-btn ${album.is_public ? 'active' : ''}`}
      onClick={(e) => onTogglePublic(album, e)}
      title={album.is_public ? 'Make Private' : 'Share to Curation'}
    >
      <Globe size={14} color={album.is_public ? '#9B51E0' : '#888'} />
    </button>
  );
}

/**
 * 커스텀 핀 카드 컴포넌트
 * pin_layout에 따라 3가지 레이아웃을 렌더링
 */

export default function CustomPinCard({ album, onClick, onTogglePublic }) {
  const meta = getMetaItem(album);
  if (!meta) return null;

  const layout = meta.userMeta?.pin_layout || 'classic';
  const category = album.category || 'custom';
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.custom;
  const CategoryIcon = config.icon;

  const coverUrl = meta.coverImageUrl || meta.mediaMeta?.images?.[0] || '';
  const title = album.title || meta.title || 'Untitled';
  const impression = meta.impression || '';
  const description = meta.description || '';
  const hashtags = meta.genres || [];
  const rating = meta.rating || 0;
  const dominantColor = meta.dominantColor || config.color;
  const itemCount = album.items?.length || 0;

  const handleClick = () => onClick?.(album);

  // ── Classic 레이아웃 ──
  if (layout === 'classic') {
    return (
      <div className="pin-card pin-card--classic" onClick={handleClick}>
        {coverUrl && (
          <div className="pin-card__image-wrapper">
            <img src={coverUrl} alt={title} className="pin-card__image" loading="lazy" />
            <div className="pin-card__category-badge" style={{ backgroundColor: config.color }}>
              <CategoryIcon size={11} />
              <span>{config.label}</span>
            </div>
            {itemCount > 1 && (
              <div className="pin-card__item-count">{itemCount} items</div>
            )}
          </div>
        )}
        {!coverUrl && (
          <div className="pin-card__no-image" style={{ background: `linear-gradient(135deg, ${dominantColor}44, ${dominantColor}22)` }}>
            <CategoryIcon size={32} style={{ color: dominantColor, opacity: 0.6 }} />
          </div>
        )}
        <div className="pin-card__body">
          <h3 className="pin-card__title">{title}</h3>
          {impression && <p className="pin-card__impression">{impression}</p>}
          <div className="pin-card__footer">
            {hashtags.length > 0 && (
              <div className="pin-card__tags">
                {hashtags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="pin-card__tag">#{tag}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
              <RatingDisplay rating={rating} />
              <ShareButton album={album} onTogglePublic={onTogglePublic} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Editorial 레이아웃 ──
  if (layout === 'editorial') {
    const overlayOpacity = meta.userMeta?.pin_style?.overlay_opacity ?? 0.55;
    return (
      <div className="pin-card pin-card--editorial" onClick={handleClick}>
        <div className="pin-card__image-wrapper pin-card__image-wrapper--editorial">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="pin-card__image" loading="lazy" />
          ) : (
            <div className="pin-card__no-image pin-card__no-image--editorial" style={{ background: `linear-gradient(135deg, ${dominantColor}66, ${dominantColor}33)` }}>
              <CategoryIcon size={40} style={{ color: '#fff', opacity: 0.4 }} />
            </div>
          )}
          <div className="pin-card__overlay" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}>
            <div className="pin-card__category-badge pin-card__category-badge--editorial" style={{ borderColor: config.color }}>
              <CategoryIcon size={10} />
              <span>{config.label}</span>
            </div>
            <h3 className="pin-card__title pin-card__title--editorial">{title}</h3>
            {impression && (
              <p className="pin-card__impression pin-card__impression--editorial">— {impression}</p>
            )}
          </div>
        </div>
        {description && (
          <div className="pin-card__editorial-review">
            <span className="pin-card__editorial-label">REVIEW</span>
            <p className="pin-card__editorial-text">{description.slice(0, 120)}{description.length > 120 ? '...' : ''}</p>
          </div>
        )}
        <div className="pin-card__footer">
          {hashtags.length > 0 && (
            <div className="pin-card__tags">
              {hashtags.slice(0, 2).map((tag, i) => (
                <span key={i} className="pin-card__tag">#{tag}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <RatingDisplay rating={rating} />
            <ShareButton album={album} onTogglePublic={onTogglePublic} />
          </div>
        </div>
      </div>
    );
  }

  // ── Minimal 레이아웃 ──
  return (
    <div
      className="pin-card pin-card--minimal"
      style={{ background: `linear-gradient(160deg, ${dominantColor}30, ${dominantColor}10, var(--bg-color-panel))` }}
      onClick={handleClick}
    >
      <div className="pin-card__category-badge pin-card__category-badge--minimal" style={{ borderColor: config.color }}>
        <CategoryIcon size={10} />
        <span>{config.label}</span>
      </div>
      <h3 className="pin-card__title pin-card__title--minimal">{title}</h3>
      {impression && (
        <p className="pin-card__impression pin-card__impression--minimal">"{impression}"</p>
      )}
      <div className="pin-card__footer">
        {hashtags.length > 0 && (
          <div className="pin-card__tags">
            {hashtags.slice(0, 3).map((tag, i) => (
              <span key={i} className="pin-card__tag">#{tag}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
          <RatingDisplay rating={rating} />
          <ShareButton album={album} onTogglePublic={onTogglePublic} />
        </div>
      </div>
      <div className="pin-card__minimal-accent" style={{ backgroundColor: dominantColor }} />
    </div>
  );
}
