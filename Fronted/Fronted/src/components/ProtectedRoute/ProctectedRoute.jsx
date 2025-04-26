import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    // Mostrar un indicador de carga mientras se verifica la autenticación
    return <div>Cargando...</div>;
  }
  
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // Si está autenticado, mostrar el contenido
  return <Outlet />;
};

export const AdminRoute = () => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si no es admin, redirigir a la página principal
  if (!isAdmin()) {
    return <Navigate to="/" />;
  }
  
  // Si es admin, mostrar el contenido
  return <Outlet />;
};

 