import React, { useState } from 'react';
import { Link2, X } from 'lucide-react';
import './LinksInput.css';

const getPlatformFromUrl = (url) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('spotify.com')) return 'Spotify';
  if (lowerUrl.includes('melon.com')) return 'Melon';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'YouTube';
  if (lowerUrl.includes('apple.com')) return 'Apple Music';
  if (lowerUrl.includes('netflix.com')) return 'Netflix';
  if (lowerUrl.includes('watcha.com')) return 'Watcha';
  if (lowerUrl.includes('ridibooks.com')) return 'Ridi';
  return 'Link';
};

export default function LinksInput({ links, onChange }) {
  const [newUrl, setNewUrl] = useState('');

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    
    // Basic URL validation
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const platform = getPlatformFromUrl(url);
    const newLinks = [...links, { url, platform }];
    onChange(newLinks);
    setNewUrl('');
  };

  const handleRemoveUrl = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    onChange(newLinks);
  };

  return (
    <div className="links-input">
      {links.length > 0 && (
        <div className="links-list">
          {links.map((link, i) => (
            <div key={i} className="link-item">
              <Link2 size={14} className="link-icon" />
              <div className="link-info">
                <span className="link-platform">{link.platform}</span>
                <span className="link-url">{link.url}</span>
              </div>
              <button type="button" className="remove-link-btn" onClick={() => handleRemoveUrl(i)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="links-input-field">
        <input 
          type="url" 
          placeholder="https://... (e.g., Spotify, YouTube link)" 
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddUrl(e)}
        />
        <button type="button" onClick={handleAddUrl}>Add</button>
      </div>
    </div>
  );
}
