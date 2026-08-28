import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <>
      <div className="title_container">
      </div>
      <nav className="nav_menu">
        <ul>
          <li>
            <NavLink to="/digging">
              <h3>Digging</h3>
            </NavLink>
          </li>
          <li>
            <NavLink to="/archive">
              <h3>Archive</h3>
            </NavLink>
          </li>
          <li>
            <NavLink to="/social">
              <h3>Social</h3>
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}
