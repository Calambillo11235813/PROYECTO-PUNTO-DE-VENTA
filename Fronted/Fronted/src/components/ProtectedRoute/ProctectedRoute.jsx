import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Definimos las rutas permitidas por rol
const rolePermissions = {
  'undefined': ['*'], // Superusuario - acceso a todo como string
  undefined: ['*'],   // También manejamos el caso de undefined real
  Supervisor: [
    '/admin',
    '/admin/inventario',
    '/admin/ventas',
    '/admin/Lista_ventas',
    '/admin/pedidos',
    '/admin/facturacion',
    '/admin/reportes'
  ],
  Cajero: [
    '/admin/ventas',
    '/admin/Lista_ventas',
    '/admin/pedidos',
    '/admin/clientes',
    '/admin/caja'

  ],
  'Gestion de inventario': [
    '/admin/inventario'
  ]
};

export const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log("ProtectedRoute - Token presente:", !!token);
    setIsAuthenticated(!!token);
  }, []);
  
  // Mientras se verifica la autenticación
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(null);
  
  useEffect(() => {
    try {
      const userType = localStorage.getItem("user_type");
      const hasAccess = userType === "usuario" || 
                        (localStorage.getItem("rol") === "admin");
      
      console.log("AdminRoute - Verificación:", {
        userType,
        hasAccess
      });
      
      setIsAdmin(hasAccess);
    } catch (err) {
      console.error("Error al verificar permisos de admin:", err);
      setIsAdmin(false);
    }
  }, []);
  
  // Mientras se verifica
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }
  
  return isAdmin ? <Outlet /> : <Navigate to="/acceso-denegado" replace />;
};
