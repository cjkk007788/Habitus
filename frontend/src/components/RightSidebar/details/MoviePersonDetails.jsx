import React, { useState, useEffect, useRef } from 'react';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import VinylCover from '../../visual/VinylCover/VinylCover';

export default function MoviePersonDetails({ item }) {
  const [personDetail, setPersonDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const updateActiveSidebarItem = useSidebarStore(state => state.updateActiveSidebarItem);

  const detailTimerRef = useRef(null);

  useEffect(() => {
    setPersonDetail(null);
    if (item.itemType !== 'movie_person') return;

    // Search 결과 객체는 external_id에 tmdb_id를 가지고 있음
    const personId = item.external_id || item.mbid || item.id;
    if (!personId) return;

    if (detailTimerRef.current) clearTimeout(detailTimerRef.current);

    detailTimerRef.current = setTimeout(async () => {
      setIsDetailLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${baseUrl}/search/details?mbid=${personId}&category=movie_person`);
        if (res.ok) {
          const data = await res.json();
          setPersonDetail(data.data?.tmdb || null);
          if (data.data?.tmdb) {
            updateActiveSidebarItem({ personDetail: data.data.tmdb });
          }
        }
      } catch (err) {
        console.error("Failed to fetch person details", err);
      }
      setIsDetailLoading(false);
    }, 500);

    return () => clearTimeout(detailTimerRef.current);
  }, [item?.id, item?.external_id, item?.mbid, item?.itemType]);

  return (
    <>
      <div className="rs-media-container" style={{ marginBottom: '16px' }}>
        {(item.coverImages?.[0] || item.cover_image_url || item.image_url) ? (
          <VinylCover imageUrl={item.coverImages?.[0] || item.cover_image_url || item.image_url} isPlaying={false} />
        ) : (
          <div className="rs-cover-placeholder">👤</div>
        )}
      </div>

      <div className="rs-context-area">
        {item.subtitle && (
          <p className="rs-item-creator" style={{ marginBottom: '12px' }}>{item.subtitle}</p>
        )}

        {isDetailLoading && <p className="rs-loading-text" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>⏳ Loading person info...</p>}

        {personDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {personDetail.place_of_birth && <span>📍 {personDetail.place_of_birth}</span>}
              {personDetail.birthday && <span>🎂 {personDetail.birthday}</span>}
              {personDetail.deathday && <span>✝️ {personDetail.deathday}</span>}
            </div>

            {personDetail.biography && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {personDetail.biography.length > 500 ? personDetail.biography.substring(0, 500) + '...' : personDetail.biography}
              </p>
            )}

            {/* Known For / Movie Credits */}
            {personDetail.movie_credits && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.9rem' }}>Known For</h4>
                <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
                  {(() => {
                    // 감독이면 연출작을, 배우면 출연작을 우선 보여줌
                    const credits = personDetail.known_for_department === 'Directing' 
                      ? personDetail.movie_credits.crew.filter(c => c.job === 'Director')
                      : personDetail.movie_credits.cast;
                      
                    return credits
                      .sort((a, b) => b.popularity - a.popularity)
                      .slice(0, 10)
                      .map((credit, idx) => (
                        <div key={idx} style={{ flex: '0 0 80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {credit.poster_path ? (
                            <img src={credit.poster_path} alt={credit.title} style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div style={{ width: '80px', height: '120px', backgroundColor: '#333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', textAlign: 'center', padding: '4px' }}>{credit.title}</div>
                          )}
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {credit.title}
                          </span>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
