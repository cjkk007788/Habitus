import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function ArchivingForm({ formState, setFormState }) {
  // If formState is not provided, use defaults to prevent crashing
  const { rating = 0, isPublic = true, review = '', tags = [] } = formState || {};
  const [tagInput, setTagInput] = useState('');

  //setFormState?. 이거는 함수를 넘겨받으면 실행하고 안 넘겨 받으면 냅두는 로직
  //rating을 바꾸고, Public을 바꾸고, Review를 바꾸는 함수를 정의하는 부분
  const setRating = (val) => setFormState?.(prev => ({ ...prev, rating: val }));
  const setIsPublic = (val) => setFormState?.(prev => ({ ...prev, isPublic: val }));
  const setReview = (val) => setFormState?.(prev => ({ ...prev, review: val }));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setFormState?.(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove) => {
    setFormState?.(prev => ({ ...prev, tags: prev.tags.filter((_, index) => index !== indexToRemove) }));
  };

  return (
    <div className="rs-archiving-form">
      <h3 className="rs-form-title">📝 Leave a Record</h3>

      <div className="rs-form-group">
        <label>Privacy</label>
        <div className="rs-toggle-group">
          <button
            className={`rs-toggle-btn ${isPublic ? 'active' : ''}`}
            onClick={() => setIsPublic(true)}
          >
            🔓 Public
          </button>
          <button
            className={`rs-toggle-btn ${!isPublic ? 'active' : ''}`}
            onClick={() => setIsPublic(false)}
          >
            🔒 Private
          </button>
        </div>
      </div>

      <div className="rs-form-group">
        <label>Rating</label>
        <div className="rs-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`rs-star ${star <= rating ? 'filled' : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <div className="rs-form-group">
        <label>Context/Mood Tags</label>
        <div className="rs-tag-input-wrapper">
          <input
            type="text"
            className="rs-tag-input"
            placeholder="Add a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
        </div>
        {tags.length > 0 && (
          <div className="rs-tag-list">
            {tags.map((tag, index) => (
              <span key={index} className="rs-tag">
                #{tag}
                <span
                  className="rs-tag-remove"
                  onClick={() => removeTag(index)}
                >
                  ✕
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rs-form-group">
        <label>Review</label>
        <textarea
          className="rs-textarea"
          placeholder="Write your thoughts freely..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
      </div>
    </div>
  );
}
