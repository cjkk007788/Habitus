import React, { useState, useRef, useEffect } from 'react';
import AnimatedText from '../../common/AnimatedText/AnimatedText';

export default function AlbumTitleEditor({ value, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    //inputRef.current에는 html이 있다.
    if (isEditing && inputRef.current) {
      //inputRef는 html객체 React에서는 html객체를 일반적으로 조작하면 안되지만
      //필요한 경우 이렇게 쓸 수 있다.
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => setIsEditing(false);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div style={{ padding: '8px 16px 4px' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Album title..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid var(--accent-color, #f97316)',
            color: 'var(--text-primary)',
            fontSize: '1.6rem',
            fontWeight: 800,
            padding: '4px 0',
            outline: 'none',
            letterSpacing: '-0.02em',
            fontFamily: 'inherit',
          }}
        />
      </div>
    );
  }

  return (
    <h2
      className="hover-trigger"
      onClick={() => setIsEditing(true)}
      style={{
        fontSize: '1.6rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        margin: 0,
        padding: '8px 16px 4px',
        cursor: 'text',
        color: 'var(--text-primary)',
        lineHeight: 1.2,
      }}
    >
      {value
        ? <AnimatedText text={value} />
        : <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontStyle: 'italic', fontSize: '1.3rem' }}>
            Untitled Album
          </span>
      }
    </h2>
  );
}
