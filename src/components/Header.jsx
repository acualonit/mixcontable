import React from 'react';
import { useLocation } from 'react-router-dom';

function Header({ onToggleSidebar, user, onLogout }) {
  const location = useLocation();
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Principal';
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  const displayName = user?.name || user?.email || 'Usuario';

  return (
    <div className="fixed-header">
      <div className="header-title">{getPageTitle()}</div>
      
      <div className="dropdown">
        <button 
          className="btn btn-link dropdown-toggle user-icon" 
          type="button" 
          id="userDropdown" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
        >
          <i className="bi bi-person-circle"></i>
        </button>
        <ul className="dropdown-menu" aria-labelledby="userDropdown">
          <li>
            <span className="dropdown-item-text fw-semibold">{displayName}</span>
          </li>
          <li><a className="dropdown-item" href="#">Perfil</a></li>
          <li>
            <button className="dropdown-item" type="button" onClick={onLogout}>
              Cerrar Sesión
            </button>
          </li>
        </ul>
      </div>
      
      <button className="toggle-btn" onClick={onToggleSidebar}>☰</button>
    </div>
  );
}

export default Header;