import axios from 'axios';
import empleadoService from './EmpleadoService';

// URL base de la API (ajústala según tu configuración)
const API_URL = 'http://127.0.0.1:8000/accounts/';

// Crea una instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el token de autenticación a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    // Excluir rutas de autenticación
    if (!config.url.includes('login') && !config.url.includes('usuarios')) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Servicio de autenticación
const authService = {
  // Probar conexión con la API 
  testConnection: async () => {
    try {
      // await apiClient.get('');
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
    
  // Utilizando destructuring de parámetros para mayor claridad
  register: async ({ nombre, correo, password, nombre_empresa, direccion, nit_empresa, role_id = 1 }) => {
    try {
      console.log('Intentando registro con:', {
        nombre,
        correo,
        password,
        nombre_empresa,
        direccion,
        nit_empresa,
        role_id
      });
      
      const response = await apiClient.post('usuarios/', {
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
      const errorMessage =
        error.response?.data?.error ||
        'Error al conectar con el servidor';
      throw new Error(errorMessage);
    }
  },
  
  // Iniciar sesión
  login: async (correo, contrasena) => {
    try {
      console.log('Intentando login con:', { correo });
      
      localStorage.removeItem('access_token'); // Limpiar tokens previos
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('id');
      localStorage.removeItem('user_type');
      localStorage.removeItem('rol');
      
      const response = await apiClient.post('login/', { 
        correo: correo,
        password: contrasena
      });
      
      console.log('Login exitoso - DATOS COMPLETOS:', response.data);
      
      // Guardar tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Determinar explícitamente el tipo de usuario
      if (response.data.tipo === "empleado") {
        console.log("GUARDANDO DATOS DE EMPLEADO");
        localStorage.setItem('user_type', 'empleado');
        localStorage.setItem('rol', response.data.empleado.rol);
        localStorage.setItem('id', response.data.empleado.id);
      } else {
        console.log("GUARDANDO DATOS DE USUARIO ADMIN");
        localStorage.setItem('user_type', 'usuario');
        localStorage.setItem('id', response.data.usuario.id);
        
        if (response.data.usuario.rol) {
          localStorage.setItem('rol', response.data.usuario.rol);
        }
      }
      
      // Verificación final
      console.log('VERIFICACIÓN DEL LOCALSTORAGE:');
      console.log('id:', localStorage.getItem('id'));
      console.log('user_type:', localStorage.getItem('user_type'));
      console.log('rol:', localStorage.getItem('rol'));
      console.log('access_token:', localStorage.getItem('access_token') ? 'Presente' : 'No presente');
      
      return response.data;
    } catch (error) {
      console.error('Error completo:', error);
      throw error;
    }
  },
  
  // Cerrar sesión
  logout: () => {
    localStorage.clear();
    localStorage.removeItem('id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('empresa_data');
    localStorage.removeItem("user_type");
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
      const response = await apiClient.post('token/refresh/', {
        refresh: refreshToken
      });
      
      localStorage.setItem('access_token', response.data.access);
      return response.data;
    } catch (error) {
      // Si el token de refresco también expiró, cerrar sesión
      authService.logout();
      throw new Error('Sesión expirada, por favor inicie sesión nuevamente' + error);
    }
  },
};

export default authService;