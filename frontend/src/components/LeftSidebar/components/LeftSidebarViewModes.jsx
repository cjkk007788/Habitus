import React from 'react';
import { VIEW_MODES } from '../constants';

export default function LeftSidebarViewModes({ viewMode, setViewMode }) {
  return (
    <div className="sidebar_view_modes">
      {VIEW_MODES.map(mode => (
        <button
          key={mode.key}
          className={`view_mode_chip ${viewMode === mode.key ? 'active' : ''}`}
          onClick={() => setViewMode(mode.key)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
