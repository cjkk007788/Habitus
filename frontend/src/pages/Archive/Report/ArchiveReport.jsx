import React, { useState, useEffect } from 'react';
import AnimatedText from '../../../components/common/AnimatedText/AnimatedText';
import { fetchTasteAnalysis } from '../../../api/reportApi';
import './ArchiveReport.css';

export default function ArchiveReport() {
  const [reportData, setReportData] = useState({ topArtists: [], topGenres: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      // user_id 파라미터는 지금 생략(null)하면 백엔드에서 첫 번째 유저를 사용합니다.
      const data = await fetchTasteAnalysis();
      setReportData(data);
      setIsLoading(false);
    };
    
    loadReport();
  }, []);

  const { topArtists, topGenres } = reportData;

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
          <div className="archive-report-card">
            <h3 className="archive-report-card-title">
              🎤 Top Artists & Directors
            </h3>
            <ul className="archive-report-list">
              {topArtists.length > 0 ? topArtists.map(([name, count], idx) => (
                <li key={name} className="archive-report-list-item">
                  <span className="archive-report-item-name">
                    <span className="archive-report-item-index">{idx + 1}</span>
                    {name}
                  </span>
                  <span className="archive-report-item-count">
                    {count} items
                  </span>
                </li>
              )) : (
                <li className="archive-report-empty">데이터가 부족합니다.</li>
              )}
            </ul>
          </div>

          {/* Top Genres */}
          <div className="archive-report-card">
            <h3 className="archive-report-card-title">
              🎧 Top Genres
            </h3>
            <ul className="archive-report-list">
              {topGenres.length > 0 ? topGenres.map(([name, count], idx) => (
                <li key={name} className="archive-report-list-item">
                  <span className="archive-report-item-name capitalize">
                    <span className="archive-report-item-index">{idx + 1}</span>
                    {name}
                  </span>
                  <span className="archive-report-item-count">
                    {count} items
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
