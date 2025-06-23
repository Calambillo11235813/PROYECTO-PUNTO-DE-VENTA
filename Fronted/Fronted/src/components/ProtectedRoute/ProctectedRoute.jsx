import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
// Importar el servicio de sucursales
import sucursalService from '../../services/SucursalService';

// Definimos las rutas permitidas por rol (con el cambio necesario)
const rolePermissions = {
  'undefined': ['*'], // Superusuario - acceso a todo como string
  undefined: ['*'],   // También manejamos el caso de undefined real
  'admin': ['*'],     // AÑADIDO: Explicitamente dar acceso completo al rol 'admin'
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
  const navigate = useNavigate();
  const [checkingSucursales, setCheckingSucursales] = useState(false);
  // Cambiar inicialización a false para forzar verificación
  const [hasSucursales, setHasSucursales] = useState(false);
  // Añadir un estado para prevenir redirecciones múltiples
  const [redirecting, setRedirecting] = useState(false);
  // NUEVO: Añadir al inicio del componente ProtectedRoute
  const [redirectCount, setRedirectCount] = useState(0);
  
  // Agregar logs para depuración
  useEffect(() => {
    if (user) {
      console.log('ProtectedRoute - Usuario autenticado:', user);
      console.log('ProtectedRoute - Ruta actual:', location.pathname);
    }
  }, [user, location.pathname]);
  
  // Verificar si el usuario tiene sucursales
  useEffect(() => {
    const checkSucursales = async () => {
      if (user) {
        setCheckingSucursales(true);
        console.log('ProtectedRoute - Verificando sucursales...');
        
        try {
          // Usar el servicio en lugar de axios directamente
          const token = localStorage.getItem('access_token');
          console.log('Token utilizado para verificar sucursales:', token ? token.substring(0, 15) + '...' : 'No token');
          
          const tieneSucursales = await sucursalService.hasSucursales();
          console.log('ProtectedRoute - Tiene sucursales:', tieneSucursales);
          
          setHasSucursales(tieneSucursales);
        } catch (error) {
          console.error('ProtectedRoute - Error verificando sucursales:', error);
          setHasSucursales(false);
        } finally {
          setCheckingSucursales(false);
        }
      }
    };
    
    checkSucursales();
  }, [user]); // Quitar location.pathname de las dependencias
  
  // NUEVO: Usar useEffect para manejar redirecciones de manera controlada
  useEffect(() => {
    // Si ya estamos en proceso de redirección, no hacer nada
    if (loading || checkingSucursales || redirecting) return;
    
    // NUEVO: Prevenir bucles de redirección
    if (redirectCount > 5) {
      console.error('⚠️ Demasiadas redirecciones detectadas. Posible bucle infinito.');
      console.error('⚠️ Limpiando datos de sucursal y deteniendo redirecciones.');
      
      // Limpiar localStorage completamente para las sucursales
      localStorage.removeItem('sucursal_actual_id');
      localStorage.removeItem('sucursal_actual_nombre');
      localStorage.removeItem('tiene_sucursales');
      localStorage.removeItem('last_sucursal_check');
      
      // Redirigir a primera-sucursal sin posibilidad de redirección inversa
      if (location.pathname !== '/primera-sucursal') {
        navigate('/primera-sucursal', { replace: true });
      }
      return;
    }
    
    // Solo ejecutamos lógica si tenemos usuario autenticado
    if (user) {
      // Obtenemos la URL actual
      const currentPath = location.pathname;
      
      // IMPORTANTE: Verificar si hay ID de sucursal en localStorage
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      const tieneSucursalesEnLocalStorage = !!sucursalId;
      
      // Usar la información de localStorage para determinar si tiene sucursales
      let shouldRedirect = false;
      let redirectTo = '';
      
      if (!tieneSucursalesEnLocalStorage && currentPath.startsWith('/admin')) {
        shouldRedirect = true;
        redirectTo = '/primera-sucursal';
        console.log('🔄 Usuario SIN sucursal en localStorage, redirigiendo a /primera-sucursal');
      } else if (tieneSucursalesEnLocalStorage && currentPath === '/primera-sucursal') {
        shouldRedirect = true;
        redirectTo = '/admin';
        console.log('🔄 Usuario CON sucursal en localStorage, redirigiendo a /admin');
      }
      
      // Solo redirigir si es necesario
      if (shouldRedirect && redirectTo) {
        console.log(`⚠️ Redirigiendo programáticamente a ${redirectTo} (Intento #${redirectCount + 1})`);
        setRedirectCount(prev => prev + 1); // Incrementar contador
        setRedirecting(true); // Prevenir redirecciones adicionales
        navigate(redirectTo, { replace: true });
        
        // Restablecer el estado después de la redirección
        setTimeout(() => {
          setRedirecting(false);
        }, 1000);
      }
    }
  }, [user, loading, checkingSucursales, location.pathname, redirecting, navigate, redirectCount]);

  // Si está cargando, muestra spinner
  if (loading || checkingSucursales) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // Si no hay usuario, redirige al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // IMPORTANTE: Retornamos Outlet directamente sin más lógica de redirección
  return <Outlet />;
};

