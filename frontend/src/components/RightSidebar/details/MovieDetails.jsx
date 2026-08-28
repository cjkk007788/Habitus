import React, { useState, useEffect } from 'react';
import { MonitorPlay, ExternalLink } from 'lucide-react';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';

export default function MovieDetails({ item }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCastExpanded, setIsCastExpanded] = useState(false);
  const updateActiveSidebarItem = useSidebarStore(state => state.updateActiveSidebarItem);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${baseUrl}/genres/movie/${item.id}/details`);
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
          updateActiveSidebarItem({ movieDetail: data });
        }
      } catch (err) {
        console.error("Failed to fetch movie details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (item?.id) {
      fetchDetails();
    }
  }, [item?.id]);

  // Extract roles
  let directors = [];
  let fullCast = [];
  let fullStaff = [];

  if (details?.credits) {
    const crew = details.credits.crew || [];
    directors = crew.filter(c => c.job === 'Director').map(c => c.name);
    
    // Staff: exclude directors, map to "Name (as Job)"
    fullStaff = crew
      .filter(c => c.job !== 'Director')
      .map(c => `${c.name} (as ${c.job})`);

    const cast = details.credits.cast || [];
    fullCast = cast.map(c => c.character ? `${c.name} (as ${c.character})` : c.name);
  }

  const castLimit = 3;
  const staffLimit = 3;
  
  const hasMoreCast = fullCast.length > castLimit;
  const displayedCast = isCastExpanded ? fullCast : fullCast.slice(0, castLimit);

  const hasMoreStaff = fullStaff.length > staffLimit;
  const displayedStaff = isCastExpanded ? fullStaff : fullStaff.slice(0, staffLimit);
  return (
    <>
      <div className="rs-media-container">
        {item.coverImages?.[0] || item.image_url ? (
          <img
            src={item.coverImages?.[0] || item.image_url}
            alt={item.title}
            className="rs-cover-image"
          />
        ) : (
          <div className="rs-cover-placeholder">🎬</div>
        )}
      </div>

      <div className="rs-context-area">
        {/* TMDB Metadata */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {item.mediaMeta?.releaseYear && item.mediaMeta.releaseYear !== 'Unknown' && (
            <span>📅 {item.mediaMeta.releaseYear}</span>
          )}
          {item.mediaMeta?.vote_average && item.mediaMeta.vote_average > 0 && (
            <span>⭐ {item.mediaMeta.vote_average.toFixed(1)} / 10</span>
          )}
        </div>

        <p className="rs-synopsis">
          {item.review || item.mediaMeta?.overview || 'No synopsis provided for this movie.'}
        </p>

        {/* Dynamic Credits from TMDB */}
        {/* Dynamic Credits from TMDB */}
        {(directors.length > 0 || fullCast.length > 0 || fullStaff.length > 0) && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* 1. Directors */}
            {directors.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-secondary)', marginRight: '8px', display: 'block', marginBottom: '4px' }}>Director</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{directors.join(', ')}</span>
              </div>
            )}

            {/* 2. Actors */}
            {fullCast.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-secondary)', marginRight: '8px', display: 'block', marginBottom: '4px' }}>Actor</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {displayedCast.join(', ')}
                  {!isCastExpanded && hasMoreCast && '...'}
                </span>
              </div>
            )}

            {/* 3. Staff */}
            {fullStaff.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-secondary)', marginRight: '8px', display: 'block', marginBottom: '4px' }}>Staff</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {displayedStaff.join(', ')}
                  {!isCastExpanded && hasMoreStaff && '...'}
                </span>
              </div>
            )}

            {/* Global Toggle Button for Cast & Staff */}
            {(hasMoreCast || hasMoreStaff) && (
              <div style={{ marginTop: '4px', textAlign: 'right' }}>
                <button 
                  onClick={() => setIsCastExpanded(!isCastExpanded)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--accent-color)', 
                    fontSize: '0.85rem', 
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: 'bold'
                  }}
                >
                  {isCastExpanded ? 'Fold' : 'Show All'}
                </button>
              </div>
            )}
          </div>
        )}
        {isLoading && (
          <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Loading credits...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {details?.homepage && (
            <a
              href={details.homepage}
              target="_blank"
              rel="noreferrer"
              className="rs-link-box-full rs-link-default"
              style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-primary)', border: 'none' }}
            >
              <ExternalLink size={18} />
              <span>Official Homepage</span>
            </a>
          )}
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' movie trailer')}`}
            target="_blank"
            rel="noreferrer"
            className="rs-link-box-full rs-link-youtube"
          >
            <MonitorPlay size={18} />
            <span>Search on YouTube</span>
          </a>
          <a
            href={`https://www.themoviedb.org/movie/${item.id}`}
            target="_blank"
            rel="noreferrer"
            className="rs-link-box-full rs-link-default"
            style={{ backgroundColor: '#032541', color: 'white', border: 'none' }}
          >
            <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '6px' }}>TMDB</span>
            <span>View Movie Details & Reviews</span>
          </a>
        </div>
      </div>
    </>
  );
}
