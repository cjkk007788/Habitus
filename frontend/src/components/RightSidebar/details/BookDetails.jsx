import React from 'react';
import { BookOpen } from 'lucide-react';

export default function BookDetails({ item }) {
  const previewLink = item.previewUrl || item.mediaMeta?.previewLink;
  const pageCount = item.mediaMeta?.pageCount;
  const publisher = item.mediaMeta?.publisher;

  return (
    <>
      <div className="rs-media-container" style={{ margin: '20px 0' }}>
        {item.image_url || item.coverImages?.[0] ? (
          <img
            src={item.image_url || item.coverImages?.[0]}
            alt={item.title}
            className="rs-cover-image"
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: '300px', 
              objectFit: 'contain', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)' 
            }}
          />
        ) : (
          <div className="rs-cover-placeholder">📚</div>
        )}
      </div>

      <div className="rs-context-area">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {publisher && (
            <span style={{ padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              🏢 {publisher}
            </span>
          )}
          {pageCount && (
            <span style={{ padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              📄 {pageCount} Pages
            </span>
          )}
        </div>

        <p className="rs-synopsis" style={{ lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {item.mediaMeta?.overview || item.review || 'No overview available for this book.'}
        </p>

        {previewLink && (
          <a
            href={previewLink}
            target="_blank"
            rel="noreferrer"
            className="rs-link-box-full rs-link-default"
            style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', backgroundColor: 'var(--accent-color, #1a73e8)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}
          >
            <BookOpen size={18} style={{ marginRight: '8px' }} />
            <span>View Book Details & Reviews</span>
          </a>
        )}
      </div>
    </>
  );
}
