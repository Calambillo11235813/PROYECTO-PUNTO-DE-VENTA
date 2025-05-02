import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white py-4 px-8 shadow-md font-semibold">
      <nav className="flex justify-between items-center max-w-screen-xl mx-auto">
        <div className="text-2xl font-bold text-gray-800">
          <Link to="/">VentaFácil BO</Link>
        </div>
        
<<<<<<< HEAD
        <div className="header-links">
          <Link to="/">Inicio</Link>
          <Link to="/planes">Planes</Link>
          <Link to="/register" className="register-btn">Registrarse</Link>
          <Link to="/login" className="login-btn">Iniciar sesión</Link>
=======
        <div className="flex gap-8 items-center">
          <Link to="/" className="text-gray-800 hover:text-green-500 transition-colors duration-300">Inicio</Link>
          <Link to="/planes" className="text-gray-800 hover:text-green-500 transition-colors duration-300">Planes</Link>
          <Link to="/register" className="bg-white text-green-500 border border-green-500 py-2 px-6 rounded-lg hover:bg-green-500 hover:text-white transition-colors duration-300">Registrarse</Link>
          <Link to="/login" className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition-colors duration-300">Iniciar sesión</Link>
>>>>>>> origin/Diogo
        </div>
      </nav>
    </header>
  );
};

export default Header;
