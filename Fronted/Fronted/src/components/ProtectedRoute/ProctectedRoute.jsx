import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

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
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  
  useEffect(() => {
    if (user) {
      console.log('Datos del usuario para verificación:', user);
      console.log('Ruta actual:', currentPath);
      console.log('Rol del usuario:', localStorage.getItem('rol'));
    }
  }, [user, currentPath]);
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Obtener el rol desde localStorage
  const userRole = localStorage.getItem('rol');
  
  // Verificar si el usuario tiene acceso a la ruta actual
  const hasAccess = () => {
    // Si el rol es "undefined" (como string) o es null/undefined, considerarlo superadmin
    if (!userRole || userRole === 'undefined') {
      return true;
    }
    
    const allowedPaths = rolePermissions[userRole] || [];
    
    // Si tiene acceso a todas las rutas
    if (allowedPaths.includes('*')) {
      return true;
    }
    
    // Verificar si la ruta actual está en las rutas permitidas o si es una subruta
    return allowedPaths.some(path => currentPath === path || currentPath.startsWith(`${path}/`));
  };
  
  if (hasAccess()) {
    console.log(`Usuario con rol ${userRole} tiene acceso a ${currentPath}`);
    return <Outlet />;
  } else {
    console.log(`Usuario con rol ${userRole} NO tiene acceso a ${currentPath}`);
    
    // Redirecciones basadas en el rol
    switch (userRole) {
      case 'Supervisor':
        return <Navigate to="/admin" replace />;
      case 'Cajero':
        return <Navigate to="/admin/ventas" replace />;
      case 'Gestion de inventario':
        return <Navigate to="/admin/inventario" replace />;
      default:
        return <Navigate to="/acceso-denegado" replace />;
    }
  }
};
