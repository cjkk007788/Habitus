import React from 'react';
import { X, Share } from 'lucide-react';
import useSidebarStore from '../../../store/sidebar/useSidebarStore';

export default function RightSidebarHeader() {
  const closeRightSidebar = useSidebarStore(state => state.closeRightSidebar);

  return (
    <div className="rs-header">
      <button className="rs-icon-btn" onClick={closeRightSidebar}>
        <X size={20} />
      </button>
      <span className="rs-title">Information & Archive</span>
      <button className="rs-icon-btn">
        <Share size={18} />
      </button>
    </div>
  );
}