export const AdminRoute = () => {
  // Utilizar el contexto para obtener el valor de hasSucursales
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // ELIMINAR la verificación duplicada de sucursales aquí
  // Usar un estado simple
  const [hasSucursales, setHasSucursales] = useState(true);
  
  useEffect(() => {
    // Verificar si hay sucursales solo una vez al montar el componente
    const checkOnce = async () => {
      try {
        // NUEVO: Verificar con tiempo de espera
        await new Promise(resolve => setTimeout(resolve, 300)); // Pequeño delay
        
        // Verificar si el usuario tiene sucursales propias
        const userId = localStorage.getItem('id');
        if (userId) {
          const sucursales = await sucursalService.getSucursalesByUsuario(userId);
          const tieneSucursales = sucursales && sucursales.length > 0;
          
          if (tieneSucursales && sucursales[0]) {
            // Asegurar que la sucursal actual pertenezca al usuario
            localStorage.setItem('sucursal_actual_id', sucursales[0].id);
            localStorage.setItem('sucursal_actual_nombre', sucursales[0].nombre);
          }
          
          setHasSucursales(tieneSucursales);
        } else {
          setHasSucursales(false);
        }
      } catch (error) {
        console.error('Error en verificación inicial:', error);
        setHasSucursales(false);
      }
    };
    
    checkOnce();
  }, []);
  
  // NUEVO: Verificar si hay ID de sucursal en localStorage
  const sucursalId = localStorage.getItem('sucursal_actual_id');
  const tieneSucursalesEnLocalStorage = !!sucursalId;
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si no tiene sucursales, redirigir a crear la primera
  if (!tieneSucursalesEnLocalStorage) {
    return <Navigate to="/primera-sucursal" replace />;
  }
  
  // Obtener el rol desde localStorage
  const userRole = localStorage.getItem('rol');
  
  // Verificar si el usuario tiene acceso a la ruta actual
  const hasAccess = () => {
    // Obtener el rol directamente del localStorage para evitar problemas de sincronización
    const userRole = localStorage.getItem('rol');
    console.log("Verificando acceso para rol:", userRole);

    // Si no hay información de rol, denegar acceso
    if (!userRole) {
      console.log("No se encontró información de rol");
      return false;
    }

    // Permitir acceso completo a administradores
    if (userRole.toLowerCase() === 'admin') {
      console.log("Acceso permitido: rol admin");
      return true;
    }

    // Acceso basado en el mapa de permisos
    const allowedRoutes = rolePermissions[userRole] || [];
    
    // Verificar si tiene permiso para todas las rutas
    if (allowedRoutes.includes('*')) {
      console.log(`Rol ${userRole} tiene acceso completo`);
      return true;
    }
    
    // Verificar acceso a la ruta específica
    const hasRouteAccess = allowedRoutes.some(route => {
      // Verificar acceso exacto o a subrutas
      if (currentPath === route) return true;
      if (currentPath.startsWith(route + '/')) return true;
      return false;
    });
    
    console.log(`Usuario con rol ${userRole} ${hasRouteAccess ? 'TIENE' : 'NO tiene'} acceso a ${currentPath}`);
    return hasRouteAccess;
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
        // Dentro del componente AdminRoute, antes de redireccionar por falta de acceso
        if (!hasAccess()) {
          console.log("==========================================");
          console.log("DIAGNÓSTICO DE ACCESO DENEGADO");
          console.log("------------------------------------------");
          console.log("Ruta solicitada:", currentPath);
          console.log("Rol en localStorage:", localStorage.getItem('rol'));
          console.log("Tipo de usuario:", localStorage.getItem('user_type'));
          console.log("Datos de usuario:", JSON.parse(localStorage.getItem('user_data') || '{}'));
          console.log("Permisos disponibles para este rol:", rolePermissions[localStorage.getItem('rol')] || []);
          console.log("==========================================");
          
          return <Navigate to="/acceso-denegado" replace />;
        }
        
        return <Navigate to="/acceso-denegado" replace />;
    }
  }
};
