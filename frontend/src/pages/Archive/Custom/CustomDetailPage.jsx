import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Send } from 'lucide-react';
import { useCustomArchiveStore } from '../../../store/custom/useCustomArchiveStore';
import './CustomDetailPage.css';

export default function CustomDetailPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { getAlbumById, fetchCommentsForAlbum, addComment, removeComment } = useCustomArchiveStore();
  
  const [album, setAlbum] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getAlbumById(albumId);
      if (data) {
        setAlbum(data);
        const c = await fetchCommentsForAlbum(albumId);
        setComments(c || []);
      }
      setIsLoading(false);
    }
    loadData();
  }, [albumId, getAlbumById, fetchCommentsForAlbum]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const added = await addComment(albumId, newComment);
      setComments([...comments, added]);
      setNewComment('');
      setTimeout(() => {
        const list = document.querySelector('.comments-list');
        if (list) list.scrollTop = list.scrollHeight;
      }, 100);
    } catch (error) {
      alert("Failed to add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await removeComment(albumId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      alert("Failed to delete comment.");
    }
  };

  if (isLoading) {
    return (
      <div className="custom-detail-page">
        <div className="loading-container">
          <div className="spinner">⌛</div>
          <p>Loading Curation...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="custom-detail-page">
        <div className="loading-container">
          <h2>Album not found</h2>
          <button className="back-btn" onClick={() => navigate('/archive/custom')} style={{ marginTop: '16px' }}>
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasMetaItem = album.items?.some(i => i.userMeta?.is_meta_item);
  const metaItem = hasMetaItem ? album.items.find(i => i.userMeta?.is_meta_item) : {};
  const displayItems = hasMetaItem ? album.items.filter(i => i.id !== metaItem.id) : (album.items || []);
  
  // Extract all images for the top cover section
  const allImages = [];
  if (metaItem.coverImageUrl) allImages.push(metaItem.coverImageUrl);
  if (metaItem.mediaMeta?.images) allImages.push(...metaItem.mediaMeta.images);
  if (!hasMetaItem && displayItems.length > 0) {
    // For Digging albums without a meta item, use the first item's cover image as the album cover
    if (displayItems[0].coverImageUrl) allImages.push(displayItems[0].coverImageUrl);
  }
  
  // We'll show all images related to the metaItem or displayItems.
  // The user said: "맨위에 앨범 커버이미지들, 그 아래 아이템별로 하나씩"
  const coverImages = [...new Set(allImages.filter(Boolean))];
  const hashtags = metaItem?.genres || [];

  return (
    <div className="custom-detail-page">
      <div className="detail-layout">
        
        {/* Main Content */}
        <div className="main-content">
          
          <div className="album-header-section">
            <div className="top-bar">
              <button className="back-btn" onClick={() => navigate('/archive/custom')}>
                <ArrowLeft size={18} /> Back
              </button>
              <Link to={`/archive/custom/${albumId}/edit`} className="edit-btn">
                <Edit3 size={16} /> Edit Curation
              </Link>
            </div>
            
            <div className="album-title-area">
              <h1>{album.title}</h1>
              {hashtags.length > 0 && (
                <div className="album-tags">
                  {hashtags.map((tag, idx) => (
                    <span key={idx} className="album-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Album Cover Images grouped at the top */}
            {coverImages.length > 0 && (
              <div className="covers-gallery">
                {coverImages.map((img, idx) => (
                  <img key={idx} src={img} alt={`Cover ${idx}`} className="cover-image" />
                ))}
              </div>
            )}

            {/* Curation General Description */}
            {metaItem.description && (
              <p className="item-desc" style={{ fontSize: '1.1rem', marginBottom: '40px' }}>
                {metaItem.description}
              </p>
            )}
          </div>

          {/* Items listed one by one */}
          {displayItems.length > 0 && (
            <div className="items-list">
              {displayItems.map((item, index) => (
                <div key={item.id} className="item-row">
                  {item.coverImageUrl && (
                    <div className="item-image-wrapper">
                      <img src={item.coverImageUrl} alt={item.title} className="item-main-img" />
                    </div>
                  )}
                  
                  <div className="item-details">
                    <h2 className="item-title">{item.title}</h2>
                    {item.impression && (
                      <div className="item-impression">"{item.impression}"</div>
                    )}
                    {item.description && (
                      <div className="item-desc">{item.description}</div>
                    )}
                    {item.links && item.links.length > 0 && (
                      <div className="item-links">
                        {item.links.map((linkObj, idx) => {
                          const urlStr = typeof linkObj === 'string' ? linkObj : linkObj.url;
                          if (!urlStr) return null;
                          let displayLink = urlStr;
                          try { displayLink = new URL(urlStr).hostname; } catch(e) {}
                          return (
                            <a key={idx} href={urlStr} target="_blank" rel="noopener noreferrer" className="item-link">
                              🔗 {displayLink}
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Sticky Comments */}
        <div className="comments-sidebar">
          <div className="comments-header">
            댓글 {comments.length > 0 ? `${comments.length}개` : ''}
          </div>
          
          <div className="comments-list">
            {comments.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                No comments yet.
              </p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {(comment.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="comment-content-wrapper">
                    <span className="comment-author">{comment.username || 'Curator'}</span>
                    <span className="comment-text">{comment.content}</span>
                  </div>
                  <button 
                    className="comment-delete-btn" 
                    onClick={() => handleDeleteComment(comment.id)} 
                    title="Delete comment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <form className="comment-input-box" onSubmit={handleAddComment}>
            <div className="comment-input-wrapper">
              <input 
                type="text"
                className="comment-input" 
                placeholder="댓글 추가"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="comment-submit-btn" disabled={isSubmitting || !newComment.trim()}>
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
