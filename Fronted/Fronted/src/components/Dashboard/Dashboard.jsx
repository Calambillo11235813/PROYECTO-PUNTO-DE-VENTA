import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  // Obtenemos el contexto del AdminLayout 
  const [darkMode, toggleDarkMode, activePage, setActivePage] = useOutletContext();

  // Aseguramos que el título de la página sea "Dashboard"
  useEffect(() => {
    setActivePage("Dashboard");
  }, [setActivePage]);

  return (
    <div className="dashboard-content">
      {/* Cards de estadísticas */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Ventas del día</h3>
          <div className="stat-value">120</div>
          <p className="stat-change positive">+15% vs. ayer</p>
        </div>

        <div className="stat-card">
          <h3>Transacciones</h3>
          <div className="stat-value">42</div>
          <p className="stat-change positive">+8% vs. ayer</p>
        </div>

        <div className="stat-card">
          <h3>Ticket Promedio</h3>
          <div className="stat-value">$29.75</div>
          <p className="stat-change positive">+5% vs. ayer</p>
        </div>

        <div className="stat-card">
          <h3>Facturas Pendientes</h3>
          <div className="stat-value">7</div>
          <p className="stat-change negative">Requiere atención</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Ventas de la Semana</h3>
          <div className="chart-placeholder">
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(to right, #4CAF50, #2196F3)",
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: "16px" }}>
                Gráfico de Ventas
              </span>
            </div>
          </div>
        </div>
        <div className="chart-card">
          <h3>Productos Más Vendidos</h3>
          <ul className="top-products">
            <li>
              <span className="product-name">Laptop HP 15"</span>
              <span className="product-sales">125 vendidos</span>
            </li>
            <li>
              <span className="product-name">Monitor Samsung 24"</span>
              <span className="product-sales">98 vendidos</span>
            </li>
            <li>
              <span className="product-name">Mouse Logitech</span>
              <span className="product-sales">87 vendidos</span>
            </li>
            <li>
              <span className="product-name">Teclado Mecánico</span>
              <span className="product-sales">65 vendidos</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Contenedores inferiores */}
      <div className="bottom-container">
        <div className="inventory-alerts">
          <h3>Alertas de Inventario</h3>
          <ul className="alerts-list">
            <li className="alert-item critical">
              <span>Mouse Inalámbrico - Stock crítico (2)</span>
              <span>Mínimo: 10</span>
            </li>
            <li className="alert-item warning">
              <span>Pantalla Táctil - Stock bajo (8)</span>
              <span>Mínimo: 15</span>
            </li>
            <li className="alert-item critical">
              <span>Cable HDMI - Sin stock</span>
              <span>Mínimo: 25</span>
            </li>
          </ul>
        </div>
        <div className="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div className="actions-grid-d">
            <button className="action-btn-d">Nueva Venta</button>
            <button className="action-btn-d">Nuevo Producto</button>
            <button className="action-btn-d">Nueva Factura</button>
            <button className="action-btn-d">Reportes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
