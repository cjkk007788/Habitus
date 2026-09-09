import React, { useState } from 'react';
import LeftSidebar from '../components/LeftSidebar/LeftSidebar';
import RightSidebar from '../components/RightSidebar/RightSidebar';
import FloatingSearch from '../components/common/FloatingSearch/FloatingSearch';
import TopHeader from '../components/common/TopHeader/TopHeader';
import { Outlet } from 'react-router-dom';
import useSidebarStore from '../store/sidebar/useSidebarStore';
import './MainLayout.css';

//MainLayout is composed of 4 divided layout areas
export default function MainLayout() {
  const isRightSidebarOpen = useSidebarStore((state) => state.isRightSidebarOpen);

  return (
    <div className="main-layout">
      {/* Top Header */}
      <TopHeader />
      {/* Bottom 3-Split Area */}
      <div className="bottom-split-area">
        {/* Left Sidebar
        this style is define background of side bar width auto is fitted at sidebar component */}
        <div className="layout-left-sidebar">
          <LeftSidebar />
        </div>
        {/* Main Content Area */}
        <div className="layout-main-content" style={{ position: 'relative' }}>
          <div className="layout-outlet-container">
            <Outlet />
            {/* Habitus Footer Buffer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              padding: '60px 0 140px 0',
              opacity: 0.8,
              userSelect: 'none'
            }}>
              <span 
                className="logo"
                onMouseEnter={() => window.dispatchEvent(new CustomEvent('logoHover'))}
                onMouseLeave={() => window.dispatchEvent(new CustomEvent('logoLeave'))}
                style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '4px', color: 'var(--text-logo)', cursor: 'pointer' }}
              >
                HABITUS
              </span>
            </div>
          </div>
          <FloatingSearch />
        </div>
        {/* Right Sidebar (Dynamic) 
        In RightSidebar compomnent, we get the uiStore function tooggle switching
        & in rightsidebar the onclick {function} makes switching then right sidebar close or open 
        managed by uiStore using if condition
        */}
        <div className={`layout-right-sidebar-wrapper ${isRightSidebarOpen ? 'open' : 'closed'}`}>
          {/* 내부 컨테이너를 Transform으로 이동시켜 레이아웃 재계산(랙)을 방지 */}
          <div className={`layout-right-sidebar-inner ${isRightSidebarOpen ? 'open' : 'closed'}`}>
            <RightSidebar />
          </div>
        </div>
      </div>
    </div >
  );
}
