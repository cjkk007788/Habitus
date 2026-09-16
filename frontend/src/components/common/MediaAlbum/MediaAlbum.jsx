import React from 'react';
import { Play } from 'lucide-react';

export default function MediaAlbum({ item, onClick, onPlayClick }) {
  // Support backend's new image_url field or fallback to coverImages
  const imgUrl = item.image_url || item.coverImages?.[0];
  const imageStyle = { objectFit: 'cover' };

  return (
    <div className="uhd-album" onClick={() => onClick(item)}>
      <div className="uhd-album-image">
        {imgUrl ? (
          <img src={imgUrl} alt={item.title || item.name} loading="lazy" style={imageStyle} />
        ) : (
          <div className="uhd-album-placeholder" style={{ backgroundColor: item.bgColor || '#333', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            {item.itemType === 'music' || item.itemType === 'music_artist' ? '🎵' : item.itemType === 'movie' || item.itemType === 'movie_person' ? '🎬' : '📚'}
          </div>
        )}
        <button
          className="uhd-album-play-btn"
          onClick={(e) => onPlayClick(e, item)}
          title="Preview / Trailer"
        >
          <Play size={16} fill="white" color="white" />
        </button>
      </div>

      <div className="uhd-album-info">
        <span className="uhd-album-title">{item.title}</span>
        <span className="uhd-album-artist">
          {item.itemType === 'music' || item.itemType === 'music_artist' ? 'Music' : item.itemType === 'movie' || item.itemType === 'movie_person' ? 'Movie' : item.itemType === 'book' ? 'Book' : 'Content'} • {item.subtitle || item.mediaMeta?.contributors?.[0]?.name || 'Unknown'}
        </span>
      </div>
    </div>
  );
}
