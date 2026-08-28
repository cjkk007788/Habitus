import React from 'react';
import { useArchiveStore } from '../../../store/archive';
import { Trash2 } from 'lucide-react';
import './MixStagingArea.css';

export default function MixStagingArea() {
  const {
    stagedMixBlocks,
    removeMixBlock,
    stagedAlbumTitle,
    setStagedAlbumTitle,
    stagedMixCoverImage,
    setStagedMixCoverImage,
    stagedMixDescription,
    setStagedMixDescription,
  } = useArchiveStore();

  // 믹스에 추가된 모든 아이템들의 커버 이미지(URL)를 중복 제거하여 추출
  const availableImages = React.useMemo(() => {
    const images = new Set();
    stagedMixBlocks.forEach(block => {
      if (block.items) {
        block.items.forEach(item => {
          if (Array.isArray(item.coverImages) && item.coverImages.length > 0) {
            images.add(item.coverImages[0]);
          } else if (item.image_url) {
            images.add(item.image_url);
          } else if (item.coverImage) {
            images.add(item.coverImage);
          }
        });
      }
    });
    return Array.from(images);
  }, [stagedMixBlocks]);

  return (
    <div className="mix-staging-container">
      {/* 믹스 기본 정보 입력 폼 */}
      <div className="rs-album-title-input-container">
        <input
          type="text"
          className="rs-album-title-input"
          placeholder="믹스 제목을 입력하세요..."
          value={stagedAlbumTitle}
          onChange={(e) => setStagedAlbumTitle(e.target.value)}
          style={{ marginBottom: '12px' }}
        />

        {/* 선택된 믹스 커버 이미지 미리보기 */}
        {stagedMixCoverImage && (
          <div style={{ marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img
              src={stagedMixCoverImage}
              alt="Mix Cover Preview"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        )}

        <input
          type="text"
          className="rs-album-title-input"
          placeholder="커버 이미지 URL 직접 입력..."
          value={stagedMixCoverImage}
          onChange={(e) => setStagedMixCoverImage(e.target.value)}
          style={{ fontSize: '0.9rem', marginBottom: '8px' }}
        />

        {/* 썸네일 선택기 */}
        {availableImages.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px' }}>
            {availableImages.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt="thumbnail suggestion"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: stagedMixCoverImage === imgUrl ? '2px solid #F2C94C' : '2px solid transparent',
                  opacity: stagedMixCoverImage === imgUrl ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onClick={() => setStagedMixCoverImage(imgUrl)}
                onMouseEnter={(e) => { e.target.style.opacity = 1; }}
                onMouseLeave={(e) => { if (stagedMixCoverImage !== imgUrl) e.target.style.opacity = 0.6; }}
                title="이 이미지를 커버로 사용"
              />
            ))}
          </div>
        )}

        <textarea
          className="rs-album-title-input"
          placeholder="믹스에 대한 설명을 적어주세요..."
          value={stagedMixDescription}
          onChange={(e) => setStagedMixDescription(e.target.value)}
          style={{ fontSize: '0.9rem', minHeight: '80px', resize: 'vertical' }}
        />
      </div>

      {stagedMixBlocks.length === 0 ? (
        <div className="mix-staging-empty">
          <p>왼쪽 라이브러리의 아이템이나 앨범 옆의 + 버튼을 눌러 믹스에 추가하세요.</p>
        </div>
      ) : (
        <div className="mix-blocks-list">
          {stagedMixBlocks.map((block) => (
            <div key={block.id} className="mix-block">
              <div className="mix-block-header">
                <h4>{block.type === 'album' ? `Album: ${block.title}` : `Item: ${block.title}`}</h4>
                <button
                  className="btn-remove-block"
                  onClick={() => removeMixBlock(block.id)}
                  title="Remove Block"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {block.items && block.items.length > 0 && (
                <ol className="mix-block-items">
                  {block.items.map((item, idx) => (
                    <li key={item.id || idx}>
                      {item.title || item.name || 'Untitled'}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
