import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';


const HomeHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <h1 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight drop-shadow-sm transition-colors duration-300 group-hover:text-green-900">
              <span className="bg-gradient-to-r from-green-500 via-emerald-400 to-green-700 bg-clip-text text-transparent">
                PuntoVenta
              </span>
              <span className="ml-2 text-gray-700 font-light">SaaS</span>
            </h1>
          </Link>
        </div>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
            Inicio
          </Link>
          <Link to="/planes" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
            Planes
          </Link>
          <Link to="/contacto" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
            Contacto
          </Link>
          <Link to="/soporte" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
            Soporte
          </Link>
          <Link
            to="/login"
            className="ml-6 px-4 py-2 rounded-md bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </nav>

        {/* Botón de menú móvil */}
        <div className="md:hidden flex items-center">
          <button
            className="inline-flex items-center justify-center p-2 rounded-md text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="sr-only">Abrir menú</span>
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Navegación Móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg border-t border-gray-100">
          <nav className="flex flex-col px-4 py-4 space-y-2">
            <Link
              to="/"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/planes"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Planes
            </Link>
            <Link
              to="/contacto"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contacto
            </Link>
            <Link
              to="/soporte"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Soporte
            </Link>
            <Link
              to="/login"
              className="mt-2 px-4 py-2 rounded-md bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default HomeHeader;
