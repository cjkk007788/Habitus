import React from 'react';
import './AnimatedText.css';

export default function AnimatedText({ text }) {
  if (!text) return null;
  // Use spread syntax [...text] instead of split('') to correctly handle emojis (surrogate pairs)
  return (
    <span className="animated-word">
      {[...text].map((char, index) => (
        <span 
          key={index} 
          className="animated-char" 
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}
