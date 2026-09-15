import React from 'react';
import './MasonryGrid.css';

/**
 * 반응형 매이슨리 그리드 컴포넌트
 * CSS columns 기반으로 라이브러리 없이 구현
 */
export default function MasonryGrid({ children, className = '' }) {
  return (
    <div className={`masonry-grid ${className}`}>
      {React.Children.map(children, (child, index) => (
        <div className="masonry-grid__item" key={index}>
          {child}
        </div>
      ))}
    </div>
  );
}
