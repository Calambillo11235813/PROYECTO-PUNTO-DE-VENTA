import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Homeheader.css';

const HomeHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <Link to="/" className="logo-link">
            <h1>PuntoVenta SaaS</h1>
          </Link>
        </div>

        {/* Menú de navegación desktop */}
        <nav className={`header-nav ${isMenuOpen ? 'header-nav-mobile' : ''}`}>
          <div className="header-links">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              Inicio
            </Link>
            <Link to="/planes" onClick={() => setIsMenuOpen(false)}>
              Planes
            </Link>
            <Link to="/contacto" onClick={() => setIsMenuOpen(false)}>
              Contacto
            </Link>
            <Link to="/soporte" onClick={() => setIsMenuOpen(false)}>
              Soporte
            </Link>
          </div>

          {/* Botones de acción - Solo login visible */}
          <div className="header-actions">
            <Link 
              to="/login" 
              className="login-btn"
              onClick={() => setIsMenuOpen(false)}
            >
              Iniciar Sesión
            </Link>
          </div>
        </nav>

        {/* Botón hamburguesa para móvil */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};

export default HomeHeader;
