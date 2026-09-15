import React, { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

export default function StarRating({ rating, onChange }) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index) => {
    onChange(index);
  };

  const handleMouseEnter = (index) => {
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="star-rating-container" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = hoverRating >= index || (!hoverRating && rating >= index);
        return (
          <button
            key={index}
            type="button"
            className={`star-button ${isFilled ? 'filled' : ''}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
          >
            <Star 
              size={24} 
              fill={isFilled ? '#F2C94C' : 'transparent'} 
              stroke={isFilled ? '#F2C94C' : 'rgba(255, 255, 255, 0.3)'} 
            />
          </button>
        );
      })}
      <span className="star-rating-text">
        {rating > 0 ? rating.toFixed(1) : 'Not rated'}
      </span>
    </div>
  );
}
