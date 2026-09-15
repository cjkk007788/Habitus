import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Settings, Trash2 } from 'lucide-react';
import { useCustomArchiveStore } from '../../../store/custom/useCustomArchiveStore';
import CustomCarouselNav from './components/Display/CustomCarouselNav';
import CustomImageCarousel from './components/Display/CustomImageCarousel';
import CustomPinCard from './components/Display/CustomPinCard';
import HashtagInput from './components/Form/HashtagInput';
import StarRating from './components/Form/StarRating';
import ImageUrlInput from './components/Form/ImageUrlInput';
import LayoutPresetSelector from './components/Form/LayoutPresetSelector';
import LinksInput from './components/Form/LinksInput';
import './CustomCreatePage.css';

const CATEGORY_OPTIONS = [
  { value: 'custom', label: 'Custom' },
  { value: 'music', label: 'Music' },
  { value: 'movie', label: 'Movie' },
  { value: 'book', label: 'Book' },
  { value: 'place', label: 'Place' },
  { value: 'food', label: 'Food' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'moment', label: 'Moment' },
  { value: 'quote', label: 'Quote' },
];

export default function CustomCreatePage() {
  const navigate = useNavigate();
  const createCustomAlbum = useCustomArchiveStore(state => state.createCustomAlbum);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 멀티 탭 에디터 상태
  const [items, setItems] = useState([
    {
      id: Date.now(),
      title: '',
      category: 'custom',
      imageUrls: [],
      rating: 0,
      hashtags: [],
      links: [],
      impression: '',
      description: ''
    }
  ]);

  const [currentUrlInput, setCurrentUrlInput] = useState('');

  const [albumMeta, setAlbumMeta] = useState({
    title: '',
    category: 'custom',
    coverImageUrl: '',
    additionalImages: [],
    pinLayout: 'classic'
  });

  const [activeTab, setActiveTab] = useState(0); // 숫자면 items 배열의 인덱스, 'album'이면 앨범 메타
  const [activeImageIdx, setActiveImageIdx] = useState(0);

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
      description: ''
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
    if (activeTab === index) setActiveTab(0);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!albumMeta.title.trim()) {
      alert("Album Settings 탭에서 앨범 제목을 입력해주세요.");
      setActiveTab('album');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // API payload 구조화 (스토어 함수가 요구하는 형태로 변환)
      const payload = {
        title: albumMeta.title,
        category: albumMeta.category,
        coverImageUrl: albumMeta.coverImageUrl,
        additionalImages: albumMeta.additionalImages,
        pinLayout: albumMeta.pinLayout,
        additionalItems: items.map(it => ({
          title: it.title,
          category: it.category,
          imageUrl: it.imageUrls?.[0] || '',
          additionalImages: it.imageUrls?.slice(1) || [],
          rating: it.rating,
          hashtags: it.hashtags,
          links: it.links,
          impression: it.impression,
          description: it.description
        }))
      };
      
      await createCustomAlbum(payload);
      navigate('/archive/custom');
    } catch (error) {
      alert("Failed to create album.");
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

  return (
    <div className="custom-create-page">
      <div className="create-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="create-title">Create Custom Album</h1>
        <button 
          className="submit-btn" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : (
            <>
              <Save size={18} />
              <span>Save Complete Album</span>
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

      <div className="create-content">
        {/* 중앙 에디터 (아이템 모드) */}
        {activeTab !== 'album' && (
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
                  <div style={{ display: 'flex', gap: '8px' }}>
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
            </div>

            <div className="create-preview-section">
              <div className="preview-sticky-container">
                <h3 className="preview-label">Live Pin Preview</h3>
                <div className="preview-card-wrapper">
                  <CustomPinCard album={previewAlbum} onClick={() => {}} />
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
