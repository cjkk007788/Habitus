import React from 'react';
import { SORT_OPTIONS, TYPE_FILTERS } from '../constants';

export default function LeftSidebarFilters({
  sortOption,
  setSortOption,
  typeFilter,
  setTypeFilter
}) {
  return (
    <div className="sidebar_filter_bar">
      <select
        className="filter_select"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.key} value={opt.key}>{opt.label}</option>
        ))}
      </select>
      <select
        className="filter_select"
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      >
        {TYPE_FILTERS.map(opt => (
          <option key={opt.key} value={opt.key}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
