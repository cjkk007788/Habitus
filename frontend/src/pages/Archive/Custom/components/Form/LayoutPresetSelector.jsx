import React from 'react';
import './LayoutPresetSelector.css';

const PRESETS = [
  { id: 'classic', label: 'Classic', desc: 'Standard pinboard layout' },
  { id: 'editorial', label: 'Editorial', desc: 'Magazine cover style text overlay' },
  { id: 'minimal', label: 'Minimal', desc: 'Typography-focused simplicity' },
];

export default function LayoutPresetSelector({ layout, onChange }) {
  return (
    <div className="layout-preset-selector">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`preset-btn ${layout === preset.id ? 'active' : ''}`}
          onClick={() => onChange(preset.id)}
        >
          <div className={`preset-thumbnail preset-thumbnail--${preset.id}`}>
            {/* 미니 썸네일 구조 */}
            {preset.id === 'classic' && (
              <>
                <div className="thumb-img" />
                <div className="thumb-text-1" />
                <div className="thumb-text-2" />
              </>
            )}
            {preset.id === 'editorial' && (
              <>
                <div className="thumb-img full">
                  <div className="thumb-text-1 over" />
                  <div className="thumb-text-2 over" />
                </div>
              </>
            )}
            {preset.id === 'minimal' && (
              <>
                <div className="thumb-text-1 center" />
                <div className="thumb-text-2 center" />
                <div className="thumb-accent" />
              </>
            )}
          </div>
          <div className="preset-info">
            <span className="preset-label">{preset.label}</span>
            <span className="preset-desc">{preset.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
