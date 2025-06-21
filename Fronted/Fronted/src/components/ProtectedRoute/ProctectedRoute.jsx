import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import permisoAccesoService from '../../services/permisoAccesoService';

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
  const [tieneAcceso, setTieneAcceso] = useState(false);
  const [verificando, setVerificando] = useState(true);
  
  useEffect(() => {
    const verificarAcceso = async () => {
      if (!user) {
        setVerificando(false);
        return;
      }

      try {
        // Verificar si es usuario principal (no empleado)
        const userType = localStorage.getItem('user_type');
        if (userType === 'usuario') {
          console.log('Usuario principal: acceso concedido automáticamente');
          setTieneAcceso(true);
          setVerificando(false);
          return;
        }

        // Para empleados, obtener ID de usuario y rol del localStorage
        const usuarioId = localStorage.getItem('id');
        const rolId = localStorage.getItem('rol_id');
        
        console.log('Verificando acceso:');
        console.log('- Usuario ID:', usuarioId);
        console.log('- Rol ID:', rolId);
        console.log('- Ruta actual:', currentPath);
        
        // Verificar si el empleado tiene acceso a esta ruta
        const acceso = await permisoAccesoService.verificarAccesoRuta(
          usuarioId,
          rolId,
          currentPath
        );
        
        console.log('¿Tiene acceso?', acceso);
        setTieneAcceso(acceso);
      } catch (error) {
        console.error('Error al verificar acceso:', error);
        setTieneAcceso(false);
      } finally {
        setVerificando(false);
      }
    };

    verificarAcceso();
  }, [user, currentPath]);
  
  if (loading || verificando) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-lg">Verificando permisos...</span>
      </div>
    );
  }
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si tiene acceso, mostrar la ruta
  if (tieneAcceso) {
    return <Outlet />;
  }

  // Si no tiene acceso, redirigir según el rol
  const rolNombre = localStorage.getItem('rol');
  console.log(`Usuario con rol ${rolNombre} NO tiene acceso a ${currentPath}`);

  // Intentar obtener una ruta permitida para este usuario
  const obtenerRutaPermitida = async () => {
    const usuarioId = localStorage.getItem('id');
    const rolId = localStorage.getItem('rol_id');
    const rutasPermitidas = await permisoAccesoService.obtenerRutasPermitidas(usuarioId, rolId);
    
    if (rutasPermitidas.includes('*') || rutasPermitidas.includes('/admin')) {
      return '/admin'; // Si tiene acceso al dashboard
    }
    
    if (rutasPermitidas.length > 0) {
      return rutasPermitidas[0]; // Devolver la primera ruta permitida
    }
    
    return '/acceso-denegado';
  };

  // Para simplificar, usamos lógica condicional basada en el rol como fallback
  switch (rolNombre) {
    case 'Supervisor':
      return <Navigate to="/admin" replace />;
    case 'Cajero':
      return <Navigate to="/admin/ventas" replace />;
    case 'Gestion de inventario':
      return <Navigate to="/admin/inventario" replace />;
    default:
      return <Navigate to="/acceso-denegado" replace />;
  }
};
