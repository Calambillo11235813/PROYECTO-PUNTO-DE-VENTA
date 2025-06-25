import api, { publicApi } from './apiClient';
import empleadoService from './EmpleadoService';

// Servicio de autenticación
const authService = {
  // Probar conexión con la API 
  testConnection: async () => {
    try {
      await publicApi.get('/accounts/');
      console.log('Conexión exitosa');
      return true;
    } catch (error) {
      // Si es un 404, aún consideramos que hay conexión
      if (error.response && error.response.status === 404) {
        console.log('Conexión OK (404 expected)');
        return true;
      }
      console.error('Error de conexión:', error);
      return false;
    }
  },
    
  register: async ({ nombre, correo, password, nombre_empresa, direccion, nit_empresa, role_id = 1 }) => {
    try {
      console.log('Intentando registro con:', { nombre, correo, password, nombre_empresa, direccion, nit_empresa, role_id });
      
      // Usamos publicApi para registro (no requiere autenticación)
      const response = await publicApi.post('/accounts/usuarios/', {
        nombre,
        correo,
        password,
        nombre_empresa,
        direccion,
        nit_empresa,
      });
      
      console.log('Registro exitoso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage = error.response?.data?.error || 'Error al conectar con el servidor';
      throw new Error(errorMessage);
    }
  },
  
  // Iniciar sesión
  login: async (correo, contrasena) => {
    console.log('Intentando login con:', { correo, contrasena });
    try {
      // Usar publicApi para evitar problemas con tokens anteriores
      const response = await publicApi.post('/accounts/login/', { 
        correo, 
        password: contrasena
      });
      const data = response.data;
      
      // Logs de depuración
      console.log('Estructura de la respuesta del servidor:');
      console.log('- data.usuario:', data.usuario);
      console.log('- data.usuario.rol:', data.usuario.rol);
      
      // Limpiar localStorage para evitar datos obsoletos
      localStorage.clear();
      
      // Guardar tokens en localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('id', data.usuario.id);
      localStorage.setItem('user_type', data.tipo);
      
      // También guardar los datos completos del usuario
      localStorage.setItem('user_data', JSON.stringify(data.usuario));
      
      // Normalizar y guardar el rol correctamente
      normalizeAndSaveRole(data.usuario);
      
      // También verificar si hay sucursales y obtener la primera si existe
      try {
        const sucursalService = await import('./SucursalService').then(m => m.default);
        const tieneSucursales = await sucursalService.hasSucursales();
        console.log('Usuario tiene sucursales:', tieneSucursales);
      } catch (sucursalError) {
        console.error('Error verificando sucursales durante login:', sucursalError);
      }
       console.log(data);
      return data;
      
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Error al iniciar sesión. Verifica tus credenciales.'
      );
    }
  },
  
  // Cerrar sesión
  logout: () => {
    localStorage.clear();
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return localStorage.getItem('access_token') !== null;
  },
  
  // Obtener información del usuario actual
  getCurrentUser: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Refrescar el token cuando expire
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No hay token de refresco disponible');
    
    try {
      // Usamos publicApi porque el token access ya expiró
      const response = await publicApi.post('/accounts/token/refresh/', {
        refresh: refreshToken
      });
      
      localStorage.setItem('access_token', response.data.access);
      return response.data;
    } catch (error) {
      // Si el token de refresco también expiró, cerrar sesión
      authService.logout();
      throw new Error('Sesión expirada, por favor inicie sesión nuevamente');
    }
  },
};

// Mejorar la función normalizeAndSaveRole
const normalizeAndSaveRole = (userData) => {
  let roleValue = null;
  
  // Verificar si hay un rol explícito
  if (userData.rol) {
    if (typeof userData.rol === 'object' && userData.rol.nombre) {
      roleValue = userData.rol.nombre;
    } else if (typeof userData.rol === 'string') {
      roleValue = userData.rol;
    } else if (typeof userData.rol === 'number') {
      roleValue = 'admin'; // Convertir ID de rol a "admin"
    }
  }
  
  // Si es tipo 'usuario' y no hay un rol específico, asignar 'admin'
  if (userData.tipo === 'usuario' && !roleValue) {
    roleValue = 'admin';
    console.log('Asignando rol admin por defecto para usuario principal');
  }
  
  // Garantizar que siempre haya un valor válido (nunca null)
  localStorage.setItem('rol', roleValue || 'admin');
  console.log('Rol normalizado guardado:', roleValue || 'admin');
  
  return roleValue || 'admin';
};

export default authService;