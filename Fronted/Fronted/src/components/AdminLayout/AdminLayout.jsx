import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../Contexts/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user } = useAuth();
  
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <header className="admin-header">
          <div className="header-search">
            <input type="text" placeholder="Buscar..." />
            <button><i className="fas fa-search"></i></button>
          </div>
          <div className="header-user">
            <span>{user?.name || 'Usuario'}</span>
            <img src="https://via.placeholder.com/40" alt="Avatar" />
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;