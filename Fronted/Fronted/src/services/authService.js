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
    try {
      console.log('Intentando login con:', { correo, contrasena });
    
      // Elimina cualquier token previo para asegurar una solicitud limpia
      localStorage.removeItem('access_token');
      
      // Usar publicApi para login (no tiene autenticación previa)
      const response = await publicApi.post('/accounts/login/', { 
        correo: correo,
        password: contrasena
      });
      
      console.log('Login exitoso:', response.data);
      
      // Guardar tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Resto del código igual...
      if (response.data.tipo === "empleado") {
        localStorage.setItem('user_data', JSON.stringify(response.data.empleado));
        localStorage.setItem('empleado_id', response.data.empleado.id);
        console.log('Empleado ID:', response.data.empleado.id);
        const a = await empleadoService.getEmpleadoById(response.data.empleado.id);
        console.log('Empleado:', a);
        localStorage.setItem('id', a.usuario);

        console.log('ID de usuario 222:', a.usuario);
        localStorage.setItem('usuario_id', response.data.empleado.usuario);
        localStorage.setItem('user_type', 'empleado');

        localStorage.setItem('rol',response.data.empleado.rol);
        console.log('Rol:', response.data.empleado.rol);
    
      } else {
        localStorage.setItem('user_data', JSON.stringify(response.data.usuario));
        localStorage.setItem('id', response.data.usuario.id);
        localStorage.setItem('user_type', 'usuario');
        
        if (response.data.usuario.rol) {
          localStorage.setItem('rol', response.data.usuario.rol);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error completo:', error);
      const errorMessage = error.response?.data?.error || 'Error al conectar con el servidor';
      throw new Error(errorMessage);
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

export default authService;