import React from 'react';
import { Library } from 'lucide-react';

export default function LeftSidebarHeader({
  isCollapsed,
  setIsCollapsed,
  isAddMenuOpen,
  setIsAddMenuOpen,
  handleCreate
}) {
  return (
    <div className="sidebar_header">
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Library" : "Collapse Library"}
      >
        <Library size={24} color="#b3b3b3" />
        <h2>My library</h2>
      </div>

      <div style={{ position: 'relative' }}>
        <button className="add_btn" onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} title="Create New">+</button>

        {isAddMenuOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setIsAddMenuOpen(false)}
            />
            <div className="add-dropdown-menu">
              <button onClick={() => handleCreate('album')}>Adding new album</button>
              <button onClick={() => handleCreate('mix')}>Adding new mix</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
