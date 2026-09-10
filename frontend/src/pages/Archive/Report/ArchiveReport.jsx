import React, { useState, useEffect } from 'react';
import AnimatedText from '../../../components/common/AnimatedText/AnimatedText';
import { fetchTasteAnalysis } from '../../../api/reportApi';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import './ArchiveReport.css';

const getTypeIcon = (type) => {
  switch (type) {
    case 'music': return '🎵';
    case 'movie': return '🎬';
    case 'book': return '📚';
    default: return '✨';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'music': return 'Music';
    case 'movie': return 'Movie';
    case 'book': return 'Book';
    default: return type || 'Unknown';
  }
};

export default function ArchiveReport() {
  const [reportData, setReportData] = useState({ topArtists: [], topGenres: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      const data = await fetchTasteAnalysis();
      setReportData(data);
      setIsLoading(false);
    };
    
    loadReport();
  }, []);

  const { topArtists, topGenres } = reportData;
  const openRightSidebar = useSidebarStore(state => state.openRightSidebar);

  const handleItemClick = (itemData) => {
    // 가상의 앨범 데이터 생성
    const mockAlbum = {
      _viewType: 'album',
      id: 'report-virtual-' + itemData.name, // 임시 ID
      albumTitle: itemData.name,
      category: itemData.type,
      itemIds: itemData.items || [], // 백엔드에서 받은 아이템 ID 목록
    };
    openRightSidebar(mockAlbum);
  };

  return (
    <div className="archive-report-container">
      <h2 className="archive-report-title hover-trigger">
        <AnimatedText text="Taste Analysis Report" />
      </h2>
      
      {isLoading ? (
        <div className="archive-report-loading">
          <p>분석 중입니다...</p>
        </div>
      ) : (!topArtists || topArtists.length === 0) && (!topGenres || topGenres.length === 0) ? (
        <p className="archive-report-empty">아직 아카이빙된 아이템이 없습니다. 콘텐츠를 추가해보세요!</p>
      ) : (
        <div className="archive-report-grid">
          {/* Top Artists */}
          <div className="archive-report-card glass-panel">
            <h3 className="archive-report-card-title">
              🎤 Top Artists & Directors
            </h3>
            <ul className="archive-report-list">
              {topArtists.length > 0 ? topArtists.map((artist, idx) => (
                <li 
                  key={artist.name} 
                  className="archive-report-list-item hover-scale clickable"
                  onClick={() => handleItemClick(artist)}
                >
                  <div className="archive-report-item-left">
                    <span className="archive-report-item-index">{idx + 1}</span>
                    <div className="archive-report-item-details">
                      <span className="archive-report-item-name">{artist.name}</span>
                      <span className={`archive-report-item-type type-${artist.type}`}>
                        {getTypeIcon(artist.type)} {getTypeLabel(artist.type)}
                      </span>
                    </div>
                  </div>
                  <span className="archive-report-item-count">
                    {artist.count} items
                  </span>
                </li>
              )) : (
                <li className="archive-report-empty">데이터가 부족합니다.</li>
              )}
            </ul>
          </div>

          {/* Top Genres */}
          <div className="archive-report-card glass-panel">
            <h3 className="archive-report-card-title">
              🎧 Top Genres
            </h3>
            <ul className="archive-report-list">
              {topGenres.length > 0 ? topGenres.map((genre, idx) => (
                <li 
                  key={genre.name} 
                  className="archive-report-list-item hover-scale clickable"
                  onClick={() => handleItemClick(genre)}
                >
                  <div className="archive-report-item-left">
                    <span className="archive-report-item-index">{idx + 1}</span>
                    <div className="archive-report-item-details">
                      <span className="archive-report-item-name capitalize">{genre.name}</span>
                      <span className={`archive-report-item-type type-${genre.type}`}>
                        {getTypeIcon(genre.type)} {getTypeLabel(genre.type)}
                      </span>
                    </div>
                  </div>
                  <span className="archive-report-item-count">
                    {genre.count} items
                  </span>
                </li>
              )) : (
                <li className="archive-report-empty">데이터가 부족합니다.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
