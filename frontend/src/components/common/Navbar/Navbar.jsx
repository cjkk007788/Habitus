import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useSearchStore from '../../../store/search/useSearchStore';
import AnimatedText from '../AnimatedText/AnimatedText';
import './Navbar.css';

export default function Navbar() {
  const { setSearchFilter } = useSearchStore();
  const navigate = useNavigate();
  const [randomAnimateIdx, setRandomAnimateIdx] = useState(null);

  useEffect(() => {
    const handleHover = () => {
      setRandomAnimateIdx(Math.floor(Math.random() * 3));
    };
    const handleLeave = () => {
      setRandomAnimateIdx(null);
    };

    window.addEventListener('logoHover', handleHover);
    window.addEventListener('logoLeave', handleLeave);
    return () => {
      window.removeEventListener('logoHover', handleHover);
      window.removeEventListener('logoLeave', handleLeave);
    };
  }, []);

  const handleFilterClick = (filter) => {
    setSearchFilter(filter);
    navigate('/digging');
  };

  return (
    <>
      <nav className="nav_menu">
        <ul>
          <li className="nav-item has-dropdown">
            <NavLink to="/digging" className={randomAnimateIdx === 0 ? 'force-animate' : ''}>
              <h3><AnimatedText text="Digging" /></h3>
            </NavLink>
            <div className="nav-dropdown">
              <button onClick={() => handleFilterClick('music')} className="dropdown-item">Music</button>
              <button onClick={() => handleFilterClick('movie')} className="dropdown-item">Movie</button>
              <button onClick={() => handleFilterClick('book')} className="dropdown-item">Book</button>
            </div>
          </li>
          <li className="nav-item has-dropdown">
            <NavLink to="/archive/content" className={randomAnimateIdx === 1 ? 'force-animate' : ''}>
              <h3><AnimatedText text="Archive" /></h3>
            </NavLink>
            <div className="nav-dropdown">
              <NavLink to="/archive/content" className="dropdown-item">Content</NavLink>
              <NavLink to="/archive/report" className="dropdown-item">Report</NavLink>
              <NavLink to="/archive/custom" className="dropdown-item">Custom</NavLink>
            </div>
          </li>
          <li className="nav-item">
            <NavLink to="/social" className={randomAnimateIdx === 2 ? 'force-animate' : ''}>
              <h3><AnimatedText text="Social" /></h3>
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}
