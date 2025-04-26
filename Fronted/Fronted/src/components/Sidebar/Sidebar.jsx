import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaChartBar, 
  FaShoppingCart, 
  FaBoxOpen, 
  FaUsers, 
  FaFileInvoiceDollar, 
  FaCog, 
  FaSun, 
  FaMoon, 
  FaSignOutAlt 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ 
  initialOpen = true, 
  initialDarkMode = false, 
  onNavigation = () => {}, 
  onDarkModeToggle = () => {}, 
  onLogout = () => {}, 
  activePage = 'Dashboard' 
}) => {
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const navigate = useNavigate();

  useEffect(() => {
    onDarkModeToggle(darkMode);
  }, [darkMode, onDarkModeToggle]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNavigation = useCallback((page) => {
    const routeMap = {
      'Dashboard': '/dashboard',
      'Ventas': '/ventas',
      'Inventario': '/inventory',
      'Clientes': '/clientes',
      'Facturacion': '/facturacion',
      'Reportes': '/reportes',
      'Configuracion': '/configuracion',
    };

    const path = routeMap[page] || '/';
    navigate(path);
    onNavigation(page);
  }, [navigate, onNavigation]);

  const menuItems = [
    { id: 'Dashboard', icon: <FaChartBar className="icon" />, text: 'Dashboard' },
    { id: 'Ventas', icon: <FaShoppingCart className="icon" />, text: 'Ventas' },
    { id: 'Inventario', icon: <FaBoxOpen className="icon" />, text: 'Inventario' },
    { id: 'Clientes', icon: <FaUsers className="icon" />, text: 'Clientes' },
    { id: 'Facturacion', icon: <FaFileInvoiceDollar className="icon" />, text: 'Facturación' },
    { id: 'Reportes', icon: <FaChartBar className="icon" />, text: 'Reportes' },
    { id: 'Configuracion', icon: <FaCog className="icon" />, text: 'Configuración' },
  ];

  return (
    <div className={`sidebar ${initialOpen ? 'open' : ''}`}> {/* Usar initialOpen si se quiere controlar la visibilidad */}
      <div className="sidebar-header">
        <h2>POS System</h2>
      </div>
      
      <div className="sidebar-menu">
        {menuItems.map(item => (
          <a 
            key={item.id}
            href="#"
            className={`menu-item ${activePage === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation(item.id);
            }}
          >
            {item.icon}
            <span className="text">{item.text}</span>
          </a>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? <FaSun className="icon" /> : <FaMoon className="icon" />}
          <span className="text">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>
        <a 
          href="#"
          className="menu-item"
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
        >
          <FaSignOutAlt className="icon" />
          <span className="text">Cerrar Sesión</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
