import React, { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import './ImageUrlInput.css';

export default function ImageUrlInput({ coverUrl, additionalUrls, onChange }) {
  const [newUrl, setNewUrl] = useState('');

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    if (!coverUrl) {
      onChange(newUrl.trim(), additionalUrls);
    } else {
      onChange(coverUrl, [...additionalUrls, newUrl.trim()]);
    }
    setNewUrl('');
  };

  const handleRemoveCover = () => {
    if (additionalUrls.length > 0) {
      const newCover = additionalUrls[0];
      const newAdd = additionalUrls.slice(1);
      onChange(newCover, newAdd);
    } else {
      onChange('', []);
    }
  };

  const handleRemoveAdditional = (index) => {
    const newAdd = additionalUrls.filter((_, i) => i !== index);
    onChange(coverUrl, newAdd);
  };

  return (
    <div className="image-url-input">
      <div className="image-url-preview-area">
        {coverUrl ? (
          <div className="main-cover-preview">
            <img src={coverUrl} alt="Cover Preview" onError={(e) => e.target.src = ''} />
            <button type="button" className="remove-btn" onClick={handleRemoveCover}>
              <X size={16} />
            </button>
            <span className="badge">Cover Image</span>
          </div>
        ) : (
          <div className="empty-preview">
            <ImageIcon size={32} opacity={0.3} />
            <p>Add image URL</p>
          </div>
        )}

        {additionalUrls.length > 0 && (
          <div className="additional-previews">
            {additionalUrls.map((url, i) => (
              <div key={i} className="additional-preview">
                <img src={url} alt={`Additional ${i}`} onError={(e) => e.target.src = ''} />
                <button type="button" className="remove-btn" onClick={() => handleRemoveAdditional(i)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="image-url-input-field">
        <input 
          type="url" 
          placeholder="https://..." 
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddUrl(e)}
        />
        <button type="button" onClick={handleAddUrl}>Add</button>
      </div>
    </div>
  );
}
