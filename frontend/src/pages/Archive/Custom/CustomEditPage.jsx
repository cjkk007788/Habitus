import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Settings, Trash2, Loader2 } from 'lucide-react';
import { useCustomArchiveStore } from '../../../store/custom/useCustomArchiveStore';
import CustomCarouselNav from './components/Display/CustomCarouselNav';
import CustomImageCarousel from './components/Display/CustomImageCarousel';
import CustomPinCard from './components/Display/CustomPinCard';
import HashtagInput from './components/Form/HashtagInput';
import StarRating from './components/Form/StarRating';
import ImageUrlInput from './components/Form/ImageUrlInput';
import LayoutPresetSelector from './components/Form/LayoutPresetSelector';
import LinksInput from './components/Form/LinksInput';
import SearchResultSection from '../../../components/digging/SearchResults/SearchResultSection';
import useSearchStore from '../../../store/search/useSearchStore';
import './CustomCreatePage.css';

const CATEGORY_OPTIONS = [
  { value: 'music', label: '🎵 Music' },
  { value: 'movie', label: '🎬 Movie' },
  { value: 'book', label: '📚 Book' },
];

export default function CustomEditPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { getAlbumById, updateCustomAlbum } = useCustomArchiveStore();
  const { clearSearch } = useSearchStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 멀티 탭 에디터 상태
  const [items, setItems] = useState([]);
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [albumMeta, setAlbumMeta] = useState({
    title: '',
    category: 'music',
    coverImageUrl: '',
    additionalImages: [],
    pinLayout: 'classic',
    is_public: false
  });

  const [activeTab, setActiveTab] = useState('album');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    async function fetchAlbumData() {
      setIsLoading(true);
      const data = await getAlbumById(albumId);
      if (data) {
        // Extract meta item
        const hasMetaItem = data.items?.some(i => i.userMeta?.is_meta_item);
        const metaItem = hasMetaItem ? data.items.find(i => i.userMeta?.is_meta_item) : {};
        const otherItems = hasMetaItem ? data.items.filter(i => i.id !== metaItem.id) : (data.items || []);

        setAlbumMeta({
          title: data.title || '',
          category: (['music', 'movie', 'book'].includes(data.category) ? data.category : 'music'),
          coverImageUrl: metaItem.coverImageUrl || '',
          additionalImages: metaItem.mediaMeta?.images || [],
          pinLayout: metaItem.userMeta?.pin_layout || 'classic',
          is_public: data.is_public || false
        });

        if (otherItems.length > 0) {
          setItems(otherItems.map(it => {
            const meta = it.mediaMeta || {};
            const artistsArr = Array.isArray(meta.artists) ? meta.artists : [];
            const relatedArr = Array.isArray(meta.related_artists) ? meta.related_artists : [];
            const contributors = Array.isArray(meta.contributors) ? meta.contributors : [];

            return {
              id: it.id,
              title: it.title || '',
              category: (['music', 'movie', 'book'].includes(it.itemType) ? it.itemType : 'music'),
              imageUrls: [it.coverImageUrl, ...(it.mediaMeta?.images || [])].filter(Boolean),
              rating: it.rating || 0,
              hashtags: it.genres || [],
              links: it.links || [],
              impression: it.impression || '',
              description: it.description || '',
              releaseYear: meta.releaseYear || '',
              artists: artistsArr.join(', '),
              director: contributors.find(c => c.role === 'director')?.name || '',
              author: contributors.find(c => c.role === 'author')?.name || '',
              relatedArtists: relatedArr
            };
          }));
        } else {
          // if only meta item, we still need at least 1 item to edit
          const meta = metaItem.mediaMeta || {};
          const artistsArr = Array.isArray(meta.artists) ? meta.artists : [];
          const relatedArr = Array.isArray(meta.related_artists) ? meta.related_artists : [];
          const contributors = Array.isArray(meta.contributors) ? meta.contributors : [];

          setItems([{
            id: Date.now(),
            title: metaItem.title || '',
            category: (['music', 'movie', 'book'].includes(metaItem.itemType) ? metaItem.itemType : 'music'),
            imageUrls: [metaItem.coverImageUrl, ...(metaItem.mediaMeta?.images || [])].filter(Boolean),
            rating: metaItem.rating || 0,
            hashtags: metaItem.genres || [],
            links: metaItem.links || [],
            impression: metaItem.impression || '',
            description: metaItem.description || '',
            releaseYear: meta.releaseYear || '',
            artists: artistsArr.join(', '),
            director: contributors.find(c => c.role === 'director')?.name || '',
            author: contributors.find(c => c.role === 'author')?.name || '',
            relatedArtists: relatedArr
          }]);
        }
      } else {
        alert('Album not found');
        navigate('/archive/custom');
      }
      setIsLoading(false);
    }
    fetchAlbumData();
  }, [albumId, getAlbumById, navigate]);

  useEffect(() => {
    setActiveImageIdx(0);
    setCurrentUrlInput('');
  }, [activeTab]);

  // --- 아이템 핸들러 ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      title: '',
      category: 'custom',
      imageUrls: [],
      rating: 0,
      hashtags: [],
      links: [],
      impression: '',
      description: '',
      releaseYear: '',
      artists: '',
      director: '',
      author: '',
      relatedArtists: []
    };
    setItems([...items, newItem]);
    setActiveTab(items.length); // 방금 추가한 아이템 탭으로 이동
    setCurrentUrlInput('');
  };

  const handleRemoveItem = (index, e) => {
    e.stopPropagation();
    if (items.length === 1) {
      alert("최소 한 개의 아이템은 있어야 합니다.");
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (activeTab === index) setActiveTab('album');
    else if (activeTab > index && activeTab !== 'album') setActiveTab(activeTab - 1);
  };

  const handleAddImageUrl = (e) => {
    if (e) e.preventDefault();
    if (!currentUrlInput.trim()) return;

    const newItems = [...items];
    const currentUrls = newItems[activeTab].imageUrls || [];
    newItems[activeTab] = { ...newItems[activeTab], imageUrls: [...currentUrls, currentUrlInput.trim()] };
    setItems(newItems);
    setCurrentUrlInput('');
  };

  const handleRemoveImageUrl = (urlIndex) => {
    const newItems = [...items];
    const currentUrls = newItems[activeTab].imageUrls || [];
    newItems[activeTab] = {
      ...newItems[activeTab],
      imageUrls: currentUrls.filter((_, i) => i !== urlIndex)
    };
    setItems(newItems);
    if (activeImageIdx >= newItems[activeTab].imageUrls.length) {
      setActiveImageIdx(Math.max(0, newItems[activeTab].imageUrls.length - 1));
    }
  };

  // --- 앨범 메타 핸들러 ---
  const handleMetaChange = (field, value) => {
    setAlbumMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleMetaImageChange = (cover, additional) => {
    setAlbumMeta(prev => ({ ...prev, coverImageUrl: cover, additionalImages: additional }));
  };

  const handleAutoFill = (itemData) => {
    const newItems = [...items];
    if (activeTab === 'album') setActiveTab(0);
    const idx = activeTab === 'album' ? 0 : activeTab;

    const meta = itemData.mediaMeta || {};
    const artistsArr = Array.isArray(itemData.artists) ? itemData.artists : [];
    const relatedArr = []; // 관련 아티스트는 검색 결과에서 빈 배열로 초기화
    const contributors = Array.isArray(meta.contributors) ? meta.contributors : [];

    let cat = 'music';
    if (itemData.itemType?.includes('movie')) cat = 'movie';
    if (itemData.itemType?.includes('book')) cat = 'book';

    newItems[idx] = {
      ...newItems[idx],
      title: itemData.title || newItems[idx].title,
      category: cat,
      imageUrls: [itemData.image_url, ...(meta.images || [])].filter(Boolean),
      hashtags: itemData.genres || [],
      releaseYear: meta.releaseYear || '',
      artists: artistsArr.join(', '),
      director: cat === 'movie' ? (contributors[0]?.name || '') : '',
      author: cat === 'book' ? (contributors[0]?.name || '') : '',
      relatedArtists: relatedArr,
      description: meta.overview || newItems[idx].description, // 영화 줄거리 등 추가
    };

    setItems(newItems);
    clearSearch();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!albumMeta.title.trim()) {
      alert("Album Settings 탭에서 앨범 제목을 입력해주세요.");
      setActiveTab('album');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: albumMeta.title,
        category: albumMeta.category,
        is_public: albumMeta.is_public || false,
        coverImageUrl: albumMeta.coverImageUrl || items[0]?.imageUrls?.[0] || '',
        additionalImages: albumMeta.additionalImages,
        pinLayout: albumMeta.pinLayout,
        rating: items[0]?.rating || 0,
        hashtags: items[0]?.hashtags || [],
        links: items[0]?.links || [],
        impression: items[0]?.impression || '',
        description: items[0]?.description || '',
        releaseYear: items[0]?.releaseYear || '',
        artists: items[0]?.artists || '',
        director: items[0]?.director || '',
        author: items[0]?.author || '',
        relatedArtists: items[0]?.relatedArtists || '',
        additionalItems: items.map(it => ({
          id: typeof it.id === 'string' ? it.id : undefined, // Keep id if it's existing UUID, ignore if timestamp
          title: it.title,
          category: it.category,
          imageUrl: it.imageUrls?.[0] || '',
          additionalImages: it.imageUrls?.slice(1) || [],
          rating: it.rating,
          hashtags: it.hashtags,
          links: it.links,
          impression: it.impression,
          description: it.description,
          releaseYear: it.releaseYear,
          artists: it.artists,
          director: it.director,
          author: it.author,
          relatedArtists: it.relatedArtists
        }))
      };

      await updateCustomAlbum(albumId, payload);
      navigate(`/archive/custom/${albumId}`);
    } catch (error) {
      alert("Failed to update album.");
      setIsSubmitting(false);
    }
  };

  // 실시간 프리뷰를 위한 가상 앨범 객체 생성 (앨범 메타 탭용)
  const previewAlbum = {
    id: 'preview',
    title: albumMeta.title || 'Untitled',
    category: albumMeta.category,
    items: [
      {
        userMeta: {
          is_meta_item: true,
          pin_layout: albumMeta.pinLayout,
        },
        title: albumMeta.title,
        coverImageUrl: albumMeta.coverImageUrl || (items[0] && items[0].imageUrls?.[0]) || '',
        genres: items[0] ? items[0].hashtags : [],
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="custom-create-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner" size={40} />
      </div>
    );
  }

  return (
    <div className="custom-create-page">
      <div className="create-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="create-title">Edit Custom Album</h1>
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (
            <>
              <Save size={18} />
              <span>Update Album</span>
            </>
          )}
        </button>
      </div>

      {/* 상단 네비게이션 영역: 좌측(캐러셀) / 우측(앨범 설정) */}
      <div className="top-nav-area">
        <CustomCarouselNav
          items={items}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
        />

        <div className="top-nav-right">
          <div className="nav-divider" />
          <button
            className={`album-settings-trigger ${activeTab === 'album' ? 'active' : ''}`}
            onClick={() => setActiveTab('album')}
          >
            <div className="album-settings-icon">
              <Settings size={28} />
            </div>
            <div className="album-settings-info">
              <span className="album-settings-title">Album Settings</span>
              <span className="album-settings-subtitle">Finalize</span>
            </div>
          </button>
        </div>
      </div>

      <SearchResultSection onItemClick={handleAutoFill} />

      <div className="create-content">
        {/* 중앙 에디터 (아이템 모드) */}
        {activeTab !== 'album' && items[activeTab] && (
          <div className="create-form-section">
            <h2 className="section-title">Editing Item {activeTab + 1}</h2>

            <div className="item-editor-hero" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              {/* 왼쪽: 대형 이미지 캐러셀 프리뷰 */}
              <div className="item-cover-preview" style={{
                flex: '0 0 280px',
                width: '280px',
                height: '280px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <CustomImageCarousel
                  images={items[activeTab].imageUrls}
                  activeIndex={activeImageIdx}
                  setActiveIndex={setActiveImageIdx}
                  onRemove={handleRemoveImageUrl}
                  onImageClick={(url) => setCurrentUrlInput(url)}
                  onAddClick={() => {
                    setCurrentUrlInput('');
                    document.getElementById('image-url-input')?.focus();
                  }}
                />
              </div>

              {/* 오른쪽: 주요 입력 필드 (URL, Title, Category, Rating) */}
              <div className="item-hero-fields" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label>Image URLs</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      id="image-url-input"
                      type="url"
                      className="form-input"
                      placeholder="https://... (Press Enter or Add)"
                      value={currentUrlInput}
                      onChange={(e) => setCurrentUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddImageUrl(e); }}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                  {/* 추가된 이미지 URL 목록 표시 및 삭제 버튼 */}
                  {items[activeTab].imageUrls && items[activeTab].imageUrls.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {items[activeTab].imageUrls.map((url, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.8)', maxWidth: '200px' }}>
                            {url}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImageUrl(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '2px 4px' }}
                            title="Remove URL"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Item Title <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input text-lg"
                    placeholder="Enter item title"
                    value={items[activeTab].title}
                    onChange={(e) => handleItemChange(activeTab, 'title', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Item Category</label>
                    <select
                      className="form-select"
                      value={items[activeTab].category}
                      onChange={(e) => handleItemChange(activeTab, 'category', e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label>Item Rating</label>
                    <StarRating
                      rating={items[activeTab].rating}
                      onChange={(val) => handleItemChange(activeTab, 'rating', val)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 메타데이터 추가 입력창 (카테고리별 분기) */}
            {(items[activeTab].category === 'music' || items[activeTab].category === 'movie' || items[activeTab].category === 'book') && (
              <div className="form-row" style={{ marginTop: '20px' }}>
                {items[activeTab].category === 'music' && (
                  <>
                    <div className="form-group flex-1">
                      <label>Artist(s) <span className="field-hint">(Comma separated)</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. The Beatles, John Lennon"
                        value={items[activeTab].artists}
                        onChange={(e) => handleItemChange(activeTab, 'artists', e.target.value)}
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>Related Artists</label>
                      <HashtagInput
                        tags={items[activeTab].relatedArtists}
                        onChange={(tags) => handleItemChange(activeTab, 'relatedArtists', tags)}
                      />
                    </div>
                  </>
                )}

                {items[activeTab].category === 'movie' && (
                  <>
                    <div className="form-group flex-1">
                      <label>Director</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Christopher Nolan"
                        value={items[activeTab].director}
                        onChange={(e) => handleItemChange(activeTab, 'director', e.target.value)}
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>Related Actors / Artists</label>
                      <HashtagInput
                        tags={items[activeTab].relatedArtists}
                        onChange={(tags) => handleItemChange(activeTab, 'relatedArtists', tags)}
                      />
                    </div>
                  </>
                )}

                {items[activeTab].category === 'book' && (
                  <div className="form-group flex-1">
                    <label>Author</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. J.K. Rowling"
                      value={items[activeTab].author}
                      onChange={(e) => handleItemChange(activeTab, 'author', e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group flex-1">
                  <label>Release Year</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2024"
                    value={items[activeTab].releaseYear}
                    onChange={(e) => handleItemChange(activeTab, 'releaseYear', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Hashtags</label>
              <HashtagInput
                tags={items[activeTab].hashtags}
                onChange={(tags) => handleItemChange(activeTab, 'hashtags', tags)}
              />
            </div>

            <div className="form-group">
              <label>Content Links</label>
              <LinksInput
                links={items[activeTab].links}
                onChange={(links) => handleItemChange(activeTab, 'links', links)}
              />
            </div>

            <div className="form-group">
              <label>Short Review / Impression</label>
              <input
                type="text"
                className="form-input"
                placeholder="Write a short impression or subtitle"
                value={items[activeTab].impression}
                onChange={(e) => handleItemChange(activeTab, 'impression', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Detailed Review / Content</label>
              <textarea
                className="form-textarea"
                placeholder="Write a detailed review or content"
                rows={4}
                value={items[activeTab].description}
                onChange={(e) => handleItemChange(activeTab, 'description', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 중앙 에디터 (앨범 최종 설정 모드) */}
        {activeTab === 'album' && (
          <>
            <div className="create-form-section">
              <h2 className="section-title">Finalize Album Settings</h2>

              <div className="form-group">
                <label>Album Cover (Optional)</label>
                <ImageUrlInput
                  coverUrl={albumMeta.coverImageUrl}
                  additionalUrls={albumMeta.additionalImages}
                  onChange={handleMetaImageChange}
                />
                <p className="field-hint">If left empty, the first item's image will be used as the pin cover.</p>
              </div>

              <div className="form-group">
                <label>Album Title <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input text-lg"
                  placeholder="Enter overall album title"
                  value={albumMeta.title}
                  onChange={(e) => handleMetaChange('title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Album Main Category</label>
                <select
                  className="form-select"
                  value={albumMeta.category}
                  onChange={(e) => handleMetaChange('category', e.target.value)}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pin Design (Layout)</label>
                <LayoutPresetSelector
                  layout={albumMeta.pinLayout}
                  onChange={(layout) => handleMetaChange('pinLayout', layout)}
                />
              </div>

              {/* 커뮤니티 공개 토글 */}
              <div className="form-group">
                <label>Curation Share</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: albumMeta.is_public ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${albumMeta.is_public ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', transition: 'all 0.2s', cursor: 'pointer' }}
                  onClick={() => handleMetaChange('is_public', !albumMeta.is_public)}
                >
                  <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: albumMeta.is_public ? 'var(--accent-color, #8b5cf6)' : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '3px', left: albumMeta.is_public ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: albumMeta.is_public ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)' }}>
                      {albumMeta.is_public ? '커뮤니티에 공개됨' : '비공개 (나만 볼 수 있음)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                      공개 시 다른 사용자들이 검색하고 탐색할 수 있습니다
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="create-preview-section">
              <div className="preview-sticky-container">
                <h3 className="preview-label">Live Pin Preview</h3>
                <div className="preview-card-wrapper">
                  <CustomPinCard album={previewAlbum} onClick={() => { }} />
                </div>
                <p className="preview-hint">
                  Your album will appear like this on the pinboard based on the selected layout.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
