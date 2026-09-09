import React, { useEffect, useState } from 'react';
import './BookmarkMenu.css';

export default function BookmarkMenu({ sections }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!sections || sections.length === 0) return;

    // Use IntersectionObserver to determine the active section based on scroll position
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: document.querySelector('.layout-outlet-container'),
        // triggers when an element crosses the middle 40% of the screen
        rootMargin: '-30% 0px -30% 0px', 
        threshold: 0,
      }
    );

    // Minor delay to ensure DOM nodes are rendered before observing
    setTimeout(() => {
      sections.forEach((section) => {
        const el = document.getElementById(section.id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => observer.disconnect();
  }, [sections]);

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    const container = document.querySelector('.layout-outlet-container');
    if (el && container) {
      // scroll manually to account for sticky headers or general spacing
      const topPos = el.offsetTop - 80;
      container.scrollTo({
        top: topPos > 0 ? topPos : 0,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  if (!sections || sections.length === 0) return null;

  return (
    <div className="bookmark-menu">
      {sections.map((section) => (
        <div
          key={section.id}
          className={`bookmark-item ${activeId === section.id ? 'active' : ''}`}
          onClick={() => handleScrollTo(section.id)}
          title={section.title}
        >
          <span className="bookmark-label">{section.title}</span>
          <div className="bookmark-dot" />
        </div>
      ))}
    </div>
  );
}
