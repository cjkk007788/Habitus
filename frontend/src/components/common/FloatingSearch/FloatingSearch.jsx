import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSearchStore from '../../../store/search/useSearchStore';
import './FloatingSearch.css';

export default function FloatingSearch() {
  const { searchQuery, setSearchQuery, clearSearch } = useSearchStore();

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    if (!location.pathname.startsWith('/digging')) {
      navigate('/digging');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      setInputValue('');
      clearSearch();
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    inputRef.current?.focus();
  };

  return (
    <div className="floating-search-container">
      <div className="floating-search-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="fs-input"
          placeholder="검색"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {inputValue && (
          <button className="fs-clear-btn" onClick={handleClear} title="Clear">
            <X size={20} />
          </button>
        )}

        <button className="fs-submit-btn" onClick={handleSearch} title="Search">
          <Search size={20} />
        </button>
      </div>
    </div>
  );
}
