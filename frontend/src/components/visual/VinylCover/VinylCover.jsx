import React from 'react';
import './VinylCover.css';

export default function VinylCover({ imageUrl, isPlaying }) {
  return (
    <div className="vinyl-container">
      {/* The black vinyl record */}
      <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}>
        <div className="vinyl-grooves"></div>
        {/* The center label of the record (album art) */}
        <div className="vinyl-center-label">
          <img src={imageUrl} alt="Album Art" />
        </div>
        {/* The center hole */}
        <div className="vinyl-hole"></div>
      </div>

      {/* The outer sleeve / album cover */}
      <div className={`vinyl-sleeve ${isPlaying ? 'playing' : ''}`}>
        <img src={imageUrl} alt="Album Cover" />
      </div>
    </div>
  );
}
