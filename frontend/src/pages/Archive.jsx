import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Archive.css';

export default function Archive() {
  return (
    <div className="archive-container">
      <div className="archive-header">
        <h1 className="archive-title">My Archive</h1>
        <div className="archive-tabs">
          <NavLink
            to="/archive/content"
            className={({ isActive }) => (isActive ? 'archive-tab active' : 'archive-tab')}
          >
            Content
          </NavLink>
          <NavLink
            to="/archive/report"
            className={({ isActive }) => (isActive ? 'archive-tab active' : 'archive-tab')}
          >
            Report
          </NavLink>
        </div>
      </div>

      <div className="archive-body">
        <Outlet />
      </div>
    </div>
  );
}
