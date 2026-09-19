import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSearchStore from '../../../store/search/useSearchStore';
import { searchContent } from '../../../api/searchApi';
import './FloatingSearch.css';

export default function FloatingSearch() {
  const { 
    searchQuery, setSearchQuery, clearSearch, 
    setIsSearching, setSearchResults, setSearchError 
  } = useSearchStore();

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);

    if (!location.pathname.startsWith('/digging') && !location.pathname.includes('/archive/custom') && !location.pathname.startsWith('/curation')) {
      navigate('/digging');
    } else if (location.pathname.includes('/archive/custom')) {
      // Custom 페이지에서는 Digging 페이지가 없으므로 여기서 직접 API 호출
      setIsSearching(true);
      setSearchError(null);
      try {
        // 모든 카테고리(all)에서 12개씩 검색
        const data = await searchContent(trimmed, 'all', 12);
        setSearchResults(data.results || []);
      } catch (err) {
        setSearchError(err.message || 'Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
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
