import React, { useState, useRef } from 'react';
import { PanelRight, Search, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import useSearchStore from '../../../store/search/useSearchStore';
import './TopHeader.css';

const FILTERS = [
  { id: 'music', label: 'Music' },
  { id: 'movie', label: 'Movie' },
  { id: 'book',  label: 'Book'  },
  { id: 'all',   label: 'All'   },
];

export default function TopHeader() {
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarStore();
  const {
    searchQuery, searchFilter,
    setSearchQuery, setSearchFilter,    clearSearch,
  } = useSearchStore();

  const [inputValue, setInputValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 검색 실행: 전역 상태에 query를 set하고 Digging 페이지로 이동
  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    // Digging 페이지가 아닐 때만 이동
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

  const handleFilterSelect = (filterId) => {
    setSearchFilter(filterId);
    setIsFilterOpen(false);
    // 이미 검색어가 있으면 필터 변경 시 재검색 트리거
    if (searchQuery) {
      setSearchQuery(searchQuery); // 동일 값 재set → Digging의 useEffect가 감지
    }
  };

  const activeFilterLabel = FILTERS.find(f => f.id === searchFilter)?.label || 'Music';

  return (
    <header className="top-header">
      <div className="top-header-left">
        <h1 className="logo">HABITUS</h1>
      </div>

      {/* Center: 검색창 + 필터 */}
      <div className="top-header-center">
        <div className="search-bar-wrapper">
          {/* 필터 드롭다운 트리거 */}
          <div className="search-filter-trigger" onClick={() => setIsFilterOpen(o => !o)}>
            <span className="search-filter-label">{activeFilterLabel}</span>
            <span className="search-filter-arrow">{isFilterOpen ? '▲' : '▼'}</span>
          </div>

          <div className="search-divider" />

          {/* 검색 아이콘 + 인풋 */}
          <Search className="search-icon" size={16} />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={`Search ${activeFilterLabel}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* 클리어 버튼 */}
          {inputValue && (
            <button className="search-clear-btn" onClick={handleClear} title="Clear">
              <X size={14} />
            </button>
          )}

          {/* 검색 버튼 */}
          <button className="search-submit-btn" onClick={handleSearch} title="Search">
            Search
          </button>

          {/* 필터 드롭다운 */}
          {isFilterOpen && (
            <div className="search-filter-dropdown">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  className={`search-filter-option ${searchFilter === f.id ? 'active' : ''}`}
                  onClick={() => handleFilterSelect(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="top-header-right">
        <button
          className="sidebar-toggle-btn"
          onClick={toggleRightSidebar}
          title="Toggle right sidebar"
          style={{
            background: 'none', border: 'none',
            color: isRightSidebarOpen ? 'var(--accent-color)' : 'var(--text-secondary)',
            cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center'
          }}
        >
          <PanelRight size={22} />
        </button>
        <div className="profile-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
    </header>
  );
}
