import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AnimatedText from '../../components/common/AnimatedText/AnimatedText';
import './Archive.css';

export default function Archive() {
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const currentTab = pathParts[pathParts.length - 1] || 'Archive';

  return (
    <div className="archive-container">
      <div className="archive-header">
        <h1 className="archive-title hover-trigger" style={{ fontSize: '2.5rem', fontWeight: '800', textTransform: 'capitalize', cursor: 'default' }}>
          <AnimatedText text={currentTab} />
        </h1>
      </div>

      <div className="archive-body">
        <Outlet />
      </div>
    </div>
  );
}
