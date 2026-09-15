import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pin, Loader2 } from 'lucide-react';
import { useCustomArchiveStore } from '../../../store/custom/useCustomArchiveStore';
import MasonryGrid from './components/Display/MasonryGrid';
import CustomPinCard from './components/Display/CustomPinCard';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import './ArchiveCustom.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Custom' },
  { id: 'music', label: 'Music' },
  { id: 'movie', label: 'Movie' },
  { id: 'book', label: 'Book' },
];

export default function ArchiveCustom() {
  const { customAlbums, activeFilter, setActiveFilter, loadCustomAlbums, isLoading } = useCustomArchiveStore();
  const openRightSidebar = useSidebarStore(state => state.openRightSidebar);

  useEffect(() => {
    loadCustomAlbums();
  }, [loadCustomAlbums]);

  const handleCardClick = (album) => {
    // 사이드바에 띄우기 (커스텀 핀은 Album 타입)
    openRightSidebar({
      ...album,
      _viewType: 'album' // 우측 사이드바가 앨범 모드로 열리도록 힌트
    });
  };

  return (
    <div className="archive-custom">
      <div className="custom-header">
      </div>
      {isLoading ? (
        <div className="custom-loading">
          <Loader2 className="spinner" size={32} />
          <p>Loading...</p>
        </div>
      ) : customAlbums.length === 0 ? (
        <div className="custom-empty">
          <Pin size={48} opacity={0.3} />
          <h2>No albums saved yet.</h2>
          <p>Create your first album to start archiving!</p>
          <Link to="/archive/custom/create" className="create-pin-btn-large">
            Create Album
          </Link>
        </div>
      ) : (
        <MasonryGrid className="custom-grid">
          {customAlbums.map(album => (
            <CustomPinCard
              key={album.id}
              album={album}
              onClick={handleCardClick}
            />
          ))}
        </MasonryGrid>
      )}
    </div>
  );
}
