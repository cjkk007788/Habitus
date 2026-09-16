import React, { useState, useRef, useEffect, useMemo } from 'react';
import AnimatedText from "../../../common/AnimatedText/AnimatedText";

export default function AlbumSettingsEditor({ 
  title, setTitle,
  cover, setCover,
  description, setDescription,
  layout, setLayout,
  stagedItems 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const availableImages = useMemo(() => {
    const images = new Set();
    stagedItems.forEach(st => {
      const item = st.itemData;
      if (Array.isArray(item.coverImages) && item.coverImages.length > 0) {
        images.add(item.coverImages[0]);
      } else if (item.image_url) {
        images.add(item.image_url);
      } else if (item.coverImageUrl) {
        images.add(item.coverImageUrl);
      } else if (item.coverImage) {
        images.add(item.coverImage);
      }
    });
    return Array.from(images);
  }, [stagedItems]);

  if (isEditing) {
    return (
      <div style={{ padding: '16px', background: 'var(--surface-color, #1a1a1a)', borderRadius: '12px', marginBottom: '16px' }}>
        {/* Title */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Album title..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid var(--accent-color, #f97316)',
            color: 'var(--text-primary)',
            fontSize: '1.4rem',
            fontWeight: 700,
            padding: '4px 0',
            outline: 'none',
            marginBottom: '16px'
          }}
        />

        {cover && (
          <div style={{ marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img
              src={cover}
              alt="Album Cover Preview"
              style={{
                width: '180px',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        )}

        {/* Cover URL Input */}
        <input
          type="text"
          placeholder="Cover image URL..."
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          style={{ 
            width: '100%', padding: '8px', marginBottom: '8px', 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', borderRadius: '4px', fontSize: '0.9rem' 
          }}
        />

        {/* Thumbnails */}
        {availableImages.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px' }}>
            {availableImages.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt="thumbnail suggestion"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: cover === imgUrl ? '2px solid var(--accent-color, #f97316)' : '2px solid transparent',
                  opacity: cover === imgUrl ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onClick={() => setCover(imgUrl)}
                onMouseEnter={(e) => { e.target.style.opacity = 1; }}
                onMouseLeave={(e) => { if (cover !== imgUrl) e.target.style.opacity = 0.6; }}
                title="Use as cover"
              />
            ))}
          </div>
        )}

        {/* Description */}
        <textarea
          placeholder="Album description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ 
            width: '100%', padding: '8px', marginBottom: '12px', minHeight: '60px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', borderRadius: '4px', fontSize: '0.9rem', resize: 'vertical'
          }}
        />

        {/* Layout */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Layout Preset
          </label>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            style={{ 
              width: '100%', padding: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', borderRadius: '4px', fontSize: '0.9rem' 
            }}
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <button 
          onClick={() => setIsEditing(false)}
          style={{
            width: '100%', padding: '8px', background: 'var(--accent-color, #f97316)',
            color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          Done Editing Settings
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 4px', marginBottom: '8px' }}>
      <h2
        className="hover-trigger"
        onClick={() => setIsEditing(true)}
        style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          cursor: 'pointer',
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {title
          ? <AnimatedText text={title} />
          : <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontStyle: 'italic', fontSize: '1.3rem' }}>
              Untitled Album
            </span>
        }
      </h2>
      <div 
        style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', cursor: 'pointer' }}
        onClick={() => setIsEditing(true)}
      >
        Tap to edit album cover & design...
      </div>
    </div>
  );
}
