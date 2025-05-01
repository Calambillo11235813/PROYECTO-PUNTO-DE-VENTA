import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  console.log('user:', user, 'loading:', loading);
  if (loading) {
    // Mostrar un indicador de carga mientras se verifica la autenticación
    return <div>Cargando...</div>;
  }
  
  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Si está autenticado, mostrar el contenido
  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (user) {
      console.log('Datos del usuario para verificación admin:', user);
    }
  }, [user]);
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Verificación más robusta que maneja diferentes estructuras de datos
  const isAdmin = user && (
    // Verificar is_staff
    user.is_staff === true ||
    // O verificar el rol (múltiples opciones)
    (user.rol && (
      // Por nombre (con múltiples variantes posibles)
      user.rol.nombre === 'admin' || 
      user.rol.nombre === 'Admin' || 
      user.rol.nombre === 'Administrador' ||
      // O por nombre_rol 
      user.rol.nombre_rol === 'Administrador' ||
      // O por ID
      user.rol.id === 1
    ))
  );
  
  console.log('Verificación de admin:', {
    user: user ? {...user, contraseña: '[REDACTADO]'} : null,
    isAdmin,
    rol: user?.rol
  });
  
  // Si no es admin, redirigir a la página principal
  if (!isAdmin) {
    return <Navigate to="/" />;
    
  }
  console.log('es admin');
  // Si es admin, mostrar el contenido
  return <Outlet />;
};
 