import React from 'react';
import { Play } from 'lucide-react';

export default function MediaAlbum({ item, onClick, onPlayClick }) {
  // Support backend's new image_url field or fallback to coverImages
  const imgUrl = item.image_url || item.coverImages?.[0];
  const isArtist = item.itemType === 'music_artist' || (item.type && item.type.toLowerCase() === 'group' || item.type === 'Person');
  const imageStyle = isArtist ? { borderRadius: '50%', objectFit: 'cover' } : { objectFit: 'cover' };

  return (
    <div className="uhd-album" onClick={() => onClick(item)}>
      <div className="uhd-album-image" style={isArtist ? { borderRadius: '50%', overflow: 'hidden' } : {}}>
        {imgUrl ? (
          <img src={imgUrl} alt={item.title || item.name} loading="lazy" style={imageStyle} />
        ) : (
          <div className="uhd-album-placeholder" style={{ backgroundColor: item.bgColor || '#333', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', ...imageStyle }}>
            {item.itemType === 'music' ? '🎵' : item.itemType === 'movie_person' ? '👤' : isArtist ? '🎤' : item.itemType === 'movie' ? '🎬' : '📚'}
          </div>
        )}
        <button
          className="uhd-album-play-btn"
          onClick={(e) => onPlayClick(e, item)}
          title="Preview / Trailer"
          style={isArtist ? { bottom: '15%', right: '15%' } : {}}
        >
          <Play size={16} fill="white" color="white" />
        </button>
      </div>

      <div className="uhd-album-info">
        <span className="uhd-album-title">{item.title}</span>
        <span className="uhd-album-artist">
          {item.itemType === 'music' ? 'Track' : item.itemType === 'music_artist' ? 'Artist' : item.itemType === 'movie_person' ? 'Person' : item.itemType === 'movie' ? 'Movie' : item.itemType === 'book' ? 'Book' : 'Content'} • {item.subtitle || item.mediaMeta?.contributors?.[0]?.name || 'Unknown'}
        </span>
      </div>
    </div>
  );
}
