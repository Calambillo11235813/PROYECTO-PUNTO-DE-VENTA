import React from 'react';
import { Link } from 'react-router-dom';
import './Homeheader.css';

const Header = () => {
  return (
    <header className="home-header ">
        <nav className="header-nav">
        <div className="header-logo">
          <Link to="/">VentaFácil BO </Link>
        </div>
        
        <div className="header-links">
          <Link to="/">Inicio</Link>
          <Link to="/planes">Planes</Link>
          <Link to="/login" className="login-btn">Iniciar sesión</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;