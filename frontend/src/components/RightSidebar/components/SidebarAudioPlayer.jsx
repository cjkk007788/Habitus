import React from 'react';
import { Play } from 'lucide-react';

export default function SidebarAudioPlayer({ item, onPlay, onPause }) {
  if (!item.previewUrl) {
    return (
      <div className="rs-audio-player" style={{ marginTop: '5px' }}>
        <div style={{ padding: '8px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', textAlign: 'center', width: '100%', color: 'var(--text-secondary)' }}>
          No audio preview available for this track.
        </div>
      </div>
    );
  }

  return (
    <div className="rs-audio-player" style={{ marginTop: '5px' }}>
      <audio 
        controls 
        src={item.previewUrl} 
        onPlay={onPlay}
        onPause={onPause}
        style={{ width: '100%', height: '36px', outline: 'none', borderRadius: '4px', opacity: 0.9 }}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
