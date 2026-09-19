import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Send, Copy, Loader2, Heart, Share2 } from 'lucide-react';
import { useCustomArchiveStore } from '../../../store/custom/useCustomArchiveStore';
import { fetchPublicAlbumById, cloneAlbum, toggleAlbumLike } from '../../../api/customArchiveApi';
import './CustomDetailPage.css';

export default function CustomDetailPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { getAlbumById, fetchCommentsForAlbum, addComment, removeComment } = useCustomArchiveStore();
  const [searchParams] = useSearchParams();
  const isPublicView = searchParams.get('public') === 'true';

  const [album, setAlbum] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (isPublicView) {
        try {
          const publicData = await fetchPublicAlbumById(albumId);
          setAlbum(publicData);
          const c = await fetchCommentsForAlbum(albumId);
          setComments(c || []);
        } catch (e) {
          console.error("Public 앨범 불러오기 실패", e);
        }
      } else {
        const data = await getAlbumById(albumId);
        if (data) {
          setAlbum(data);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [albumId, getAlbumById, fetchCommentsForAlbum, isPublicView]);

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

  const handleClone = async () => {
    if (!window.confirm(`'${album.title}' 앨범을 내 아카이브로 가져오시겠습니까?`)) return;
    setIsCloning(true);
    try {
      const cloned = await cloneAlbum(album.id);
      alert("성공적으로 복제되었습니다!");
      navigate(`/archive/custom/${cloned.id}`);
    } catch (error) {
      alert("복제 중 오류가 발생했습니다.");
    } finally {
      setIsCloning(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      const { likesCount, isLiked } = await toggleAlbumLike(album.id);
      setAlbum({ ...album, likesCount, isLiked });
    } catch (error) {
      alert("좋아요 처리에 실패했습니다.");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("링크가 클립보드에 복사되었습니다!");
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
              <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back
              </button>
              
              {!isPublicView && (
                <Link to={`/archive/custom/${albumId}/edit`} className="edit-btn">
                  <Edit3 size={16} /> Edit Curation
                </Link>
              )}
              {isPublicView && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="edit-btn" onClick={handleToggleLike} style={{ backgroundColor: album.isLiked ? '#ec4899' : 'var(--glass-bg)', color: album.isLiked ? 'white' : 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                    <Heart size={16} fill={album.isLiked ? 'white' : 'none'} />
                    {album.likesCount || 0}
                  </button>
                  <button className="edit-btn" onClick={handleShare} style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                    <Share2 size={16} /> Share
                  </button>
                  <button className="edit-btn" onClick={handleClone} disabled={isCloning} style={{ backgroundColor: 'var(--accent-color, #8b5cf6)', color: 'white' }}>
                    {isCloning ? <Loader2 size={16} className="sr-spinner" /> : <Copy size={16} />} 
                    {isCloning ? 'Cloning...' : '내 아카이브로 가져오기'}
                  </button>
                </div>
              )}
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
          {/* Curator Info */}
          {isPublicView && album.ownerUsername && (
            <div className="detail-author-info" onClick={() => console.log('Navigate to profile:', album.ownerUsername)} title={`${album.ownerUsername}님의 프로필 보기`}>
              <div className="detail-author-avatar">
                {album.ownerUsername.charAt(0).toUpperCase()}
              </div>
              <span className="detail-author-name">Curated by <b>@{album.ownerUsername}</b></span>
            </div>
          )}

          {/* Curator's Note or Global Impression */}
          {metaItem.impression && (
            <div className="author-impression">
              <h3 className="section-subtitle">Curator's Note</h3>
              <p>{metaItem.impression}</p>
            </div>
          )}

          {isPublicView && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
