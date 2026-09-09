import React from 'react';
import { PanelRight } from 'lucide-react';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';
import Navbar from '../Navbar/Navbar';
import './TopHeader.css';

export default function TopHeader() {
  const { toggleRightSidebar, isRightSidebarOpen } = useSidebarStore();

  return (
    <header className="top-header">
      <div className="top-header-left">
        <h1 
          className="logo"
          onMouseEnter={() => window.dispatchEvent(new CustomEvent('logoHover'))}
          onMouseLeave={() => window.dispatchEvent(new CustomEvent('logoLeave'))}
          style={{ cursor: 'pointer' }}
        >
          HABITUS
        </h1>
      </div>

      {/* Center: 네비게이션 탭 (Digging, Archive, Social) */}
      <div className="top-header-center">
        <Navbar />
      </div>

      <div className="top-header-right">
        <button
          className="sidebar-toggle-btn"
          onClick={toggleRightSidebar}
          title="Toggle right sidebar"
          style={{
            background: 'none', border: 'none',
            color: isRightSidebarOpen ? 'var(--accent-color)' : 'var(--text-secondary)',
            cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center'
          }}
        >
          <PanelRight size={22} />
        </button>
        <div className="profile-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
    </header>
  );
}
