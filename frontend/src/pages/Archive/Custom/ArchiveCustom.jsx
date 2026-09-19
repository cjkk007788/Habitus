import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pin, Loader2, Plus } from 'lucide-react';
import { useCustomArchiveStore } from '../../../store/custom/useCustomArchiveStore';
import MasonryGrid from './components/Display/MasonryGrid';
import CustomPinCard from './components/Display/CustomPinCard';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import './ArchiveCustom.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'movie', label: 'Movie' },
  { id: 'book', label: 'Book' },
  { id: 'fusion', label: 'Fusion' },
];

export default function ArchiveCustom() {
  const { customAlbums, activeFilter, setActiveFilter, loadCustomAlbums, isLoading } = useCustomArchiveStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomAlbums();
  }, [loadCustomAlbums]);

  const handleCardClick = (album) => {
    navigate(`/archive/custom/${album.id}`);
  };

  const handleTogglePublic = async (album, e) => {
    e.stopPropagation();
    try {
      const { updateAlbum } = await import('../../../api/archiveApi');
      await updateAlbum(album.id, { is_public: !album.is_public });
      // Update local state temporarily
      useCustomArchiveStore.setState((state) => ({
        customAlbums: state.customAlbums.map(a => 
          a.id === album.id ? { ...a, is_public: !album.is_public } : a
        )
      }));
    } catch (err) {
      console.error('Failed to toggle public state', err);
      alert('공유 상태 변경에 실패했습니다.');
    }
  };

  return (
    <div className="archive-custom">
      <div className="custom-header">
        <div className="custom-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`custom-tab ${activeFilter === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter(tab.id);
                loadCustomAlbums(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link to="/archive/custom/create" className="create-pin-btn">
          <Plus size={18} />
          <span>Create Album</span>
        </Link>
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
              onTogglePublic={handleTogglePublic}
            />
          ))}
        </MasonryGrid>
      )}
    </div>
  );
}
