import React, { useState } from 'react';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([
    { 
      id: 1, 
      name: 'Juan Pérez', 
      email: 'juan@example.com', 
      role: 'Admin',
      status: 'Activo',
      lastLogin: '2023-04-25 14:30'
    },
    { 
      id: 2, 
      name: 'María López', 
      email: 'maria@example.com', 
      role: 'Vendedor',
      status: 'Activo',
      lastLogin: '2023-04-24 09:15'
    },
    { 
      id: 3, 
      name: 'Carlos Gómez', 
      email: 'carlos@example.com', 
      role: 'Inventario',
      status: 'Inactivo',
      lastLogin: '2023-04-20 11:45'
    },
    { 
      id: 4, 
      name: 'Ana Martínez', 
      email: 'ana@example.com', 
      role: 'Vendedor',
      status: 'Activo',
      lastLogin: '2023-04-25 08:30'
    },
    { 
      id: 5, 
      name: 'Roberto Díaz', 
      email: 'roberto@example.com', 
      role: 'Administrador',
      status: 'Activo',
      lastLogin: '2023-04-23 16:20'
    }
  ]);

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Gestión de Usuarios</h1>
        <button className="add-user-btn">
          <i className="fas fa-plus"></i> Nuevo Usuario
        </button>
      </div>

      <div className="users-filters">
        <div className="search-box">
          <input type="text" placeholder="Buscar usuarios..." />
          <button><i className="fas fa-search"></i></button>
        </div>
        <div className="filter-options">
          <select defaultValue="">
            <option value="">Todos los roles</option>
            <option value="Admin">Administrador</option>
            <option value="Vendedor">Vendedor</option>
            <option value="Inventario">Inventario</option>
          </select>
          <select defaultValue="all">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Último Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status === 'Activo' ? 'active' : 'inactive'}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.lastLogin}</td>
                <td className="actions">
                  <button className="edit-btn" title="Editar">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="delete-btn" title="Eliminar">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="users-pagination">
        <button disabled>&lt; Anterior</button>
        <span>Página 1 de 1</span>
        <button disabled>Siguiente &gt;</button>
      </div>
    </div>
  );
};

export default Users;