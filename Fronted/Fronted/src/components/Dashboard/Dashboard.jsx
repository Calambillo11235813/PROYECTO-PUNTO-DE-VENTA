import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="home-dashboard">
      <h1>Panel de Control</h1>
      
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">120</div>
          <div className="stat-label">Ventas del día</div>
          <div className="stat-icon blue"><i className="fas fa-shopping-cart"></i></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">45</div>
          <div className="stat-label">Nuevos clientes</div>
          <div className="stat-icon green"><i className="fas fa-users"></i></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">$8,459</div>
          <div className="stat-label">Ingresos</div>
          <div className="stat-icon purple"><i className="fas fa-dollar-sign"></i></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">1,254</div>
          <div className="stat-label">Productos</div>
          <div className="stat-icon orange"><i className="fas fa-box"></i></div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-col">
          <div className="dashboard-card">
            <h3>Ventas Recientes</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#1234</td>
                  <td>Juan Pérez</td>
                  <td>Hoy, 14:30</td>
                  <td>$120.00</td>
                  <td><span className="badge success">Pagado</span></td>
                </tr>
                <tr>
                  <td>#1233</td>
                  <td>María López</td>
                  <td>Hoy, 13:25</td>
                  <td>$85.50</td>
                  <td><span className="badge success">Pagado</span></td>
                </tr>
                <tr>
                  <td>#1232</td>
                  <td>Carlos Gómez</td>
                  <td>Hoy, 11:20</td>
                  <td>$245.00</td>
                  <td><span className="badge warning">Pendiente</span></td>
                </tr>
                <tr>
                  <td>#1231</td>
                  <td>Ana Martínez</td>
                  <td>Hoy, 10:15</td>
                  <td>$65.75</td>
                  <td><span className="badge success">Pagado</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="dashboard-col">
          <div className="dashboard-card">
            <h3>Productos Populares</h3>
            <ul className="product-list">
              <li>
                <div className="product-info">
                  <div className="product-name">Laptop HP 15"</div>
                  <div className="product-details">SKU: LP-001 | Stock: 24</div>
                </div>
                <div className="product-sales">125 vendidos</div>
              </li>
              <li>
                <div className="product-info">
                  <div className="product-name">Monitor Samsung 24"</div>
                  <div className="product-details">SKU: MN-002 | Stock: 15</div>
                </div>
                <div className="product-sales">98 vendidos</div>
              </li>
              <li>
                <div className="product-info">
                  <div className="product-name">Mouse Logitech</div>
                  <div className="product-details">SKU: MS-003 | Stock: 42</div>
                </div>
                <div className="product-sales">87 vendidos</div>
              </li>
              <li>
                <div className="product-info">
                  <div className="product-name">Teclado Mecánico</div>
                  <div className="product-details">SKU: KB-004 | Stock: 12</div>
                </div>
                <div className="product-sales">65 vendidos</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;