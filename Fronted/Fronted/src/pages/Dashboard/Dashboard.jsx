import React, { useState } from 'react';
import { FaBars, FaMoon, FaSun } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar/Sidebar';// Asegúrate de que esté en la misma carpeta o ajusta la ruta
import './Dashboard.css';

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Dashboard');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = (page) => {
    setActivePage(page);
    console.log('Navegar a:', page);
    // Aquí podrías agregar lógica para cambiar el contenido principal según la página
  };

  const handleLogout = () => {
    console.log('Cerrar sesión');
    // Lógica de logout
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      
      <Sidebar
        initialOpen={sidebarOpen}
        initialDarkMode={darkMode}
        onNavigation={handleNavigation}
        onDarkModeToggle={setDarkMode}
        onLogout={handleLogout}
        activePage={activePage}
      />

      {/* Contenido Principal */}
      <div className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
        <div className="header">
          <div className="left">
            {!sidebarOpen && (
              <button className="menu-btn" onClick={toggleSidebar}>
                <FaBars />
              </button>
            )}
            <h1>{activePage}</h1>
          </div>
          <div className="right">
            <button className="mobile-theme-toggle" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <div className="user-info">
              <img src="/api/placeholder/40/40" alt="User" className="user-avatar" />
              <span>Admin</span>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Aquí podrías hacer que cambie el contenido dinámicamente basado en `activePage`, pero te dejo lo que ya tenías */}
          {/* Resumen de ventas */}
          <div className="stats-container">
            <div className="stat-card">
              <h3>Ventas Hoy</h3>
              <p className="stat-value">$1,250.00</p>
              <p className="stat-change positive">+15% vs. ayer</p>
            </div>
            <div className="stat-card">
              <h3>Transacciones</h3>
              <p className="stat-value">42</p>
              <p className="stat-change positive">+8% vs. ayer</p>
            </div>
            <div className="stat-card">
              <h3>Ticket Promedio</h3>
              <p className="stat-value">$29.76</p>
              <p className="stat-change positive">+5% vs. ayer</p>
            </div>
            <div className="stat-card">
              <h3>Facturas Pendientes</h3>
              <p className="stat-value">7</p>
              <p className="stat-change negative">Requiere atención</p>
            </div>
          </div>

          {/* Gráfico de ventas y productos más vendidos */}
          <div className="charts-container">
            <div className="chart-card">
              <h3>Ventas de la Semana</h3>
              <div className="chart-placeholder">
                <img src="/api/placeholder/600/200" alt="Gráfico de Ventas" />
              </div>
            </div>
            <div className="chart-card">
              <h3>Productos Más Vendidos</h3>
              <ul className="top-products">
                <li><span className="product-name">Producto A</span><span className="product-sales">32 unidades</span></li>
                <li><span className="product-name">Producto B</span><span className="product-sales">28 unidades</span></li>
                <li><span className="product-name">Producto C</span><span className="product-sales">23 unidades</span></li>
                <li><span className="product-name">Producto D</span><span className="product-sales">19 unidades</span></li>
                <li><span className="product-name">Producto E</span><span className="product-sales">15 unidades</span></li>
              </ul>
            </div>
          </div>

          {/* Alertas de inventario y acciones rápidas */}
          <div className="bottom-container">
            <div className="inventory-alerts">
              <h3>Inventario Crítico</h3>
              <ul className="alerts-list">
                <li className="alert-item critical"><span>Producto X</span><span>2 unidades</span></li>
                <li className="alert-item warning"><span>Producto Y</span><span>5 unidades</span></li>
                <li className="alert-item warning"><span>Producto Z</span><span>8 unidades</span></li>
              </ul>
            </div>
            <div className="quick-actions">
              <h3>Acciones Rápidas</h3>
              <div className="actions-grid-d">
                <button className="action-btn-d">Nueva Venta</button>
                <button className="action-btn-d">Emitir Factura</button>
                <button className="action-btn-d">Agregar Producto</button>
                <button className="action-btn-d">Cierre de Caja</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
