import React, { useState } from 'react';
import { X } from 'lucide-react';
import './HashtagInput.css';

export default function HashtagInput({ tags, onChange }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="hashtag-input-container">
      <div className="hashtag-chips">
        {tags.map((tag, index) => (
          <div key={index} className="hashtag-chip">
            #{tag}
            <button
              type="button"
              className="hashtag-chip-remove"
              onClick={() => removeTag(index)}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <input
        type="text"
        className="hashtag-input"
        placeholder="Enter hashtag (Press Enter to add)"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
      />
    </div>
  );
}
